# Requirements Document

## Introduction

Historia Tutor App is a single-user hackathon web application that lets students learn from AI-powered historical tutors. The user selects a domain from four hardcoded options; a corresponding historical figure then tutors them in first person with citations drawn from a pre-built knowledge base. The user may interact via text or voice, optionally upload a PDF chapter for the tutor to explain, and after PDF validation, navigate to teammate-built Comic and Game apps via redirect. This document covers App 1: Home, Tutor, and AI Backend.

---

## Glossary

- **App**: The Historia Tutor Next.js application (App 1).
- **Tutor**: An AI persona representing a historical figure, constrained to a specific domain.
- **Domain**: One of four hardcoded subject areas paired with a historical figure.
- **RAG_Pipeline**: The Retrieval-Augmented Generation pipeline that retrieves knowledge-base chunks and generates tutor responses via Claude.
- **Chroma_Sidecar**: A Python FastAPI process running on port 8000 that hosts the Chroma vector store.
- **KB**: The knowledge base — pre-chunked text files embedded via Amazon Titan and stored in Chroma.
- **Session**: A transient in-memory record with shape `{ sessionId, domain, tutorId, pdfValidated, createdAt }` stored in sessionStorage.
- **PDF_Validator**: The `/api/validate-pdf` endpoint that uses Gemini to classify whether an uploaded PDF matches the active domain.
- **TTS_Provider**: The abstraction layer over AWS Polly (default) and ElevenLabs (stub).
- **Transcription_Service**: The abstraction over AWS Transcribe (default) and whisper.cpp / OpenAI Whisper (fallback).
- **Citation**: A numbered reference derived from chunk metadata containing source title, year, and URL.
- **Avatar**: A CSS-drawn 2D character portrait with idle and speaking animations.
- **Teammate_App**: The Comic or Game application built by other hackathon team members.

---

## Requirements

### Requirement 1: Domain and Tutor Selection

**User Story:** As a student, I want to select a historical domain from the home page, so that I am paired with the correct tutor and taken to the tutor interface.

#### Acceptance Criteria

1. THE App SHALL present exactly four domain cards on the home page: "Theoretical Physics" (Albert Einstein), "American Civil War and Presidency" (Abraham Lincoln), "Classical Music Composition" (Wolfgang Amadeus Mozart), and "English Literature and Elizabethan Drama" (William Shakespeare).
2. WHEN a user clicks a domain card, THE App SHALL set the active domain and tutorId in React Context and scroll the viewport to the tutor page section.
3. WHEN a domain is selected, THE App SHALL generate a unique sessionId, record `{ sessionId, domain, tutorId, pdfValidated: false, createdAt }`, and persist it to sessionStorage.
4. WHILE a domain is active, THE App SHALL display the Avatar corresponding to the selected tutorId.
5. IF no domain has been selected and the user navigates directly to the tutor section, THEN THE App SHALL redirect the user to the home page.

---

### Requirement 2: Home Page Presentation

**User Story:** As a student, I want a visually engaging home page, so that I understand the app's purpose and can easily choose a tutor.

#### Acceptance Criteria

1. THE App SHALL render a hero section with the application name and a brief description above the domain cards.
2. THE App SHALL apply a warm editorial aesthetic using serif and sans-serif fonts, a CSS parchment/paper background texture, and per-domain accent colors (physics = blue, civil war = sepia/red, music = gold, literature = green).
3. THE App SHALL render all UI without external image files; all visual elements SHALL be produced via CSS and inline SVG.

---

### Requirement 3: Tutor Page Layout and Avatar

**User Story:** As a student, I want to see an animated portrait of my tutor alongside the chat interface, so that the interaction feels immersive.

#### Acceptance Criteria

1. THE App SHALL render the tutor page in a split layout: left panel contains the Avatar; right panel contains the chat history, PDF upload control, text input, microphone button, and send button.
2. THE App SHALL draw each Avatar as a CSS-only 2D character illustration with no external image files.
3. WHILE no audio is playing, THE Avatar SHALL perform an idle animation consisting of periodic eye blinks and subtle breathing motion driven by CSS keyframes.
4. WHILE TTS audio is playing, THE Avatar SHALL perform a speaking animation where the mouth opens and closes in response to audio amplitude sampled from a Web Audio AnalyserNode.
5. WHEN TTS audio playback ends, THE Avatar SHALL return to the idle animation state.

---

### Requirement 4: Text Chat with RAG Pipeline

**User Story:** As a student, I want to type questions to my tutor and receive in-character responses with citations, so that I can learn from a historically grounded AI persona.

#### Acceptance Criteria

1. WHEN the user submits a text message, THE App SHALL POST `{ message, tutorId, sessionId }` to `/api/chat` and display a loading indicator until a response is received.
2. WHEN `/api/chat` receives a request, THE RAG_Pipeline SHALL retrieve the top 5 KB chunks filtered by tutorId from the Chroma_Sidecar.
3. WHEN `/api/chat` receives a request, THE RAG_Pipeline SHALL invoke Claude 3.5 Sonnet (`anthropic.claude-3-5-sonnet-20241022-v2:0`) via AWS Bedrock in us-west-2 with a character-specific system prompt and the retrieved chunks as context.
4. IF the user's question is outside the active domain, THEN THE RAG_Pipeline SHALL return a polite in-character refusal without fabricating off-domain content.
5. WHEN a response is generated, THE RAG_Pipeline SHALL include numbered Citations derived from chunk metadata (source title, year, URL) in the response payload.
6. THE `/api/chat` endpoint SHALL return a response within 4 seconds under single-user load.
7. IF the Claude 3.5 Sonnet invocation fails, THEN THE RAG_Pipeline SHALL retry once with Claude 3 Haiku (`anthropic.claude-3-haiku-20240307-v1:0`) as fallback before returning an error.
8. WHEN a response is received, THE App SHALL render the tutor's message and numbered citations in the chat history, then automatically invoke `/api/tts` with the response text.

---

### Requirement 5: Voice Input and Transcription

**User Story:** As a student, I want to speak my question instead of typing, so that the interaction feels more natural.

#### Acceptance Criteria

1. WHEN the user presses the microphone button, THE App SHALL begin capturing audio from the user's microphone and stream it to `/api/voice` via WebSocket.
2. WHEN `/api/voice` receives an audio stream, THE Transcription_Service SHALL proxy the stream to AWS Transcribe in us-west-2 and return the transcription text.
3. THE `/api/voice` endpoint SHALL return a transcription within 3 seconds of the user stopping speech under single-user load.
4. IF the AWS Transcribe WebSocket connection fails, THEN THE Transcription_Service SHALL fall back to the whisper.cpp local binary at the configured `WHISPER_CPP_PATH` and return the transcription.
5. WHEN a transcription is returned, THE App SHALL populate the text input field with the transcribed text and automatically submit it to `/api/chat`.
6. WHEN the user presses the microphone button while recording is active, THE App SHALL stop recording and submit the captured audio.

---

### Requirement 6: Text-to-Speech Audio Playback

**User Story:** As a student, I want to hear my tutor's response in a distinct voice, so that each character feels unique and engaging.

#### Acceptance Criteria

1. WHEN `/api/tts` receives a text payload and tutorId, THE TTS_Provider SHALL invoke AWS Polly Neural engine in us-west-2 with the voice mapped to the tutorId: Einstein → Matthew, Lincoln → Joey, Mozart → Kevin, Shakespeare → Brian.
2. THE `/api/tts` endpoint SHALL return an MP3 audio buffer within 2 seconds under single-user load.
3. WHEN the MP3 buffer is received by the App, THE App SHALL decode it via `AudioContext.decodeAudioData()` and play it through a `BufferSourceNode` connected to an `AnalyserNode`.
4. WHILE audio is playing, THE App SHALL sample amplitude from the AnalyserNode at a minimum of 30 times per second to drive Avatar mouth animation.
5. IF the AWS Polly invocation fails, THEN THE TTS_Provider SHALL return an error response and THE App SHALL display the tutor's text response without audio.
6. WHERE an ElevenLabs API key is configured, THE TTS_Provider SHALL route TTS requests to ElevenLabs instead of Polly.

---

### Requirement 7: PDF Upload and Domain Validation

**User Story:** As a student, I want to upload a PDF chapter and have my tutor explain it, so that I can get personalized help with my reading material.

#### Acceptance Criteria

1. WHEN the user selects a PDF file via the upload control, THE App SHALL POST the file as multipart form data to `/api/validate-pdf` along with the active domain.
2. WHEN `/api/validate-pdf` receives a PDF, THE PDF_Validator SHALL extract text using the `pdf-parse` library and send a JSON classifier prompt to Gemini (`gemini-1.5-flash`) requesting `{ matches: bool, confidence: float, reason: string }`.
3. THE `/api/validate-pdf` endpoint SHALL return a response within 5 seconds under single-user load.
4. IF the PDF domain matches (`matches: true`), THEN THE App SHALL set `pdfValidated: true` in React Context and sessionStorage, and THE App SHALL activate the Comic and Game navigation links.
5. IF the PDF domain does not match (`matches: false`), THEN THE App SHALL display the `reason` string to the user and keep `pdfValidated: false`.
6. WHEN `pdfValidated` is true, THE App SHALL send a follow-up message to `/api/chat` instructing the tutor to explain the uploaded PDF content in character.
7. THE PDF_Validator SHALL accept PDF files only; IF a non-PDF file is submitted, THEN THE PDF_Validator SHALL return a 400 error with a descriptive message.
8. THE App SHALL store the PDF in temporary server memory only and SHALL NOT persist it to S3 or any durable storage.

---

### Requirement 8: Navigation and Teammate Handoff

**User Story:** As a student, I want to navigate to the Comic and Game apps after validating my PDF, so that I can continue my learning experience across the full Historia suite.

#### Acceptance Criteria

1. THE App SHALL render a sticky navigation bar containing Home and Tutors links at all times.
2. WHILE `pdfValidated` is false, THE App SHALL render the Comic and Game navigation links in a disabled state.
3. WHEN `pdfValidated` becomes true, THE App SHALL enable the Comic and Game navigation links.
4. WHEN the user clicks an enabled Comic or Game link, THE App SHALL redirect via `window.location.href` to the teammate app URL with the query parameter `?domain={domain}`.
5. THE `/api/session/:id` endpoint SHALL return `{ sessionId, domain, tutorId, pdfValidated, createdAt }` for a valid sessionId.
6. IF `/api/session/:id` receives an unknown sessionId, THEN THE App SHALL return a 404 response.

---

### Requirement 9: Knowledge Base Build Process

**User Story:** As a developer, I want a repeatable script to build the vector knowledge base, so that the RAG pipeline has accurate, pre-embedded content before the app starts.

#### Acceptance Criteria

1. THE `scripts/build_kb.py` script SHALL read all `.txt` files from `data/kb/{character}/` for each of the four characters.
2. THE `scripts/build_kb.py` script SHALL chunk each source file into segments of approximately 500 tokens with overlap, targeting 40–50 chunks per character (150–200 total).
3. WHEN chunking is complete, THE script SHALL embed each chunk using Amazon Titan Text Embeddings v2 via AWS Bedrock in us-west-2.
4. WHEN embedding is complete, THE script SHALL write all chunks and embeddings to the persistent Chroma collection at `data/chroma/`, tagged with `tutorId` metadata.
5. IF the Chroma_Sidecar is not running when the App starts, THEN THE App SHALL perform a cold-start health check by polling `GET http://localhost:8000/health` up to 5 times with 1-second intervals before serving requests.
6. IF all health check attempts fail, THEN THE App SHALL log an error and return a 503 response from all RAG-dependent endpoints.

---

### Requirement 10: Non-Functional Requirements

**User Story:** As a demo presenter, I want the app to respond quickly and reliably under single-user load, so that the hackathon demo runs smoothly.

#### Acceptance Criteria

1. THE App SHALL support exactly one concurrent user (demo context); multi-user concurrency is out of scope.
2. THE `/api/chat` endpoint SHALL return a complete response within 4 seconds under single-user load.
3. THE `/api/tts` endpoint SHALL return an MP3 buffer within 2 seconds under single-user load.
4. THE `/api/voice` endpoint SHALL return a transcription within 3 seconds of speech completion under single-user load.
5. THE `/api/validate-pdf` endpoint SHALL return a classification result within 5 seconds under single-user load.
6. THE App SHALL operate entirely within AWS region us-west-2.
7. THE App SHALL require no user authentication, no payment processing, and no persistent user accounts.
8. THE App SHALL not store any user data beyond the current browser session.

---

### Requirement 11: Property-Based Correctness Properties

**User Story:** As a developer, I want correctness properties defined for the RAG pipeline, PDF validator, and TTS abstraction, so that I can write property-based tests that catch edge cases.

#### Acceptance Criteria

1. FOR ALL valid text inputs to `/api/chat`, THE RAG_Pipeline SHALL return a response object containing at minimum a non-empty `message` string and a `citations` array (round-trip shape invariant).
2. FOR ALL tutorId values in the set {einstein, lincoln, mozart, shakespeare}, THE RAG_Pipeline SHALL return only Citations whose `tutorId` metadata matches the requested tutorId (retrieval filter invariant).
3. FOR ALL text inputs that are semantically outside the active domain, THE RAG_Pipeline SHALL return a response where `message` does not assert domain-specific facts from the other three domains (domain isolation property).
4. FOR ALL valid PDF inputs to `/api/validate-pdf`, THE PDF_Validator SHALL return a JSON object with exactly the fields `matches` (boolean), `confidence` (float in [0.0, 1.0]), and `reason` (non-empty string) (response schema invariant).
5. FOR ALL tutorId values, THE TTS_Provider SHALL map to exactly one Polly voice ID and SHALL NOT map two different tutorIds to the same voice ID (voice mapping bijection property).
6. FOR ALL text strings passed to `/api/tts`, IF the same text and tutorId are submitted twice, THEN THE TTS_Provider SHALL return audio buffers of equivalent duration (idempotence / determinism property).
7. FOR ALL chunk records written by `build_kb.py`, THE chunk SHALL contain non-empty `text`, `tutorId`, `source`, `year`, and `url` metadata fields (KB schema completeness invariant).

---

## Out of Scope

The following are explicitly excluded from this application:

- Comic generation (built by teammate)
- Game generation (built by teammate)
- User authentication or accounts
- Payment processing
- Multi-user concurrency
- Persistence beyond the browser session
- S3 or durable file storage
- Nova Sonic speech-to-speech model
- Real-time streaming of LLM tokens to the UI
- Mobile-responsive layout optimization
- Accessibility (WCAG) compliance audit
- Automated end-to-end test suite

---

## Integration Contract with Teammate Apps

### Outbound Redirect (App 1 → Teammate Apps)

When `pdfValidated` is true and the user clicks Comic or Game:

```
window.location.href = `${COMIC_APP_URL}?domain={domain}`
window.location.href = `${GAME_APP_URL}?domain={domain}`
```

`domain` is one of: `theoretical-physics`, `civil-war-presidency`, `classical-music`, `elizabethan-literature`

### Inbound Session Endpoint (Teammate Apps → App 1)

Teammates may call:

```
GET /api/session/:id
```

Response shape:

```json
{
  "sessionId": "string",
  "domain": "string",
  "tutorId": "string",
  "pdfValidated": true,
  "createdAt": "ISO8601 timestamp"
}
```

### Shared PDF Validation Endpoint

Teammates may call:

```
POST /api/validate-pdf
Content-Type: multipart/form-data
Fields: file (PDF), domain (string)
```

Response shape:

```json
{
  "matches": true,
  "confidence": 0.95,
  "reason": "string"
}
```
