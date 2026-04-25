# Design Document: Session, Auth & Voice Improvements

## Overview

This design covers six improvements to the Study Sanctum tutoring application:

1. **Session Reset** — Remove `sessionStorage` persistence so every page reload starts fresh.
2. **AWS Amplify Authentication** — Add sign-up/sign-in/email-verification via Amplify v6 + Cognito.
3. **Auth Persistence** — JWT tokens managed by Amplify survive reloads; app state does not.
4. **Clear Chat on Domain Change** — Reset messages, input, and audio when the user switches tutors.
5. **Single Citation** — Show only the first citation per tutor response.
6. **Wake-Word Voice** — Continuous background listening with wake-word detection, echo cancellation, and hands-free conversation.

The changes touch the React context layer, a new auth boundary component, the chat panel, and a new voice management hook. No backend API changes are required for requirements 1, 4, or 5. Requirement 2/3 adds Amplify client-side configuration and a Cognito User Pool. Requirement 6 restructures the existing Web Speech API usage into a continuous-listening architecture.

## Architecture

### High-Level Component Flow

```mermaid
graph TD
    subgraph "Auth Layer"
        A[layout.tsx] --> B[AmplifyProvider]
        B --> C[AuthGate]
    end

    subgraph "App Layer"
        C -->|authenticated| D[AppProvider]
        D --> E[Nav]
        D --> F[Home Page]
        F --> G[DomainCard x4]
        F --> H[TutorPage]
    end

    subgraph "Tutor Page"
        H --> I[Avatar]
        H --> J[ChatPanel]
        H --> K[AudioPlayer]
        H --> L[FactsPanel]
        H --> M[PdfUpload]
    end

    subgraph "Voice Pipeline"
        N[useWakeWordListener hook] -->|wake word detected| J
        J -->|submit question| O[/api/chat]
        O -->|response| J
        J -->|TTS text| K
        K -->|playback start| N
        K -->|playback end| N
    end
```

### Key Architectural Decisions

1. **Amplify v6 client-only configuration** — We use `Amplify.configure()` in a client component wrapper rather than Amplify Gen 2 backend. The Cognito User Pool is provisioned separately (console/CDK/CLI). This avoids coupling the Next.js app to Amplify's build pipeline and keeps the existing deployment model intact.

2. **AuthGate as a wrapper component** — Rather than middleware-based auth (which would require server-side Amplify config), we use a client-side `AuthGate` component that wraps the `AppProvider`. This keeps all auth state on the client and leverages Amplify's built-in `Authenticator` UI component for sign-up/sign-in flows.

3. **Voice hook extraction** — The wake-word listening logic is extracted into a `useWakeWordListener` custom hook, separate from `ChatPanel`. This keeps the chat component focused on message rendering and submission, while the hook manages the SpeechRecognition lifecycle, wake-word detection, and echo cancellation coordination.

4. **No sessionStorage** — All `sessionStorage.getItem`/`setItem` calls are removed from `AppContext`. State resets naturally on reload because React state initializes to defaults. Auth tokens are managed entirely by Amplify's own storage layer (localStorage by default).

## Components and Interfaces

### Modified Components

#### `context/AppContext.tsx` (Modified)

Remove all `sessionStorage` read/write logic. Remove the `useEffect` that restores from storage. Remove `sessionStorage.setItem` calls from `setSession` and `updatePdfValidated`. Add a `messages` state array and `clearMessages` function so chat clearing can be triggered from context when `tutorId` changes.

```typescript
interface AppState {
  sessionId: string | null;
  domain: Domain | null;
  tutorId: TutorId | null;
  pdfValidated: boolean;
  isAuthenticated: boolean;
  setSession: (domain: Domain, tutorId: TutorId) => void;
  setPdfValidated: (val: boolean) => void;
}
```

#### `components/ChatPanel.tsx` (Modified)

- Remove the internal `SpeechRecognition` setup (moved to `useWakeWordListener`).
- Accept a new prop `voiceTranscript` from the wake-word hook to auto-submit voice questions.
- Render only the first citation from `msg.citations` (Requirement 5).
- Clear messages when `tutorId` changes via a `useEffect` (Requirement 4).
- Keep MIC/STOP/SEND buttons as fallback controls.

#### `components/TutorPage.tsx` (Modified)

- Integrate `useWakeWordListener` hook.
- Pass `isSpeaking` state to the hook for echo cancellation.
- Reset `audioBuffer` and `isSpeaking` when `tutorId` changes.

#### `app/layout.tsx` (Modified)

- Wrap children with `AmplifyProvider` (Amplify configuration) and `AuthGate`.

### New Components

#### `components/AuthGate.tsx` (New)

A client component that wraps the app content. Uses Amplify's `Authenticator` component or a custom form to handle sign-up, sign-in, email verification, and sign-out.

```typescript
interface AuthGateProps {
  children: React.ReactNode;
}
```

Behavior:
- On mount, checks for existing valid session via `getCurrentUser()`.
- If authenticated, renders children.
- If not authenticated, renders sign-in/sign-up UI.
- Provides a sign-out button (rendered in `Nav` or as part of the gate).

#### `components/AmplifyProvider.tsx` (New)

A client component that calls `Amplify.configure()` with the Cognito config. Must run before any Amplify auth calls.

```typescript
// Calls Amplify.configure() with amplify config
// Renders children after configuration
```

#### `hooks/useWakeWordListener.ts` (New)

Custom hook managing continuous SpeechRecognition for wake-word detection.

```typescript
interface UseWakeWordListenerOptions {
  tutorId: TutorId | null;
  isSpeaking: boolean;           // true while TTS is playing
  onTranscript: (text: string) => void;  // called with the question text (wake word stripped)
}

interface UseWakeWordListenerReturn {
  isListening: boolean;          // continuous listening active
  isCapturing: boolean;          // wake word detected, capturing question
  wakeWordDetected: boolean;     // flash indicator
}
```

State machine:
1. **IDLE** — No `tutorId` set, recognition off.
2. **LISTENING** — Continuous recognition active, scanning for wake word in interim results.
3. **CAPTURING** — Wake word detected, collecting the full utterance as the question.
4. **PAUSED** — TTS is playing (`isSpeaking === true`), recognition stopped to prevent echo.
5. **RESTARTING** — TTS ended, waiting 500ms before resuming LISTENING.

Wake word matching logic:
- Extract tutor first name and last name from `TUTORS[tutorId].name`.
- Normalize transcript to lowercase.
- Match patterns: `{firstName}`, `{lastName}`, `hi {firstName}`, `hey {lastName}`, etc.
- Strip the wake word prefix from the transcript before passing to `onTranscript`.

### Configuration

#### `lib/amplify-config.ts` (New)

```typescript
export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    }
  }
};
```

Environment variables added to `.env.local`:
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID`
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`

## Data Models

### Authentication State

Amplify v6 manages auth tokens internally using `localStorage` (default `CognitoIdentityServiceProvider.*` keys). No custom data model is needed — we rely on Amplify's `getCurrentUser()` and `fetchAuthSession()` APIs.

### App Context State (unchanged shape, changed behavior)

```typescript
// No new fields. Behavior changes:
// - No sessionStorage persistence
// - State always initializes to defaults on mount
// - setSession no longer writes to sessionStorage
// - setPdfValidated no longer writes to sessionStorage
```

### Message Model (unchanged)

```typescript
interface Message {
  id: string;
  role: 'user' | 'tutor';
  text: string;
  citations?: Array<{ id: number; source: string; year: string; url: string }>;
}
```

### Wake Word Configuration (derived from existing data)

```typescript
// Derived at runtime from TUTORS[tutorId].name
// e.g., "Albert Einstein" → wakeWords: ["albert", "einstein"]
// Greeting prefixes: ["hi", "hey", "hello", "ok", "okay"]
```

No new database tables, API routes, or persistent storage models are introduced.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: SessionStorage Isolation

*For any* sequence of AppContext operations (mount, `setSession` with any valid domain/tutorId pair, `setPdfValidated` with any boolean), `sessionStorage.getItem('historai_session')` SHALL return null and `sessionStorage.setItem` SHALL never be called.

**Validates: Requirements 1.1, 1.3, 1.4**

### Property 2: Auth Error Message Pass-Through

*For any* error message string returned by Amplify Auth during sign-in or sign-up, the AuthGate component SHALL render that exact error message string in the UI.

**Validates: Requirements 2.5**

### Property 3: Session Reset on Domain Selection

*For any* sequence of domain selections (calling `setSession` with different domain/tutorId pairs), each call SHALL produce a `sessionId` that differs from the previous one, and `pdfValidated` SHALL be `false` after each call.

**Validates: Requirements 4.1**

### Property 4: Chat State Reset on Tutor Change

*For any* non-empty message list and any non-empty input string in ChatPanel, when `tutorId` changes to a different value, the message list SHALL become empty and the input field SHALL become an empty string.

**Validates: Requirements 4.2, 4.3**

### Property 5: Single Citation Rendering

*For any* tutor message with a non-empty citations array of length N ≥ 1, the ChatPanel SHALL render exactly one citation, matching `citations[0]`, as a clickable link where `href` equals the citation's `url` and `target` equals `_blank`.

**Validates: Requirements 5.1, 5.3**

### Property 6: Wake Word Detection Correctness

*For any* tutor and any transcript string, the wake word detector SHALL return `true` if and only if the transcript (case-insensitive) contains the tutor's first name or last name, optionally preceded by a greeting prefix ("hi", "hey", "hello", "ok", "okay").

**Validates: Requirements 6B.4, 6B.6**

### Property 7: Wake Word Stripping

*For any* transcript that contains a recognized wake word pattern followed by a question, the extracted question text SHALL equal the original transcript with the wake word prefix (and any leading whitespace) removed.

**Validates: Requirements 6B.5, 6C.7**

### Property 8: Text Submission Independence

*For any* non-empty input string and any SpeechRecognizer state (idle, listening, capturing, paused), clicking SEND SHALL submit the typed message to `/api/chat`.

**Validates: Requirements 6E.14**

## Error Handling

### Authentication Errors

| Error Scenario | Handling |
|---|---|
| Invalid credentials (sign-in) | Display Amplify error message in AuthGate UI. Do not redirect. |
| Invalid/expired verification code | Display error, show "Resend Code" button. |
| Expired JWT (no refresh possible) | Redirect to sign-in form. Clear any stale auth state. |
| Network error during auth | Display generic "Connection error, please try again" message. |
| Amplify configuration missing | Log error to console. Show "Authentication unavailable" message. |

### Voice / Speech Recognition Errors

| Error Scenario | Handling |
|---|---|
| SpeechRecognition not supported | Log warning. Disable wake-word mode. MIC button falls back to alert. |
| Recognition `onerror` event | Log error type. Auto-restart recognition after 1 second delay. |
| Recognition `onend` (unexpected) | Auto-restart recognition after 1 second delay (same as error). |
| Microphone permission denied | Show user-facing message: "Microphone access required for voice features." Disable wake-word mode. |
| TTS fetch failure | Log error. Do not block chat. Skip audio playback, resume listening. |

### Session / State Errors

| Error Scenario | Handling |
|---|---|
| `crypto.randomUUID()` unavailable | Fallback to `Date.now().toString(36) + Math.random().toString(36)`. |
| Chat API returns error | Display "SYSTEM ERROR: COMM LINK FAILED" message (existing behavior). |

## Testing Strategy

### Property-Based Testing

This feature is suitable for property-based testing. The wake-word detection logic, citation filtering, session state management, and wake-word stripping are all pure functions or have clear input/output behavior with large input spaces.

**Library:** [fast-check](https://github.com/dubzzz/fast-check) (TypeScript PBT library)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: session-auth-voice-improvements, Property {N}: {title}`

**Property tests to implement (8 properties from Correctness Properties section):**

1. **SessionStorage Isolation** — Generate random domain/tutorId/boolean sequences, run AppContext operations, assert sessionStorage untouched.
2. **Auth Error Message Pass-Through** — Generate random error strings, mock Amplify rejection, assert string appears in rendered output.
3. **Session Reset on Domain Selection** — Generate random sequences of setSession calls, assert sessionId uniqueness and pdfValidated reset.
4. **Chat State Reset on Tutor Change** — Generate random message arrays and input strings, change tutorId, assert both cleared.
5. **Single Citation Rendering** — Generate random citation arrays (1-10 items), render message, assert exactly one citation displayed matching first element.
6. **Wake Word Detection Correctness** — Generate random transcripts with/without wake words for all tutors, assert detection matches expected boolean.
7. **Wake Word Stripping** — Generate random wake-word + question transcripts, assert extracted question equals input minus wake word prefix.
8. **Text Submission Independence** — Generate random input strings and recognizer states, assert submission occurs.

### Unit Tests (Example-Based)

- AppContext initializes to default values on mount (Req 1.2)
- ChatPanel renders empty message list on mount (Req 1.5)
- PdfUpload shows upload prompt when pdfValidated=false (Req 1.6)
- AuthGate renders sign-in form when unauthenticated (Req 2.1)
- AuthGate hides DomainCard/TutorPage when unauthenticated (Req 2.7)
- TutorPage resets audioBuffer/isSpeaking on domain change (Req 4.4)
- ChatPanel renders no sources section for zero citations (Req 5.2)
- SpeechRecognition starts with continuous=true and interimResults=true (Req 6A.1, 6A.2)
- Recognition auto-restarts on error/unexpected end (Req 6A.3)
- Recognition pauses when isSpeaking=true (Req 6D.9)
- Recognition resumes within 500ms when isSpeaking becomes false (Req 6D.10)
- MIC/STOP/SEND buttons visible during continuous listening (Req 6E.12)
- MIC button activates push-to-talk override (Req 6E.13)

### Integration Tests

- Amplify signUp → verification → signIn flow with mocked Cognito (Req 2.2, 2.3, 2.4)
- Amplify signOut clears auth state (Req 2.8)
- JWT token check on page load restores auth (Req 3.1, 3.2)
- Expired JWT redirects to sign-in (Req 3.4)
- Invalid verification code shows error + resend option (Req 2.6)
- Auth persistence + app state reset are independent (Req 3.3)
