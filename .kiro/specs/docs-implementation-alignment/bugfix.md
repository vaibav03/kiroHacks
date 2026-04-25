# Bugfix Requirements Document

## Introduction

The project documentation files (`requirements.md` and `plans.md`) reference AI services and architecture that do not match the actual codebase implementation. The docs describe Claude 3.5 Sonnet/Haiku as the LLM, AWS Polly for TTS, AWS Transcribe for voice input, and Gemini for PDF validation. In reality, the codebase uses DeepSeek v3.2 on Bedrock as the LLM, ElevenLabs for TTS, the browser Web Speech API for voice input, and Bedrock (DeepSeek) for PDF validation. The app is also branded "Study Sanctum" rather than "HistorAI Tutor." These mismatches cause confusion for any developer or reviewer reading the documentation, as it describes a system that does not exist.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a developer reads `requirements.md` Requirement 4 (Text Chat with RAG Pipeline) THEN the system documentation states the RAG pipeline uses Claude 3.5 Sonnet (`anthropic.claude-3-5-sonnet-20241022-v2:0`) as the primary LLM and Claude 3 Haiku (`anthropic.claude-3-haiku-20240307-v1:0`) as fallback, while the actual code (`lib/rag.ts`) uses DeepSeek v3.2 (`deepseek.v3.2`) as primary and DeepSeek v3 (`deepseek.v3-v1:0`) as fallback.

1.2 WHEN a developer reads `requirements.md` Requirement 6 (Text-to-Speech Audio Playback) THEN the system documentation states TTS uses AWS Polly Neural engine with voice IDs Matthew/Joey/Kevin/Brian, while the actual code (`lib/tts.ts`) uses ElevenLabs API exclusively with ElevenLabs-specific voice IDs.

1.3 WHEN a developer reads `requirements.md` Requirement 5 (Voice Input and Transcription) THEN the system documentation states voice input uses a WebSocket proxy to AWS Transcribe at `/api/voice` with a whisper.cpp fallback, while the actual code (`components/ChatPanel.tsx`) uses the browser's native `SpeechRecognition` / `webkitSpeechRecognition` API entirely client-side with no server-side transcription endpoint.

1.4 WHEN a developer reads `requirements.md` Requirement 7 (PDF Upload and Domain Validation) THEN the system documentation states PDF validation uses Gemini (`gemini-1.5-flash`) via the `@google/generative-ai` SDK, while the actual code (`app/api/validate-pdf/route.ts`) uses Bedrock with DeepSeek for PDF classification and `@google/generative-ai` is not in `package.json`.

1.5 WHEN a developer reads `requirements.md` Introduction and Glossary THEN the system documentation refers to the app as "HistorAI Tutor App" and defines glossary terms for services not used (Gemini, AWS Polly, AWS Transcribe, whisper.cpp), while the actual app is branded "Study Sanctum" and uses different services entirely.

1.6 WHEN a developer reads `plans.md` Tech Stack Decisions table THEN the system documentation lists `@aws-sdk/client-polly`, `@aws-sdk/client-transcribe-streaming`, and `@google/generative-ai` as dependencies, while the actual `package.json` does not use `@google/generative-ai` and the code does not use Polly or Transcribe clients.

1.7 WHEN a developer reads `plans.md` AWS Services and Model IDs table THEN the system documentation lists Claude Sonnet/Haiku model IDs, AWS Polly voices, and AWS Transcribe Streaming, while the actual services used are DeepSeek models on Bedrock and ElevenLabs for TTS.

1.8 WHEN a developer reads `plans.md` Environment Variables section THEN the system documentation lists env vars for `BEDROCK_PRIMARY_MODEL=anthropic.claude-3-5-sonnet-...`, `BEDROCK_FALLBACK_MODEL=anthropic.claude-3-haiku-...`, `POLLY_REGION`, `TRANSCRIBE_REGION`, `WHISPER_CPP_PATH`, `GEMINI_API_KEY`, and `GEMINI_MODEL`, while the actual app requires `ELEVENLABS_API_KEY` and uses DeepSeek model IDs for Bedrock.

1.9 WHEN a developer reads `plans.md` Project Folder Structure THEN the system documentation lists `lib/transcription.ts` and `app/api/voice/route.ts` as files, while `lib/transcription.ts` does not exist and `app/api/voice/` is an empty directory. Additionally, `app/api/facts/route.ts` exists in the codebase but is not listed.

1.10 WHEN a developer reads `plans.md` Build Order, Risks and Fallbacks, Budget/Cost Estimate, or Demo Script sections THEN the system documentation references Claude, Polly, Transcribe, Gemini, and whisper.cpp throughout, while none of these services are used in the actual implementation.

1.11 WHEN a developer reads `requirements.md` Requirement 11 (Property-Based Correctness Properties) THEN the system documentation references "Polly voice ID" in the voice mapping bijection property (11.5), while the actual TTS uses ElevenLabs voice IDs.

1.12 WHEN a developer reads `requirements.md` Requirement 10 (Non-Functional Requirements) THEN the system documentation specifies a 3-second latency requirement for `/api/voice` (10.4), while no server-side voice endpoint is used — voice recognition is handled client-side by the browser.

### Expected Behavior (Correct)

2.1 WHEN a developer reads `requirements.md` Requirement 4 (Text Chat with RAG Pipeline) THEN the system documentation SHALL state the RAG pipeline uses DeepSeek v3.2 (`deepseek.v3.2`) as the primary LLM and DeepSeek v3 (`deepseek.v3-v1:0`) as fallback, both via AWS Bedrock Converse API.

2.2 WHEN a developer reads `requirements.md` Requirement 6 (Text-to-Speech Audio Playback) THEN the system documentation SHALL state TTS uses the ElevenLabs API with the `eleven_turbo_v2_5` model and tutor-specific ElevenLabs voice IDs.

2.3 WHEN a developer reads `requirements.md` Requirement 5 (Voice Input and Transcription) THEN the system documentation SHALL state voice input uses the browser's native Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) for client-side speech-to-text, with the transcribed text auto-submitted to `/api/chat` and the response read aloud via TTS.

2.4 WHEN a developer reads `requirements.md` Requirement 7 (PDF Upload and Domain Validation) THEN the system documentation SHALL state PDF validation uses Bedrock with DeepSeek (`deepseek.v3.2`) via the Converse API for domain classification.

2.5 WHEN a developer reads `requirements.md` Introduction and Glossary THEN the system documentation SHALL refer to the app as "Study Sanctum," and the glossary SHALL define services actually used (DeepSeek on Bedrock, ElevenLabs, Web Speech API) and remove references to unused services (Gemini, AWS Polly, AWS Transcribe, whisper.cpp).

2.6 WHEN a developer reads `plans.md` Tech Stack Decisions table THEN the system documentation SHALL list `@aws-sdk/client-bedrock-runtime` as the only AWS SDK dependency used at runtime, note ElevenLabs for TTS, and remove references to `@aws-sdk/client-polly`, `@aws-sdk/client-transcribe-streaming`, and `@google/generative-ai`.

2.7 WHEN a developer reads `plans.md` AWS Services and Model IDs table THEN the system documentation SHALL list DeepSeek v3.2 (`deepseek.v3.2`) as primary LLM, DeepSeek v3 (`deepseek.v3-v1:0`) as fallback, Amazon Titan Embed Text v2 for embeddings, and ElevenLabs as the TTS provider.

2.8 WHEN a developer reads `plans.md` Environment Variables section THEN the system documentation SHALL list `BEDROCK_PRIMARY_MODEL=deepseek.v3.2`, `BEDROCK_FALLBACK_MODEL=deepseek.v3-v1:0`, `ELEVENLABS_API_KEY`, and remove env vars for Polly, Transcribe, Whisper, and Gemini.

2.9 WHEN a developer reads `plans.md` Project Folder Structure THEN the system documentation SHALL remove `lib/transcription.ts` and `app/api/voice/route.ts`, note that `app/api/voice/` is an empty directory, and include `app/api/facts/route.ts` in the listing.

2.10 WHEN a developer reads `plans.md` Build Order, Risks and Fallbacks, Budget/Cost Estimate, and Demo Script sections THEN the system documentation SHALL reference DeepSeek, ElevenLabs, and Web Speech API instead of Claude, Polly, Transcribe, Gemini, and whisper.cpp throughout.

2.11 WHEN a developer reads `requirements.md` Requirement 11 (Property-Based Correctness Properties) THEN the system documentation SHALL reference "ElevenLabs voice ID" in the voice mapping bijection property instead of "Polly voice ID."

2.12 WHEN a developer reads `requirements.md` Requirement 10 (Non-Functional Requirements) THEN the system documentation SHALL remove the `/api/voice` latency requirement and note that voice recognition is handled client-side by the browser's Web Speech API.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a developer reads documentation sections describing the four tutor domains (Einstein, Lincoln, Mozart, Shakespeare) and their domain constraints THEN the system documentation SHALL CONTINUE TO accurately list the same four domains, tutor names, and domain-specific behavior.

3.2 WHEN a developer reads documentation sections describing the Chroma sidecar architecture, health check, and RAG retrieval flow THEN the system documentation SHALL CONTINUE TO accurately describe the ChromaDB vector store, FastAPI sidecar on port 8000, and top-5 chunk retrieval filtered by tutorId.

3.3 WHEN a developer reads documentation sections describing the PDF upload flow (file upload, text extraction via pdf-parse, domain classification, pdfValidated flag) THEN the system documentation SHALL CONTINUE TO accurately describe the overall PDF validation workflow and response shape.

3.4 WHEN a developer reads documentation sections describing session management, sessionStorage persistence, and the `/api/session/:id` endpoint THEN the system documentation SHALL CONTINUE TO accurately describe the session contract and data shape.

3.5 WHEN a developer reads documentation sections describing the teammate handoff (Comic/Game redirect with `?domain=` query parameter) THEN the system documentation SHALL CONTINUE TO accurately describe the integration contract with teammate apps.

3.6 WHEN a developer reads documentation sections describing the knowledge base build process (`scripts/build_kb.py`, Titan embeddings, chunk metadata) THEN the system documentation SHALL CONTINUE TO accurately describe the KB build pipeline.

3.7 WHEN a developer reads documentation sections describing the AudioPlayer component, Web Audio AnalyserNode, and avatar mouth animation THEN the system documentation SHALL CONTINUE TO accurately describe the audio playback and amplitude-driven animation system.

3.8 WHEN a developer reads documentation sections describing CSS-only avatar design and animations THEN the system documentation SHALL CONTINUE TO accurately describe the avatar component structure and keyframe animations.
