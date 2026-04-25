# Implementation Plan: Session, Auth & Voice Improvements

## Overview

Incremental implementation of six improvements to Study Sanctum: session reset, AWS Amplify authentication, chat clearing on domain change, single-citation display, and wake-word activated voice. Each task builds on the previous, starting with foundational context changes and ending with voice integration wiring.

## Tasks

- [x] 1. Remove sessionStorage persistence from AppContext
  - [x] 1.1 Strip sessionStorage logic from `context/AppContext.tsx`
    - Remove the `useEffect` that reads from `sessionStorage.getItem('historai_session')` on mount
    - Remove `sessionStorage.setItem` calls from `setSession` and `updatePdfValidated`
    - State should initialize to defaults: `sessionId: null`, `domain: null`, `tutorId: null`, `pdfValidated: false`
    - Keep the `fetch('/api/session/...')` calls intact — only storage is removed
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 1.2 Write property test for SessionStorage Isolation
    - **Property 1: SessionStorage Isolation**
    - Generate random domain/tutorId/boolean sequences, run AppContext operations, assert `sessionStorage.getItem('historai_session')` returns null and `sessionStorage.setItem` is never called
    - Install `fast-check` as a dev dependency
    - **Validates: Requirements 1.1, 1.3, 1.4**

  - [ ]* 1.3 Write property test for Session Reset on Domain Selection
    - **Property 3: Session Reset on Domain Selection**
    - Generate random sequences of `setSession` calls with different domain/tutorId pairs, assert each call produces a unique `sessionId` and `pdfValidated` is `false` after each call
    - **Validates: Requirements 4.1**

- [x] 2. Install AWS Amplify and create auth components
  - [x] 2.1 Install `aws-amplify` and `@aws-amplify/ui-react`, create `lib/amplify-config.ts`
    - Run `npm install aws-amplify @aws-amplify/ui-react`
    - Create `lib/amplify-config.ts` exporting the Amplify config object reading `NEXT_PUBLIC_COGNITO_USER_POOL_ID` and `NEXT_PUBLIC_COGNITO_CLIENT_ID` from env
    - Add placeholder values for `NEXT_PUBLIC_COGNITO_USER_POOL_ID` and `NEXT_PUBLIC_COGNITO_CLIENT_ID` to `.env.local`
    - _Requirements: 2.1, 3.1_

  - [x] 2.2 Create `components/AmplifyProvider.tsx`
    - Client component that calls `Amplify.configure()` with the config from `lib/amplify-config.ts`
    - Renders `children` after configuration
    - _Requirements: 2.1, 3.1_

  - [x] 2.3 Create `components/AuthGate.tsx`
    - Client component wrapping children with Amplify's `Authenticator` component or custom sign-in/sign-up form
    - On mount, check for existing valid session via `getCurrentUser()`
    - If authenticated, render children; if not, render sign-in/sign-up UI
    - Handle sign-up with email verification flow
    - Display Amplify error messages for invalid credentials and invalid/expired verification codes
    - Provide sign-out functionality
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.2, 3.4_

  - [ ]* 2.4 Write property test for Auth Error Message Pass-Through
    - **Property 2: Auth Error Message Pass-Through**
    - Generate random error message strings, mock Amplify Auth rejection, assert the exact error string appears in the rendered AuthGate output
    - **Validates: Requirements 2.5**

- [x] 3. Wire auth into layout and Nav
  - [x] 3.1 Update `app/layout.tsx` to wrap with AmplifyProvider and AuthGate
    - Wrap the existing `AppProvider` with `AmplifyProvider` → `AuthGate` → `AppProvider`
    - Ensure auth check happens before any app content renders
    - _Requirements: 2.1, 2.7, 3.1, 3.2_

  - [x] 3.2 Add sign-out button to `components/Nav.tsx`
    - Import Amplify `signOut` function
    - Add a "SIGN OUT" button to the nav bar
    - On click, call `signOut()` which clears auth state and returns user to sign-in form
    - _Requirements: 2.8_

- [x] 4. Checkpoint — Verify session reset and auth
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Clear chat on domain/tutor change
  - [x] 5.1 Add `useEffect` in `components/ChatPanel.tsx` to clear messages and input when `tutorId` changes
    - Watch `tutorId` from `useAppContext()` in a `useEffect`
    - When `tutorId` changes, set `messages` to `[]` and `input` to `''`
    - _Requirements: 4.2, 4.3_

  - [x] 5.2 Reset audio state in `components/TutorPage.tsx` when `tutorId` changes
    - Add a `useEffect` watching `tutorId` that sets `audioBuffer` to `null` and `isSpeaking` to `false`
    - _Requirements: 4.4_

  - [ ]* 5.3 Write property test for Chat State Reset on Tutor Change
    - **Property 4: Chat State Reset on Tutor Change**
    - Generate random non-empty message arrays and non-empty input strings, simulate `tutorId` change, assert messages become empty and input becomes empty string
    - **Validates: Requirements 4.2, 4.3**

- [x] 6. Limit citations to single citation
  - [x] 6.1 Update citation rendering in `components/ChatPanel.tsx`
    - Change the citations rendering block to display only `msg.citations[0]` instead of mapping over all citations
    - Render the single citation's `source` as a clickable link with `href={cit.url}` and `target="_blank"`
    - When `msg.citations` is empty or undefined, do not render the sources section
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 6.2 Write property test for Single Citation Rendering
    - **Property 5: Single Citation Rendering**
    - Generate random citation arrays of length 1–10, render a tutor message, assert exactly one citation is displayed matching `citations[0]` with correct `href` and `target="_blank"`
    - **Validates: Requirements 5.1, 5.3**

- [x] 7. Checkpoint — Verify domain-change clearing and single citation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Create useWakeWordListener hook
  - [x] 8.1 Create `hooks/useWakeWordListener.ts` with wake-word detection logic
    - Implement the state machine: IDLE → LISTENING → CAPTURING → PAUSED → RESTARTING
    - Extract tutor first/last name from `TUTORS[tutorId].name`
    - Normalize transcript to lowercase for matching
    - Match wake word patterns: `{firstName}`, `{lastName}`, greeting prefixes ("hi", "hey", "hello", "ok", "okay") followed by name
    - Strip wake word prefix from transcript before calling `onTranscript`
    - Start continuous `SpeechRecognition` with `continuous=true` and `interimResults=true`
    - Auto-restart on error or unexpected end after 1 second delay
    - Pause recognition when `isSpeaking` is true (echo cancellation)
    - Resume recognition within 500ms when `isSpeaking` becomes false
    - _Requirements: 6A.1, 6A.2, 6A.3, 6B.4, 6B.5, 6B.6, 6C.7, 6D.9, 6D.10, 6D.11_

  - [ ]* 8.2 Write property test for Wake Word Detection Correctness
    - **Property 6: Wake Word Detection Correctness**
    - Generate random transcripts with/without wake words for all four tutors, assert detection returns `true` iff transcript contains tutor's first or last name (case-insensitive), optionally preceded by a greeting prefix
    - **Validates: Requirements 6B.4, 6B.6**

  - [ ]* 8.3 Write property test for Wake Word Stripping
    - **Property 7: Wake Word Stripping**
    - Generate random wake-word + question transcripts, assert extracted question equals original transcript minus the wake word prefix and leading whitespace
    - **Validates: Requirements 6B.5, 6C.7**

- [x] 9. Integrate wake-word listener into TutorPage and ChatPanel
  - [x] 9.1 Wire `useWakeWordListener` into `components/TutorPage.tsx`
    - Call `useWakeWordListener({ tutorId, isSpeaking, onTranscript })` in TutorPage
    - Pass the transcript callback that triggers message submission in ChatPanel
    - Pass `isSpeaking` for echo cancellation coordination
    - _Requirements: 6A.1, 6D.9, 6D.10_

  - [x] 9.2 Update `components/ChatPanel.tsx` to accept and auto-submit voice transcripts
    - Add a `voiceTranscript` prop (or callback pattern) to receive text from the wake-word hook
    - When `voiceTranscript` is received, auto-submit it as a user message via `submitMessage`
    - Display the voice-captured question in the message list as a user message
    - Remove the old internal `SpeechRecognition` setup (replaced by the hook)
    - Keep MIC/STOP/SEND buttons functional as fallback controls
    - MIC button should use push-to-talk behavior, temporarily overriding wake-word mode
    - _Requirements: 6C.7, 6C.8, 6E.12, 6E.13, 6E.14_

  - [ ]* 9.3 Write property test for Text Submission Independence
    - **Property 8: Text Submission Independence**
    - Generate random non-empty input strings and random SpeechRecognizer states (idle, listening, capturing, paused), assert that clicking SEND submits the typed message regardless of recognizer state
    - **Validates: Requirements 6E.14**

- [x] 10. Final checkpoint — Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use `fast-check` library and validate the 8 correctness properties from the design document
- The wake-word hook is built and tested independently before integration to catch issues early
- Auth components use Amplify v6 client-side APIs — no server-side Amplify config needed
