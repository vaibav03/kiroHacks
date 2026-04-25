# Requirements Document

## Introduction

Study Sanctum currently uses DeepSeek on Bedrock to generate tutor responses via a RAG pipeline. This feature adds Gemini-powered content enrichment that finds related YouTube videos and blog posts after each tutor response, displaying them as embedded media blocks alongside the chat. The enrichment is asynchronous and additive — it must not delay or disrupt the existing chat flow.

## Glossary

- **Enrichment_API**: The Next.js API route (`/api/enrich`) that accepts a tutor response and domain, calls Gemini, and returns related content links.
- **Gemini_Client**: The server-side module that wraps the `@google/generative-ai` SDK to call the `gemini-1.5-flash` model.
- **Enrichment_Result**: A structured JSON object containing arrays of YouTube video URLs and blog post URLs returned by the Enrichment_API.
- **Enrichment_Block**: A UI component rendered below a tutor message that displays embedded YouTube iframes and clickable blog post links.
- **Chat_Panel**: The existing `ChatPanel.tsx` component that renders the conversation between the user and the tutor.
- **Facts_Panel**: The existing `FactsPanel.tsx` component that displays historical facts on the right side of the tutor page.
- **Tutor_Response**: The text message returned by the `/api/chat` endpoint after DeepSeek processes a user question through the RAG pipeline.
- **Domain**: The subject area associated with a tutor (e.g., `theoretical-physics` for Einstein, `civil-war-presidency` for Lincoln).
- **TutorId**: A string identifier for a tutor character (`einstein`, `lincoln`, `mozart`, `shakespeare`).

## Requirements

### Requirement 1: Gemini SDK Installation and Configuration

**User Story:** As a developer, I want the Gemini SDK installed and configured, so that the application can call the Gemini API for content enrichment.

#### Acceptance Criteria

1. THE Build_System SHALL include `@google/generative-ai` as a production dependency in `package.json`.
2. THE Gemini_Client SHALL read the API key from the `GEMINI_API_KEY` environment variable.
3. IF the `GEMINI_API_KEY` environment variable is missing or empty, THEN THE Enrichment_API SHALL return an HTTP 500 response with a descriptive error message.

### Requirement 2: Enrichment API Route

**User Story:** As a frontend developer, I want a dedicated API route for content enrichment, so that the chat UI can request related content asynchronously after a tutor response.

#### Acceptance Criteria

1. THE Enrichment_API SHALL expose a POST endpoint at `/api/enrich`.
2. WHEN the Enrichment_API receives a valid request containing `responseText` and `tutorId`, THE Enrichment_API SHALL call the Gemini_Client with a prompt that requests related YouTube video URLs and blog post URLs.
3. WHEN the Gemini_Client returns a successful response, THE Enrichment_API SHALL return an Enrichment_Result containing up to 3 YouTube video objects (each with `url` and `title`) and up to 3 blog post objects (each with `url` and `title`).
4. IF the request body is missing `responseText` or `tutorId`, THEN THE Enrichment_API SHALL return an HTTP 400 response with a descriptive error message.
5. IF the Gemini_Client call fails, THEN THE Enrichment_API SHALL return an HTTP 500 response with a descriptive error message.
6. THE Enrichment_API SHALL include the tutor Domain in the Gemini prompt so that suggested content is specific to the tutor subject area.

### Requirement 3: Domain-Specific Content Suggestions

**User Story:** As a student, I want the enrichment content to match the tutor's subject area, so that I receive relevant educational resources.

#### Acceptance Criteria

1. WHEN the tutorId is `einstein`, THE Gemini_Client prompt SHALL request content related to theoretical physics and Albert Einstein.
2. WHEN the tutorId is `lincoln`, THE Gemini_Client prompt SHALL request content related to the American Civil War, presidency, and Abraham Lincoln.
3. WHEN the tutorId is `mozart`, THE Gemini_Client prompt SHALL request content related to classical music composition and Wolfgang Amadeus Mozart.
4. WHEN the tutorId is `shakespeare`, THE Gemini_Client prompt SHALL request content related to English literature, Elizabethan drama, and William Shakespeare.
5. THE Gemini_Client prompt SHALL instruct Gemini to return only educational, age-appropriate content suitable for students.

### Requirement 4: Enrichment Response Schema

**User Story:** As a frontend developer, I want a well-defined response schema from the enrichment API, so that I can reliably parse and render the results.

#### Acceptance Criteria

1. THE Enrichment_API SHALL return a JSON response with the following structure: `{ videos: Array<{ url: string, title: string }>, articles: Array<{ url: string, title: string }> }`.
2. THE Enrichment_API SHALL validate that each video URL matches the pattern `https://www.youtube.com/watch?v=` or `https://youtu.be/` before including the video in the response.
3. THE Enrichment_API SHALL validate that each article URL starts with `https://` before including the article in the response.
4. WHEN Gemini returns fewer items than requested, THE Enrichment_API SHALL return only the valid items without padding or placeholder entries.
5. THE Enrichment_API SHALL parse the Gemini response as JSON, extracting the `videos` and `articles` arrays from the model output.
6. IF the Gemini response cannot be parsed as valid JSON, THEN THE Enrichment_API SHALL return an empty Enrichment_Result (`{ videos: [], articles: [] }`) instead of an error.

### Requirement 5: Asynchronous Frontend Enrichment Flow

**User Story:** As a student, I want the tutor's response to appear immediately without waiting for enrichment content, so that the chat experience remains fast and responsive.

#### Acceptance Criteria

1. WHEN the Chat_Panel receives a Tutor_Response from `/api/chat`, THE Chat_Panel SHALL render the Tutor_Response immediately without waiting for enrichment data.
2. AFTER the Tutor_Response is rendered, THE Chat_Panel SHALL call the Enrichment_API in the background with the Tutor_Response text and the current TutorId.
3. WHILE the Enrichment_API call is in progress, THE Chat_Panel SHALL display a subtle loading indicator below the Tutor_Response.
4. IF the Enrichment_API call fails or times out, THEN THE Chat_Panel SHALL hide the loading indicator and display no enrichment content, without showing an error to the student.
5. THE Chat_Panel SHALL set a 10-second timeout on the Enrichment_API call to prevent indefinite loading states.

### Requirement 6: Enrichment Block Display — YouTube Videos

**User Story:** As a student, I want to see related YouTube videos embedded in the chat, so that I can watch educational content without leaving the app.

#### Acceptance Criteria

1. WHEN the Enrichment_API returns one or more video objects, THE Enrichment_Block SHALL render each video as an embedded YouTube iframe.
2. THE Enrichment_Block SHALL convert YouTube watch URLs to embed format (`https://www.youtube.com/embed/{videoId}`) for iframe rendering.
3. THE Enrichment_Block SHALL set each iframe to a responsive width (100% of the Enrichment_Block container) and a 16:9 aspect ratio height.
4. THE Enrichment_Block SHALL display the video title as a label above each iframe.
5. THE Enrichment_Block SHALL render below the Tutor_Response message bubble in the Chat_Panel.

### Requirement 7: Enrichment Block Display — Blog Posts

**User Story:** As a student, I want to see related blog post links in the chat, so that I can explore additional reading material.

#### Acceptance Criteria

1. WHEN the Enrichment_API returns one or more article objects, THE Enrichment_Block SHALL render each article as a clickable hyperlink.
2. THE Enrichment_Block SHALL open article links in a new browser tab using `target="_blank"` and `rel="noopener noreferrer"`.
3. THE Enrichment_Block SHALL display the article title as the link text.
4. THE Enrichment_Block SHALL style article links consistently with the existing retro theme of the Chat_Panel.

### Requirement 8: Non-Breaking Integration

**User Story:** As a developer, I want the enrichment feature to be additive and non-breaking, so that existing chat, TTS, and facts functionality continues to work unchanged.

#### Acceptance Criteria

1. THE Chat_Panel SHALL continue to send messages to `/api/chat` and render Tutor_Responses with citations exactly as before the enrichment feature is added.
2. THE Chat_Panel SHALL continue to trigger TTS playback via `onTTSFetch` for each Tutor_Response exactly as before the enrichment feature is added.
3. THE Facts_Panel SHALL continue to load and display historical facts independently of the enrichment feature.
4. IF the `GEMINI_API_KEY` environment variable is not configured, THEN THE Chat_Panel SHALL skip the enrichment call entirely and display no enrichment content.

### Requirement 9: Gemini Prompt Engineering

**User Story:** As a developer, I want a well-structured Gemini prompt, so that the model returns consistently parseable and relevant results.

#### Acceptance Criteria

1. THE Gemini_Client SHALL send a prompt that instructs Gemini to return a raw JSON object with `videos` and `articles` arrays.
2. THE Gemini_Client SHALL include the Tutor_Response text in the prompt so that Gemini can identify the specific topic discussed.
3. THE Gemini_Client SHALL include the tutor Domain and tutor name in the prompt to scope content suggestions to the correct subject area.
4. THE Gemini_Client SHALL instruct Gemini to return real, existing YouTube video URLs and blog post URLs rather than fabricated links.
5. THE Gemini_Client SHALL use the `gemini-1.5-flash` model for fast response times appropriate for a non-blocking enrichment flow.
