# Implementation Plan: Game Module Integration

## Overview

Integrate the crossword puzzle Game Module from `kiroHacks-Aadhi/` into the Study Sanctum Next.js 14 app. The work is primarily wiring: copy source files and assets, install dependencies, create a `/game` route page, update Nav to use internal Link, and load the Bangers font. Property-based tests validate the 5 correctness properties from the design.

## Tasks

- [x] 1. Copy Game Module source files and panel images
  - [x] 1.1 Copy all files from `kiroHacks-Aadhi/components/GameModule/` to `components/GameModule/`
    - Preserve all `.tsx`, `.ts`, and `.module.css` files with original names and structure
    - Verify `components/GameModule/index.ts` exports `GameModule` component and Lincoln data types
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 1.2 Copy panel images from `kiroHacks-Aadhi/preview/` to `public/panels/`
    - Copy `1.png`, `2.png`, `3.png` to `public/panels/`
    - _Requirements: 2.1, 2.2_

- [x] 2. Install npm dependencies
  - [x] 2.1 Add `@dnd-kit/core` and `html-to-image` to project dependencies
    - Run `npm install @dnd-kit/core html-to-image`
    - Verify both packages appear in `package.json` dependencies
    - _Requirements: 3.1, 3.2_

- [x] 3. Checkpoint — Verify file copy and dependencies
  - Ensure all GameModule files exist in `components/GameModule/`, panel images exist in `public/panels/`, and `npm install` completes without errors. Ask the user if questions arise.

- [x] 4. Create the `/game` route page
  - [x] 4.1 Create `app/game/page.tsx` as a client component
    - Add `'use client'` directive
    - Read `domain` query parameter from URL via `useSearchParams()`
    - Read `pdfValidated` and `domain` from `AppContext`
    - Import `GameModule` from `@/components/GameModule/GameModule`
    - Import `lincolnSlots`, `lincolnPanels`, `GRID_WIDTH`, `GRID_HEIGHT` from `@/components/GameModule/lincolnData`
    - Create a `DOMAIN_TITLES` mapping to derive `lessonTitle` from the active domain
    - Pass `isUnlocked={pdfValidated}`, Lincoln data props, `lessonTitle`, `pdfFilename`, and `onWordSolved` callback to `GameModule`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  - [ ]* 4.2 Write property test: Domain-to-title mapping always produces a valid title
    - **Property 1: Domain-to-title mapping always produces a valid title**
    - Generate random valid Domain values from TUTORS config, verify mapping returns non-empty string
    - **Validates: Requirements 4.6**
  - [ ]* 4.3 Write unit tests for Game Page
    - Test that Game Page renders GameModule with Lincoln data props
    - Test that Game Page reads domain from URL search params
    - Test that Game Page reads pdfValidated from AppContext and passes as isUnlocked
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Update Nav component to use internal Link for game route
  - [x] 5.1 Modify `components/Nav.tsx` to use Next.js `Link` for "PUZZLE GAME"
    - Replace `<a href={NEXT_PUBLIC_GAME_APP_URL}>` with `<Link href={"/game?domain=${domain}"}>`
    - Keep disabled state rendering when `pdfValidated` is false
    - Remove dependency on `NEXT_PUBLIC_GAME_APP_URL` environment variable
    - _Requirements: 5.1, 5.2, 5.3_
  - [ ]* 5.2 Write property test: Nav puzzle link href matches domain
    - **Property 2: Nav puzzle link href matches domain**
    - Generate random valid domain strings, render Nav with pdfValidated=true, verify link href equals `/game?domain={domain}`
    - **Validates: Requirements 5.1**

- [x] 6. Update layout to load Bangers Google Font
  - [x] 6.1 Modify `app/layout.tsx` to import and apply the Bangers font
    - Import `Bangers` from `next/font/google`
    - Add `--font-bangers` CSS variable to the `<body>` className alongside existing `--font-pixel`
    - _Requirements: 6.4_

- [x] 7. Checkpoint — Verify routing, navigation, and font loading
  - Ensure the `/game` route renders the GameModule, Nav links correctly to `/game?domain={domain}`, and the Bangers font loads. Ensure all tests pass. Ask the user if questions arise.

- [ ] 8. Game state and callback property tests
  - [ ]* 8.1 Write property test: onWordSolved fires when a word slot is fully solved
    - **Property 3: onWordSolved fires when a word slot is fully solved**
    - For each word slot, fill all cells with correct letters via reducer dispatch, verify onWordSolved callback fires with that slot's ID
    - **Validates: Requirements 7.1**
  - [ ]* 8.2 Write property test: Panel unlocks when ink level meets threshold
    - **Property 4: Panel unlocks when ink level meets threshold**
    - Generate random solve sequences, compute ink level, verify panels unlock at correct thresholds
    - **Validates: Requirements 7.2**
  - [ ]* 8.3 Write property test: Game reset produces initial state (idempotence)
    - **Property 5: Game reset produces initial state**
    - Generate random game states with arbitrary letters placed, dispatch RESET, verify state matches initial state (all cells empty, ink 0, no panels unlocked, published false)
    - **Validates: Requirements 7.4**

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use `fast-check` (already present in the GameModule's `validation.test.ts`)
- The Game Module files are copied as-is — no internal modifications needed
- The integration is primarily wiring: route creation, Nav update, font loading, and context connection
