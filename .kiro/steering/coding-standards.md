---
inclusion: auto
---

# Historia Coding Standards

## API Routes
- All API routes must validate input and return 400 for missing fields
- All API routes must wrap logic in try/catch and return descriptive error JSON
- Use `NextResponse.json()` for all responses
- Never expose raw error stack traces to the client

## Components
- All components that use hooks or browser APIs must have `'use client'` directive
- Use `useAppContext()` for shared state — never prop-drill domain/tutorId/pdfValidated
- CSS: use Tailwind utilities + the existing retro theme variables (--btn-yellow, --panel-bg, etc.)

## Environment Variables
- Server-only secrets: no `NEXT_PUBLIC_` prefix (AWS keys, ElevenLabs, Gemini)
- Client-accessible config: use `NEXT_PUBLIC_` prefix (Cognito pool/client IDs)
- Never hardcode API keys in source files

## Models
- Primary LLM: DeepSeek v3.2 on Bedrock (`deepseek.v3.2`)
- Fallback LLM: DeepSeek v3 on Bedrock (`deepseek.v3-v1:0`)
- Embeddings: Amazon Titan Embed Text v2 (`amazon.titan-embed-text-v2:0`)
- TTS: ElevenLabs (`eleven_turbo_v2_5`)
- Enrichment: Gemini (`gemini-2.0-flash`)
- All Bedrock calls go through `lib/bedrock.ts` client

## Testing
- Property-based tests use `fast-check`
- Test files go next to the source file or in a `__tests__` directory
