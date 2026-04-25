# Implementation Plan: Gemini Content Enrichment

## Overview

Add a Gemini-powered content enrichment layer to the Study Sanctum tutor chat. After each tutor response, an async call to a new `/api/enrich` endpoint fetches related YouTube videos and blog articles via the Gemini `gemini-1.5-flash` model. Results render in a new `EnrichmentBlock` component below tutor messages. The feature is fully additive — existing chat, TTS, and FactsPanel remain untouched.

## Tasks

- [x] 1. Install dependencies and configure environment
  - [x] 1.1 Add `@google/generative-ai` as a production dependency in `package.json` and add `fast-check`, `vitest`, `@testing-library/react`, and `@testing-library/jest-dom` as dev dependencies
    - Run `npm install @google/generative-ai` and `npm install -D fast-check vitest @testing-library/react @testing-library/jest-dom`
    - _Requirements: 1.1_
  - [x] 1.2 Add `GEMINI_API_KEY` placeholder to `.env.local`
    - Append `GEMINI_API_KEY=your_gemini_api_key_here` to `.env.local`
    - _Requirements: 1.2_

- [x] 2. Create `lib/gemini.ts` — Gemini client wrapper
  - [x] 2.1 Implement the `fetchEnrichment` function and prompt builder
    - Create `lib/gemini.ts` exporting `EnrichmentItem`, `EnrichmentResult` interfaces and `fetchEnrichment(responseText, tutorId)` function
    - Initialize `GoogleGenerativeAI` with `process.env.GEMINI_API_KEY`
    - Build a domain-scoped prompt using `TUTORS[tutorId].name`, `domain`, and `domainTitle` plus the `responseText`
    - Use the prompt template from the design document, instructing Gemini to return raw JSON with `videos` and `articles` arrays
    - Use the `gemini-1.5-flash` model
    - Parse the Gemini response as JSON; on parse failure return `{ videos: [], articles: [] }`
    - Default missing `videos` or `articles` keys to empty arrays
    - _Requirements: 1.2, 2.2, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 9.1, 9.2, 9.3, 9.4, 9.5_
  - [ ]* 2.2 Write property test — Property 1: Prompt includes responseText, tutor domain, and tutor name
    - **Property 1: Prompt includes responseText, tutor domain, and tutor name**
    - For any valid `responseText` and any valid `tutorId`, assert the constructed prompt contains the `responseText`, the tutor's `domain`, and the tutor's `name`
    - Extract or expose the prompt builder for testability
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 2.6, 9.2, 9.3**
  - [ ]* 2.3 Write property test — Property 4: Unparseable Gemini response yields empty result
    - **Property 4: Unparseable Gemini response yields empty result**
    - For any string that is not valid JSON, assert the parse logic returns `{ videos: [], articles: [] }`
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 4.6**

- [x] 3. Create `app/api/enrich/route.ts` — Enrichment API route
  - [x] 3.1 Implement the POST handler with validation and URL filtering
    - Create `app/api/enrich/route.ts` with a `POST` handler
    - Validate request body: return 400 if `responseText` or `tutorId` is missing
    - Check `GEMINI_API_KEY` env var: return 500 with descriptive error if missing/empty
    - Call `fetchEnrichment(responseText, tutorId)` from `lib/gemini.ts`
    - Filter returned video URLs: keep only those starting with `https://www.youtube.com/watch?v=` or `https://youtu.be/`
    - Filter returned article URLs: keep only those starting with `https://`
    - Cap results at 3 videos and 3 articles maximum
    - On Gemini call failure, catch and return 500 with `{ error: "Enrichment failed" }`
    - Return the filtered `EnrichmentResult` as JSON
    - _Requirements: 1.3, 2.1, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ]* 3.2 Write property test — Property 2: URL filtering preserves only valid URLs
    - **Property 2: URL filtering preserves only valid URLs**
    - For any array of video objects with arbitrary URL strings and any array of article objects with arbitrary URL strings, assert the filtering logic returns only videos with URLs starting with `https://www.youtube.com/watch?v=` or `https://youtu.be/`, and only articles with URLs starting with `https://`
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 4.2, 4.3**
  - [ ]* 3.3 Write property test — Property 3: Output schema invariant
    - **Property 3: Output schema invariant**
    - For any valid Gemini JSON response with 0–N videos and 0–M articles (all valid URLs), assert the output has at most 3 videos and 3 articles, each with `url` (string) and `title` (string) fields, and no padded entries
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 2.3, 4.1, 4.4**

- [x] 4. Checkpoint — Verify backend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create `components/EnrichmentBlock.tsx` — UI component
  - [x] 5.1 Implement the EnrichmentBlock component
    - Create `components/EnrichmentBlock.tsx` accepting `{ videos: EnrichmentItem[], articles: EnrichmentItem[] }` props
    - Render nothing if both arrays are empty
    - For each video: extract video ID from YouTube watch or youtu.be URL, render an iframe with `src="https://www.youtube.com/embed/{videoId}"`, 100% width, 16:9 aspect ratio, and a title label above
    - For each article: render a clickable link with `target="_blank"` and `rel="noopener noreferrer"`, using the article title as link text
    - Style consistently with the existing retro theme (matching ChatPanel's `bg-[#0a0a14]`, `border-pixel`, retro fonts)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4_
  - [ ]* 5.2 Write property test — Property 5: YouTube watch URL to embed URL conversion
    - **Property 5: YouTube watch URL to embed URL conversion**
    - For any valid YouTube video ID string, assert the component converts `https://www.youtube.com/watch?v={videoId}` to `https://www.youtube.com/embed/{videoId}` and `https://youtu.be/{videoId}` to `https://www.youtube.com/embed/{videoId}`
    - Extract the conversion logic into a testable pure function
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 6.2**
  - [ ]* 5.3 Write property test — Property 6: Rendered enrichment item count matches data
    - **Property 6: Rendered enrichment item count matches data**
    - For any `EnrichmentResult` with 0–3 videos and 0–3 articles, assert the rendered output contains exactly as many iframe elements as videos and exactly as many link elements as articles
    - Use `@testing-library/react` to render the component and `fast-check` with minimum 100 iterations
    - **Validates: Requirements 6.1, 7.1**
  - [ ]* 5.4 Write property test — Property 7: All enrichment titles appear in rendered output
    - **Property 7: All enrichment titles appear in rendered output**
    - For any `EnrichmentResult` where each video and article has a non-empty title, assert every title appears in the rendered output
    - Use `@testing-library/react` to render the component and `fast-check` with minimum 100 iterations
    - **Validates: Requirements 6.4, 7.3**

- [x] 6. Update `components/ChatPanel.tsx` — Integrate enrichment into chat flow
  - [x] 6.1 Add enrichment state and async fetch logic
    - Extend the `Message` interface with `enrichment?: EnrichmentResult | null` (null = loading, undefined = not requested)
    - After receiving a tutor response from `/api/chat`, fire an async `fetch('/api/enrich', ...)` with the tutor response text and current `tutorId`
    - Use an `AbortController` with a 10-second timeout
    - On success, update the message's `enrichment` field with the result
    - On failure or timeout, set `enrichment` to `undefined` (silent degradation)
    - If `GEMINI_API_KEY` is not configured (enrich endpoint returns 500), skip future enrichment calls
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.4_
  - [x] 6.2 Render EnrichmentBlock and loading indicator
    - Import and render `<EnrichmentBlock>` below each tutor message bubble that has enrichment data
    - Show a subtle loading skeleton (small pulsing bar matching retro theme) while `enrichment === null`
    - Hide the loading indicator when enrichment resolves or fails
    - Ensure existing chat messages, citations, TTS trigger, and voice features remain unchanged
    - _Requirements: 5.3, 5.4, 6.5, 8.1, 8.2, 8.3_

- [x] 7. Final checkpoint — Verify full integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using `fast-check`
- Unit tests validate specific examples and edge cases
- The feature is fully additive — no existing routes, components, or pipelines are modified beyond ChatPanel
