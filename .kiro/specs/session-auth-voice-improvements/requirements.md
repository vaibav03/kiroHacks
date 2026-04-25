# Requirements Document

## Introduction

This document specifies six improvements to the Study Sanctum tutoring application: session reset on page reload, AWS Amplify authentication with JWT persistence, chat clearing on domain change, single-citation display in tutor responses, and wake-word activated bidirectional voice conversation. Together these improvements harden session lifecycle management, add user authentication, streamline the chat UI, and deliver a hands-free voice experience.

## Glossary

- **App_Context**: The React Context provider (`AppProvider`) that holds application state including `sessionId`, `domain`, `tutorId`, and `pdfValidated`.
- **Session_Storage**: The browser `sessionStorage` API currently used to persist session data across renders under the key `historai_session`.
- **Chat_Panel**: The chat UI component (`ChatPanel.tsx`) that renders messages, handles text input, voice recording, and message submission.
- **Tutor_Page**: The tutor page layout component (`TutorPage.tsx`) that composes the avatar, PDF upload, chat panel, facts panel, and audio player.
- **Domain_Card**: The card component (`DomainCard.tsx`) that allows users to select a tutor domain, calling `setSession` on click.
- **Auth_Gate**: A new authentication boundary component that blocks access to the home page content until the user has signed in or signed up via AWS Amplify Auth.
- **Amplify_Auth**: The AWS Amplify Authentication library providing sign-up, sign-in, email verification, and JWT token management.
- **JWT_Token**: A JSON Web Token issued by AWS Amplify Cognito that persists authentication state across page reloads.
- **Speech_Recognizer**: The Web Speech API `SpeechRecognition` instance used for voice input in the Chat_Panel.
- **Wake_Word**: The tutor's name (e.g., "Albert", "Einstein", "Lincoln", "Mozart", "Shakespeare") spoken by the user to activate voice input mode.
- **TTS_Player**: The AudioPlayer component that decodes and plays ElevenLabs TTS audio through the Web Audio API.
- **Echo_Cancellation**: The mechanism that pauses the Speech_Recognizer while the TTS_Player is outputting audio to prevent the system from capturing its own speech as user input.
- **Citation**: A source reference object containing `id`, `source`, `year`, and `url` fields returned by the RAG pipeline alongside tutor responses.
- **PDF_Upload**: The component (`PdfUpload.tsx`) that handles PDF file upload and domain validation.

## Requirements

### Requirement 1: Session Reset on Page Reload

**User Story:** As a student, I want my uploaded PDF data and chat history to be cleared when I reload the page, so that I start each browser session with a clean slate and must re-upload my study material.

#### Acceptance Criteria

1. WHEN the page loads, THE App_Context SHALL NOT restore `sessionId`, `domain`, `tutorId`, or `pdfValidated` values from Session_Storage.
2. WHEN the page loads, THE App_Context SHALL initialize `sessionId` to null, `domain` to null, `tutorId` to null, and `pdfValidated` to false.
3. WHEN the App_Context calls `setSession`, THE App_Context SHALL NOT write session data to Session_Storage.
4. WHEN the App_Context calls `setPdfValidated`, THE App_Context SHALL NOT write session data to Session_Storage.
5. WHEN the page loads after a reload, THE Chat_Panel SHALL display an empty message list.
6. WHEN the page loads after a reload, THE PDF_Upload SHALL display the upload prompt instead of the "MODULES UNLOCKED" state.

### Requirement 2: AWS Amplify Authentication

**User Story:** As a student, I want to sign up and sign in to Study Sanctum using my email, so that my identity is verified and only authenticated users can access the tutoring features.

#### Acceptance Criteria

1. THE Auth_Gate SHALL render a sign-in and sign-up form before displaying any home page content.
2. WHEN a new user submits the sign-up form with an email and password, THE Auth_Gate SHALL create a new account via Amplify_Auth and prompt the user for email verification.
3. WHEN a new user enters a valid verification code, THE Auth_Gate SHALL confirm the account and redirect the user to the authenticated home page.
4. WHEN an existing user submits valid credentials on the sign-in form, THE Auth_Gate SHALL authenticate the user via Amplify_Auth and display the home page content.
5. IF a user submits invalid credentials, THEN THE Auth_Gate SHALL display a descriptive error message returned by Amplify_Auth.
6. IF a user submits an invalid or expired verification code, THEN THE Auth_Gate SHALL display an error message and allow the user to request a new code.
7. WHILE the user is not authenticated, THE App_Context SHALL prevent rendering of Domain_Card components and the Tutor_Page.
8. THE Auth_Gate SHALL provide a sign-out action that clears the authentication state and returns the user to the sign-in form.

### Requirement 3: Authentication Persistence Across Reloads

**User Story:** As a student, I want my login to persist across page reloads so that I do not have to re-enter my credentials every time I refresh the browser, even though my chat and PDF state resets.

#### Acceptance Criteria

1. WHEN the page loads, THE Auth_Gate SHALL check for an existing valid JWT_Token managed by Amplify_Auth.
2. WHEN a valid JWT_Token exists, THE Auth_Gate SHALL restore the authenticated state without requiring the user to sign in again.
3. WHEN the page loads with a valid JWT_Token, THE App_Context SHALL still initialize `sessionId`, `domain`, `tutorId`, and `pdfValidated` to their default null/false values (per Requirement 1).
4. IF the JWT_Token has expired and cannot be refreshed, THEN THE Auth_Gate SHALL redirect the user to the sign-in form.

### Requirement 4: Clear Chat on Domain Change

**User Story:** As a student, I want the chat history to be cleared when I switch to a different tutor domain, so that conversations from one tutor do not carry over to another.

#### Acceptance Criteria

1. WHEN the user selects a new domain via a Domain_Card, THE App_Context SHALL generate a new `sessionId` and reset `pdfValidated` to false.
2. WHEN the `tutorId` value in App_Context changes, THE Chat_Panel SHALL clear its message list to an empty array.
3. WHEN the `tutorId` value in App_Context changes, THE Chat_Panel SHALL reset the text input field to an empty string.
4. WHEN the user switches domains, THE Tutor_Page SHALL reset the `audioBuffer` to null and set `isSpeaking` to false.

### Requirement 5: Single Citation per Tutor Response

**User Story:** As a student, I want to see only one citation link per tutor response, so that the chat interface is cleaner and I can focus on the most relevant source.

#### Acceptance Criteria

1. WHEN the Chat_Panel renders a tutor message with one or more Citation objects, THE Chat_Panel SHALL display only the first Citation from the citations array.
2. WHEN the Chat_Panel renders a tutor message with zero Citation objects, THE Chat_Panel SHALL not display a sources section.
3. THE Chat_Panel SHALL render the single Citation with its `source` text as a clickable link pointing to the Citation `url`, opening in a new browser tab.

### Requirement 6: Wake-Word Activated Bidirectional Voice

**User Story:** As a student, I want to have a hands-free conversation with my tutor by saying the tutor's name to activate voice input, so that I can interact naturally without pressing buttons.

#### Acceptance Criteria

##### 6A: Continuous Background Listening

1. WHEN the Tutor_Page is mounted and a `tutorId` is set, THE Speech_Recognizer SHALL start in continuous listening mode in the background.
2. WHILE the Speech_Recognizer is in continuous listening mode, THE Speech_Recognizer SHALL process interim speech results to detect Wake_Word presence.
3. IF the Speech_Recognizer encounters an error or stops unexpectedly, THEN THE Speech_Recognizer SHALL automatically restart continuous listening within 1 second.

##### 6B: Wake Word Detection

4. THE Speech_Recognizer SHALL recognize the following Wake_Word patterns for each tutor: the tutor's first name (e.g., "Albert", "Abraham", "Wolfgang", "William"), the tutor's last name (e.g., "Einstein", "Lincoln", "Mozart", "Shakespeare"), or a greeting prefix followed by the name (e.g., "Hi Albert", "Hey Lincoln").
5. WHEN the Speech_Recognizer detects a Wake_Word in the transcript, THE Chat_Panel SHALL enter voice capture mode and collect the user's question that follows the Wake_Word.
6. WHEN the Speech_Recognizer does not detect a Wake_Word in the transcript, THE Chat_Panel SHALL discard the transcript and continue background listening without submitting a message.

##### 6C: Voice Question Submission

7. WHEN the Chat_Panel has captured a complete question after Wake_Word detection, THE Chat_Panel SHALL submit the question text (excluding the Wake_Word) to the `/api/chat` endpoint.
8. WHEN the Chat_Panel submits a voice-captured question, THE Chat_Panel SHALL display the question in the message list as a user message.

##### 6D: TTS Response and Echo Cancellation

9. WHEN the TTS_Player begins audio playback, THE Speech_Recognizer SHALL pause continuous listening to prevent Echo_Cancellation failures.
10. WHEN the TTS_Player completes audio playback, THE Speech_Recognizer SHALL resume continuous listening within 500 milliseconds.
11. WHILE the TTS_Player is playing audio, THE Speech_Recognizer SHALL not process any speech input.

##### 6E: Fallback Controls

12. WHILE the Speech_Recognizer is in continuous listening mode, THE Chat_Panel SHALL continue to display the MIC, STOP, and SEND buttons as functional fallback controls.
13. WHEN the user clicks the MIC button during continuous listening, THE Chat_Panel SHALL use the existing push-to-talk behavior, temporarily overriding the wake-word mode for that single interaction.
14. WHEN the user types text and clicks SEND, THE Chat_Panel SHALL submit the typed message regardless of the Speech_Recognizer state.
