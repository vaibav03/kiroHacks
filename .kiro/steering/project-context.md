---
inclusion: auto
---

# Study Sanctum — Project Context

## What This App Does
An AI tutoring app where students pick a historical figure (Einstein, Lincoln, Mozart, Shakespeare) and chat with them. The tutor responds in-character using RAG over a pre-built knowledge base, with voice input/output and PDF upload for domain validation.

## Architecture
- Next.js 14 App Router (TypeScript)
- React Context for state (`context/AppContext.tsx`)
- Chroma vector DB sidecar (Python FastAPI on port 8000/8001)
- AWS Bedrock for LLM (DeepSeek v3.2) and embeddings (Titan)
- ElevenLabs for TTS
- Web Speech API for voice input (wake-word activated)
- AWS Amplify/Cognito for authentication
- Gemini for content enrichment (YouTube/blog suggestions)

## Key Files
- `lib/rag.ts` — RAG pipeline (embed → Chroma → DeepSeek → citations)
- `lib/tts.ts` — ElevenLabs TTS
- `lib/gemini.ts` — Gemini enrichment client
- `lib/bedrock.ts` — Bedrock client factory
- `lib/tutors.ts` — Tutor config (names, domains, voices, colors)
- `hooks/useWakeWordListener.ts` — Wake-word voice detection
- `components/ChatPanel.tsx` — Main chat UI
- `components/TutorPage.tsx` — Tutor page layout
- `sidecar/main.py` — Chroma FastAPI sidecar

## Running Locally
1. Start Chroma sidecar: `cd sidecar && uvicorn main:app --port 8001`
2. Start Next.js: `npm run dev`
