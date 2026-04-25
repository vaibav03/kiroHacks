# Requirements Document

## Introduction

Integrate a teammate's crossword puzzle game module (from `kiroHacks-Aadhi/`) into the existing Study Sanctum Next.js 14 application. The Game Module is a React component set that renders a crossword puzzle with comic panels that unlock as words are solved. It must be wired into the app's existing context (domain, pdfValidated), served on a dedicated `/game` route, and navigable from the existing Nav bar. The integration must preserve the app's retro/pixel CRT aesthetic while allowing the Game Module's own pixel-art styling to coexist via CSS Modules.

## Glossary

- **Game_Module**: The `GameModule` React component exported from `components/GameModule/GameModule.tsx`, which renders a crossword puzzle grid, clue panels, letter bank, ink progress bar, and comic panel badges.
- **Study_Sanctum_App**: The existing Next.js 14 App Router application that hosts AI tutor sessions, PDF upload, chat, and facts panels.
- **AppContext**: The React Context provider at `context/AppContext.tsx` that exposes `domain`, `tutorId`, `pdfValidated`, `sessionId`, and their setters.
- **Nav_Component**: The navigation bar component at `components/Nav.tsx` that displays links to Comic Vault and Puzzle Game.
- **Game_Page**: The Next.js page at `app/game/page.tsx` that renders the Game_Module.
- **Lincoln_Data**: The default puzzle configuration exported from `components/GameModule/lincolnData.ts` containing slot definitions, panel definitions, and grid dimensions for a Lincoln biography crossword.
- **Panel_Images**: The three PNG images (`1.png`, `2.png`, `3.png`) displayed as comic panel badges inside the Game_Module, served from `public/panels/`.
- **pdfValidated**: A boolean in AppContext that becomes `true` after a student uploads and validates a PDF, gating access to the game and comic features.
- **domain**: A string query parameter (e.g., `civil-war-presidency`) identifying the active tutor domain, read from the URL and from AppContext.

## Requirements

### Requirement 1: Copy Game Module Source Files

**User Story:** As a developer, I want the Game Module source files copied from `kiroHacks-Aadhi/components/GameModule/` into `components/GameModule/`, so that the component is available for import within the Study Sanctum app.

#### Acceptance Criteria

1. THE Study_Sanctum_App SHALL contain a `components/GameModule/` directory with all `.tsx`, `.ts`, and `.module.css` files from `kiroHacks-Aadhi/components/GameModule/`.
2. WHEN the Game_Module files are copied, THE Study_Sanctum_App SHALL preserve the original file names and directory structure of the Game_Module source.
3. THE Game_Module index file (`components/GameModule/index.ts`) SHALL export the `GameModule` component and the Lincoln_Data types.

### Requirement 2: Copy Panel Images to Public Directory

**User Story:** As a developer, I want the panel images copied to `public/panels/`, so that the Game Module can load them at runtime via standard Next.js static file serving.

#### Acceptance Criteria

1. THE Study_Sanctum_App SHALL contain `public/panels/1.png`, `public/panels/2.png`, and `public/panels/3.png` copied from `kiroHacks-Aadhi/preview/`.
2. WHEN the Game_Module renders a panel with `imageSrc` set to `/panels/1.png`, THE Study_Sanctum_App SHALL serve the corresponding image file.

### Requirement 3: Install Required npm Dependencies

**User Story:** As a developer, I want `@dnd-kit/core` and `html-to-image` added to the project dependencies, so that the Game Module's drag-and-drop and PNG export features function correctly.

#### Acceptance Criteria

1. THE Study_Sanctum_App `package.json` SHALL list `@dnd-kit/core` and `html-to-image` as dependencies.
2. WHEN `npm install` is run, THE Study_Sanctum_App SHALL install both packages without dependency conflicts.

### Requirement 4: Create Game Page Route

**User Story:** As a student, I want to access the crossword puzzle game at `/game`, so that I can play the puzzle in a dedicated full-screen view.

#### Acceptance Criteria

1. THE Game_Page SHALL exist at `app/game/page.tsx` and render the Game_Module component.
2. WHEN the Game_Page loads, THE Game_Page SHALL read the `domain` query parameter from the URL.
3. WHEN the Game_Page loads, THE Game_Page SHALL read `pdfValidated` and `domain` from AppContext.
4. THE Game_Page SHALL pass Lincoln_Data (`lincolnSlots`, `lincolnPanels`, `GRID_WIDTH`, `GRID_HEIGHT`) as props to the Game_Module.
5. THE Game_Page SHALL pass `isUnlocked` to the Game_Module, with the value sourced from the `pdfValidated` state in AppContext.
6. THE Game_Page SHALL pass a `lessonTitle` string derived from the active tutor domain (e.g., "Lincoln's Legacy Quest" for the `civil-war-presidency` domain).
7. THE Game_Page SHALL pass a `pdfFilename` string as a descriptive label to the Game_Module.
8. THE Game_Page SHALL use the `'use client'` directive since it depends on React Context and client-side hooks.

### Requirement 5: Wire Nav Component to Game Route

**User Story:** As a student, I want the "PUZZLE GAME" button in the navigation bar to take me to the `/game` page with my current domain, so that I can navigate to the game without manually entering a URL.

#### Acceptance Criteria

1. WHEN `pdfValidated` is `true`, THE Nav_Component SHALL render the "PUZZLE GAME" link as a Next.js `Link` navigating to `/game?domain={domain}` where `{domain}` is the current domain from AppContext.
2. WHEN `pdfValidated` is `false`, THE Nav_Component SHALL render the "PUZZLE GAME" button as a disabled, non-clickable element.
3. THE Nav_Component SHALL remove the dependency on the `NEXT_PUBLIC_GAME_APP_URL` environment variable for the puzzle game link.

### Requirement 6: CSS Isolation and Aesthetic Compatibility

**User Story:** As a student, I want the game page to feel visually consistent with the Study Sanctum retro/pixel aesthetic, so that the experience feels cohesive when navigating between the tutor page and the game.

#### Acceptance Criteria

1. THE Game_Module SHALL use CSS Modules (`GameModule.module.css`) for all component-specific styles, preventing style leakage into the Study_Sanctum_App global styles.
2. THE Game_Page SHALL inherit the Study_Sanctum_App root layout, including the `Press_Start_2P` pixel font variable and the CRT scanline background.
3. THE Game_Module SHALL render within the existing `<main>` layout wrapper provided by `app/layout.tsx`.
4. IF the Game_Module requires the `Bangers` Google Font, THEN THE Study_Sanctum_App layout SHALL load the `Bangers` font alongside the existing `Press_Start_2P` font.

### Requirement 7: Game State and Callback Integration

**User Story:** As a student, I want the game to respond to my crossword progress by unlocking comic panels and tracking ink level, so that I get visual feedback as I solve words.

#### Acceptance Criteria

1. WHEN a crossword word is fully solved, THE Game_Module SHALL invoke the `onWordSolved` callback with the solved slot ID.
2. WHEN the ink level reaches a panel's `unlockPct` threshold, THE Game_Module SHALL visually unlock that panel by removing the blur overlay and displaying the badge.
3. WHEN the ink level reaches 100%, THE Game_Module SHALL display the Legacy Cover modal with the student name and all unlocked panels.
4. WHEN the student clicks "NEW GAME", THE Game_Module SHALL reset all cell states, ink level, and panel unlock states to their initial values.

### Requirement 8: Locked Overlay Behavior

**User Story:** As a student who has not yet uploaded a PDF, I want to see a clear locked overlay on the game, so that I understand I need to upload a PDF first.

#### Acceptance Criteria

1. WHEN `isUnlocked` is `false`, THE Game_Module SHALL display a full-screen locked overlay with a lock icon and a message instructing the student to upload a PDF.
2. WHEN `isUnlocked` is `true`, THE Game_Module SHALL hide the locked overlay and allow full interaction with the crossword grid.
3. WHEN `pdfValidated` changes from `false` to `true` in AppContext, THE Game_Page SHALL pass `isUnlocked={true}` to the Game_Module, removing the locked overlay without a page reload.
