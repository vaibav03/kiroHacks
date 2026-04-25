# Implementation Plan — HistorAI Tutor App

---

## Tech Stack Decisions

| Layer | Choice | Rationale |
|---|---|---|
| Frontend framework | Next.js 14 (App Router) | API routes co-located with UI, RSC for fast initial load, no separate Express server needed |
| Runtime | Node.js 20 LTS | AWS SDK v3 requires Node ≥ 18; 20 is stable and widely supported |
| Language | TypeScript 5 | Type safety across API routes and React components |
| Styling | Tailwind CSS + CSS Modules | Utility classes for layout, CSS Modules for per-avatar keyframe animations |
| Vector store sidecar | Python 3.11 + FastAPI + Chroma 0.4.x | Chroma's Python client is the most stable; FastAPI gives a lightweight HTTP wrapper |
| AWS SDK | @aws-sdk/client-bedrock-runtime, @aws-sdk/client-polly, @aws-sdk/client-transcribe-streaming (v3) | Modular v3 bundles reduce cold-start size |
| PDF extraction | pdf-parse (Node) | Simple, no native deps, works in Next.js API routes |
| Gemini client | @google/generative-ai | Official SDK, supports gemini-1.5-flash |
| State management | React Context + sessionStorage | Minimal; no Redux needed for single-user demo |
| KB build script | Python 3.11 + boto3 + chromadb | Matches sidecar environment; boto3 for Titan embeddings |

---

## AWS Services and Model IDs

| Service | Model / Resource | Region |
|---|---|---|
| AWS Bedrock — LLM primary | `anthropic.claude-3-5-sonnet-20241022-v2:0` | us-west-2 |
| AWS Bedrock — LLM fallback | `anthropic.claude-3-haiku-20240307-v1:0` | us-west-2 |
| AWS Bedrock — Embeddings | `amazon.titan-embed-text-v2:0` | us-west-2 |
| AWS Polly — TTS | Neural engine; voices: Matthew, Joey, Kevin, Brian | us-west-2 |
| AWS Transcribe Streaming | WebSocket streaming API | us-west-2 |

---

## Project Folder Structure

```
historai-tutor-app/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout, fonts, global CSS
│   ├── page.tsx                  # Home page (hero + domain cards)
│   ├── globals.css               # Parchment texture, CSS variables
│   └── api/
│       ├── chat/route.ts         # POST /api/chat
│       ├── voice/route.ts        # POST /api/voice (WebSocket proxy)
│       ├── tts/route.ts          # POST /api/tts
│       ├── validate-pdf/route.ts # POST /api/validate-pdf
│       └── session/[id]/route.ts # GET /api/session/:id
├── components/
│   ├── Nav.tsx                   # Sticky nav, Comic/Game links
│   ├── DomainCard.tsx            # Home page domain card
│   ├── TutorPage.tsx             # Split layout wrapper
│   ├── ChatPanel.tsx             # Chat history + input bar
│   ├── PdfUpload.tsx             # PDF upload control
│   ├── avatars/
│   │   ├── EinsteinAvatar.tsx    # CSS-drawn Einstein
│   │   ├── LincolnAvatar.tsx     # CSS-drawn Lincoln
│   │   ├── MozartAvatar.tsx      # CSS-drawn Mozart
│   │   └── ShakespeareAvatar.tsx # CSS-drawn Shakespeare
│   └── AudioPlayer.tsx           # AudioContext + AnalyserNode wrapper
├── context/
│   └── AppContext.tsx            # React Context: domain, tutor, pdfValidated, sessionId
├── lib/
│   ├── rag.ts                    # RAG pipeline: retrieve + generate
│   ├── tts.ts                    # TTSProvider abstraction
│   ├── transcription.ts          # TranscriptionService abstraction
│   ├── chroma.ts                 # Chroma sidecar HTTP client
│   ├── bedrock.ts                # Bedrock client factory
│   ├── personas.ts               # System prompts + domain constraints per tutor
│   └── tutors.ts                 # Hardcoded tutor/domain/voice/color config
├── data/
│   ├── kb/
│   │   ├── einstein/             # *.txt source files
│   │   ├── lincoln/
│   │   ├── mozart/
│   │   └── shakespeare/
│   └── chroma/                   # Persistent Chroma DB (git-ignored)
├── scripts/
│   ├── build_kb.py               # Chunk → embed → write to Chroma
│   └── requirements.txt          # boto3, chromadb, tiktoken
├── sidecar/
│   ├── main.py                   # FastAPI app exposing Chroma query + health
│   └── requirements.txt          # fastapi, uvicorn, chromadb
├── public/                       # Static assets (fonts only, no images)
├── .env.local                    # All secrets (git-ignored)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Build Order — 7-Hour Window

| # | Task | Est. Time | Notes |
|---|---|---|---|
| 1 | Repo init, Next.js 14 scaffold, Tailwind, env setup | 20 min | `npx create-next-app@latest` |
| 2 | `lib/tutors.ts` — hardcoded config (domains, voices, colors, personas) | 15 min | Single source of truth |
| 3 | `lib/personas.ts` — system prompts for all 4 tutors | 20 min | Write in-character prompts with domain constraints |
| 4 | Chroma sidecar (`sidecar/main.py`) + health endpoint | 20 min | FastAPI, `/health`, `/query` |
| 5 | KB source text files (`data/kb/*/`) — 4 characters | 30 min | Copy Wikipedia + primary source excerpts |
| 6 | `scripts/build_kb.py` — chunk, embed, write | 30 min | Run once; verify chunk counts |
| 7 | `lib/bedrock.ts`, `lib/chroma.ts` client wrappers | 15 min | |
| 8 | `lib/rag.ts` — retrieve top 5 + Claude invoke + citations | 40 min | Core pipeline |
| 9 | `app/api/chat/route.ts` | 20 min | Wire RAG pipeline |
| 10 | `lib/tts.ts` + `app/api/tts/route.ts` | 25 min | Polly Neural, voice map |
| 11 | `lib/transcription.ts` + `app/api/voice/route.ts` | 30 min | Transcribe WebSocket proxy + whisper.cpp fallback |
| 12 | `app/api/validate-pdf/route.ts` | 25 min | pdf-parse + Gemini classifier |
| 13 | `app/api/session/[id]/route.ts` | 10 min | Simple in-memory session map |
| 14 | `context/AppContext.tsx` | 15 min | |
| 15 | Home page (`app/page.tsx`) + `DomainCard.tsx` | 30 min | Hero, 4 cards, accent colors |
| 16 | `Nav.tsx` — sticky, conditional Comic/Game links | 20 min | |
| 17 | CSS avatar components (all 4) | 60 min | Largest UI task; see avatar notes below |
| 18 | `AudioPlayer.tsx` — AudioContext + AnalyserNode + amplitude sampling | 30 min | |
| 19 | `ChatPanel.tsx` + `PdfUpload.tsx` + `TutorPage.tsx` | 40 min | Wire all UI together |
| 20 | Integration smoke test — full text chat flow | 20 min | |
| 21 | Integration smoke test — voice flow | 15 min | |
| 22 | Integration smoke test — PDF upload + nav handoff | 15 min | |
| 23 | Polish: loading states, error toasts, mobile layout | 20 min | |
| **Total** | | **~7 h** | |

---

## Knowledge Base Build Process

### Source Files

Place raw `.txt` files in `data/kb/{character}/`. Minimum per character:
- 1 Wikipedia article (full text, stripped of markup)
- 1–2 primary source excerpts or secondary scholarly summaries

Target: 40–50 chunks per character, 150–200 total.

### Running the Build Script

```bash
# From project root
cd scripts
pip install -r requirements.txt
python build_kb.py
```

The script:
1. Reads all `.txt` files from each character directory
2. Splits text into ~500-token chunks with 50-token overlap using `tiktoken`
3. Embeds each chunk via `amazon.titan-embed-text-v2:0` (Bedrock, us-west-2)
4. Writes to a persistent Chroma collection at `../data/chroma/` with metadata: `{ tutorId, source, year, url }`

Run this once before starting the app. Re-run only if KB source files change.

---

## How to Run Locally (Two Processes)

### Process 1 — Chroma FastAPI Sidecar

```bash
cd sidecar
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Process 2 — Next.js App

```bash
# From project root
npm install
npm run dev
# App available at http://localhost:3000
```

Both processes must be running. The Next.js app performs a cold-start health check against `http://localhost:8000/health` on first RAG request.

---

## Environment Variables (`.env.local`)

```bash
# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-west-2

# Bedrock
BEDROCK_PRIMARY_MODEL=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_FALLBACK_MODEL=anthropic.claude-3-haiku-20240307-v1:0
BEDROCK_EMBEDDING_MODEL=amazon.titan-embed-text-v2:0

# Polly
POLLY_REGION=us-west-2

# Transcribe
TRANSCRIBE_REGION=us-west-2

# Whisper fallback
WHISPER_CPP_PATH=/usr/local/bin/whisper

# Chroma sidecar
CHROMA_SIDECAR_URL=http://localhost:8000

# Gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

# Teammate app URLs (set before demo)
COMIC_APP_URL=https://teammate-comic-app.example.com
GAME_APP_URL=https://teammate-game-app.example.com

# Optional: ElevenLabs (leave blank to use Polly)
ELEVENLABS_API_KEY=
```

---

## Chroma Sidecar Cold-Start Check

On the first incoming request to any RAG-dependent endpoint (`/api/chat`), the app runs:

```typescript
// lib/chroma.ts
async function waitForSidecar(maxAttempts = 5, intervalMs = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${process.env.CHROMA_SIDECAR_URL}/health`);
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return false;
}
```

If all 5 attempts fail, the endpoint returns HTTP 503 with `{ error: "Vector store unavailable" }`.

The sidecar exposes:
- `GET /health` → `{ status: "ok" }`
- `POST /query` → `{ tutorId, queryEmbedding, topK }` → `{ chunks: [...] }`

---

## Whisper.cpp Fallback Path

```typescript
// lib/transcription.ts
async function transcribe(audioBuffer: Buffer): Promise<string> {
  try {
    return await transcribeViaAWSTranscribe(audioBuffer);
  } catch (err) {
    console.warn("Transcribe failed, falling back to whisper.cpp", err);
    return await transcribeViaWhisperCpp(audioBuffer);
  }
}

async function transcribeViaWhisperCpp(audioBuffer: Buffer): Promise<string> {
  const tmpPath = `/tmp/audio_${Date.now()}.wav`;
  await fs.writeFile(tmpPath, audioBuffer);
  const { stdout } = await execAsync(
    `${process.env.WHISPER_CPP_PATH} -m models/ggml-base.en.bin -f ${tmpPath} --output-txt`
  );
  await fs.unlink(tmpPath);
  return stdout.trim();
}
```

Requires `WHISPER_CPP_PATH` set and `ggml-base.en.bin` model downloaded locally.

---

## Risks and Fallbacks

| Risk | Likelihood | Fallback |
|---|---|---|
| Bedrock Claude quota / throttle | Medium | Retry once with Haiku; display error toast if both fail |
| AWS Transcribe WebSocket drops | Medium | whisper.cpp local binary |
| Chroma sidecar not running | High (dev) | Cold-start health check; 503 with clear error |
| Gemini API rate limit | Low | Return `{ matches: false, confidence: 0, reason: "Validation unavailable" }` |
| Polly Neural voice unavailable in region | Low | Confirm us-west-2 supports Matthew/Joey/Kevin/Brian before demo |
| PDF too large / malformed | Medium | pdf-parse throws; catch and return 400 |
| whisper.cpp binary missing | Medium | Return transcription error; user falls back to text input |
| KB not built before first run | High (dev) | Chroma query returns empty; RAG responds with "no context available" gracefully |
| Budget overrun | Low | $15 alarm set; demo is single-user, ~30 min |

---

## Demo Script (Exact Click Path for Judges)

1. Open `http://localhost:3000`
2. Read hero text; observe 4 domain cards with distinct accent colors
3. Click "Theoretical Physics — Albert Einstein"
4. Page scrolls to tutor section; Einstein CSS avatar appears with idle blink animation
5. Type: *"What is the theory of special relativity?"*
6. Click Send; observe loading indicator (~2–4 s)
7. Einstein responds in first person with citations; voice audio plays; avatar mouth animates
8. Click microphone; say *"Tell me about the photoelectric effect"*; click mic again to stop
9. Observe transcription appears in input; auto-submits; response plays with voice
10. Click PDF upload; select a physics textbook chapter PDF
11. Observe validation spinner (~3–5 s); success message appears
12. Observe Comic and Game nav links become active (previously greyed out)
13. Click Comic link; browser redirects to `${COMIC_APP_URL}?domain=theoretical-physics`
14. Return; click Game link; browser redirects to `${GAME_APP_URL}?domain=theoretical-physics`
15. Navigate back to Home; click "American Civil War and Presidency — Abraham Lincoln"
16. Demonstrate Lincoln's distinct Joey voice and different avatar/accent color

Total demo time: ~5–7 minutes.

---

## CSS Avatar Design Notes

### General Approach

Each avatar is a React component that renders a `<div>` tree styled with CSS. No `<img>` or `<canvas>` tags. Animations are CSS keyframes toggled by a `speaking` boolean prop.

### Shared Structure

```
.avatar-root          // fixed-size container, e.g. 240×320px
  .avatar-body        // torso + clothing (background color + border-radius)
  .avatar-head        // circle/oval, skin tone
    .avatar-hair      // top of head, character-specific shape
    .avatar-eyes      // flex row of two eye units
      .avatar-eye     // white oval
        .avatar-pupil // dark circle
        .avatar-lid   // top eyelid, animates down for blink
    .avatar-nose      // small triangle or rounded rect
    .avatar-mouth     // rounded rect; height animates for speaking
    .avatar-facial-hair // character-specific (Lincoln beard, Shakespeare collar)
  .avatar-accessory   // Einstein wild hair tufts, Lincoln stovepipe hat, Mozart wig, Shakespeare ruff
```

### Per-Character Notes

**Einstein**
- Wild white hair: multiple `border-radius` blobs positioned around head
- Mustache: wide short rounded rect above mouth
- Clothing: grey/brown jacket
- Accent: blue

**Lincoln**
- Stovepipe hat: tall thin rectangle above head
- Beard: chin-only beard via bottom border-radius on a dark shape
- Clothing: black jacket with white shirt collar
- Accent: sepia/red

**Mozart**
- White powdered wig: large rounded shape, wider than head
- Clothing: ornate coat — gold/red with CSS border decorations
- Accent: gold

**Shakespeare**
- Elizabethan ruff collar: stacked concentric rings below head using `border` and `border-radius`
- Pointed beard: triangle shape on chin
- Clothing: dark doublet
- Accent: green

### Animations

```css
/* Idle eye blink — triggers every 4s */
@keyframes blink {
  0%, 90%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.05); }
}
.avatar-lid { animation: blink 4s infinite; }

/* Speaking mouth — toggled by JS adding .speaking class */
@keyframes mouth-speak {
  0%, 100% { height: 4px; }
  50% { height: 14px; }
}
.avatar-mouth.speaking { animation: mouth-speak 0.15s infinite; }
```

The `AudioPlayer` component samples `AnalyserNode.getByteFrequencyData()` at ~30 fps, computes average amplitude, and adds/removes the `.speaking` class on the mouth element when amplitude exceeds a threshold (~20/255).

---

## Budget / Cost Estimate for Demo Usage

Assumptions: 1 user, ~30-minute demo, ~20 chat turns, ~10 TTS calls, ~5 voice inputs, 1 PDF validation, 1 KB build.

| Service | Usage | Est. Cost |
|---|---|---|
| Bedrock Claude 3.5 Sonnet | 20 requests × ~2K tokens in / ~500 tokens out | ~$0.15 |
| Bedrock Claude 3 Haiku (fallback) | 0–2 requests | <$0.01 |
| Bedrock Titan Embeddings (KB build) | ~175 chunks × ~500 tokens | ~$0.02 |
| Bedrock Titan Embeddings (query-time) | 20 queries × ~50 tokens | <$0.01 |
| AWS Polly Neural | 10 requests × ~300 chars | ~$0.02 |
| AWS Transcribe Streaming | 5 × ~10s audio | ~$0.01 |
| Gemini 1.5 Flash | 1 PDF validation | <$0.01 |
| **Total** | | **~$0.22** |

Well within the $15 budget alarm. The alarm exists as a safety net for runaway loops or accidental repeated KB builds.
