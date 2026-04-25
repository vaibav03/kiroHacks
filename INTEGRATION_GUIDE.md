# HistorAI Game Module — Integration Guide

This document explains how to plug the Game Module (Section 4) into the
existing HistorAI Next.js platform built by the rest of the team.

---

## 1. What this module delivers

| File | Purpose |
|---|---|
| `components/GameModule/GameModule.tsx` | Main React component — drop-in for Section 4 |
| `components/GameModule/GameModule.module.css` | Scoped CSS — pixel-art game theme, no global leakage |
| `components/GameModule/lincolnData.ts` | Default puzzle data (Abraham Lincoln biography) |
| `components/GameModule/types.ts` | Shared TypeScript interfaces |
| `preview/game.html` | Standalone HTML prototype for design reference |

---

## 2. Install dependencies

```bash
npm install @dnd-kit/core html-to-image
```

> `@dnd-kit/core` is used for drag-and-drop letter placement (optional enhancement).
> `html-to-image` is used for the Legacy Cover PNG download.

Add the Google Fonts import to your `app/layout.tsx` or `_document.tsx`:

```tsx
// app/layout.tsx
import { Bangers, Inter } from 'next/font/google';

const bangers = Bangers({ weight: '400', subsets: ['latin'], variable: '--font-bangers' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
```

Or add directly to `<head>` in your layout:

```html
<link href="https://fonts.googleapis.com/css2?family=Bangers&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
```

---

## 3. Add panel images

Copy your three panel images into the Next.js `public` folder:

```
public/
  panels/
    1.png   ← Kentucky / Early Life (Panel 1)
    2.png   ← Civil War speech (Panel 2)
    3.png   ← Gettysburg / Legacy (Panel 3)
```

The paths are configured in `lincolnData.ts` as `/panels/1.png` etc.
Update them there if you use different filenames.

---

## 4. Drop the component into the platform page

The platform is a single scrolling page with anchored sections.
Section 4 (`#game`) is where the Game Module lives.

### In your main page file (e.g. `app/page.tsx`):

```tsx
import { GameModule } from '@/components/GameModule/GameModule';
import { lincolnSlots, lincolnPanels, GRID_WIDTH, GRID_HEIGHT } from '@/components/GameModule/lincolnData';

export default function HistorAIPage() {
  // isPdfUploaded and studentName come from your platform's state
  // (managed by Section 1 / Section 2 team)
  const isPdfUploaded = true;   // replace with real state
  const studentName = 'Student'; // replace with real state

  return (
    <main>
      {/* Section 1: Hero + Domain Selection */}
      <section id="home">...</section>

      {/* Section 2: Tutor Chat */}
      <section id="tutors">...</section>

      {/* Section 3: Comic */}
      <section id="comic">...</section>

      {/* Section 4: Game Module ← this is your part */}
      <section id="game">
        <GameModule
          lessonTitle="Lincoln's chapter, as a quest"
          pdfFilename="lincoln-biography.pdf"
          isUnlocked={isPdfUploaded}
          slots={lincolnSlots}
          panels={lincolnPanels}
          gridWidth={GRID_WIDTH}
          gridHeight={GRID_HEIGHT}
          studentName={studentName}
          onWordSolved={(slotId) => {
            // Wire up Section 1 avatar animation here
            // e.g. avatarRef.current?.playDrawingAnimation()
            console.log('Word solved:', slotId);
          }}
        />
      </section>
    </main>
  );
}
```

---

## 5. Navbar integration

The platform navbar shows "Game" as a locked link until a PDF is uploaded.
The Game Module's `isUnlocked` prop controls the locked overlay inside the
component. The navbar lock/unlock is handled by Section 1 — they need to
pass the same `isPdfUploaded` boolean to both the navbar and this component.

### What to tell the Section 1 team:

> "When `isPdfUploaded` becomes `true`, set `isUnlocked={true}` on the
> `<GameModule>` component and remove the lock icon from the Game nav link."

---

## 6. Avatar integration (Section 1 handoff)

The Game Module exposes an `onWordSolved` callback prop. Every time a
crossword word is fully solved, this fires with the word slot ID.

The Section 1 avatar component should subscribe to this to trigger its
"Drawing" animation.

### Contract:

```tsx
// In GameModule props:
onWordSolved?: (slotId: string) => void;

// Example wiring once Section 1 avatar is ready:
<GameModule
  ...
  onWordSolved={(slotId) => {
    avatarRef.current?.triggerDrawAnimation();
  }}
/>
```

The avatar placeholder (`🎨` emoji in a fixed bottom-right box) is already
in the layout — Section 1 replaces it with their `<AvatarWidget>` component.

---

## 7. Passing dynamic puzzle data (future)

Currently the puzzle uses the hardcoded Lincoln biography data from
`lincolnData.ts`. When the platform generates puzzles from uploaded PDFs
via Gemini, replace the static data with the API response:

```tsx
// Future: fetch puzzle from your API
const { slots, panels } = await generatePuzzle(uploadedPdfText, 'lincoln');

<GameModule
  slots={slots}
  panels={panels}
  ...
/>
```

The `SlotConfig` and `PanelConfig` interfaces in `GameModule.tsx` define
the exact shape the API response must match.

---

## 8. Tutor accent color

The Lincoln tutor uses burgundy (`#6B2737`) as the platform accent color.
The Game Module uses its own pixel-art palette internally (gold `#f1c40f`,
red `#e74c3c`) which is intentionally distinct — it's a separate visual
mode from the chat/comic sections.

If the team wants to unify accent colors, add an `accentColor` prop to
`GameModule.tsx` and thread it through the CSS variables.

---

## 9. CSS isolation

All Game Module styles are in `GameModule.module.css` using CSS Modules.
No global styles are added. The component sets its own CSS variables on
`.root` so they don't leak into the platform shell.

The only global requirement is the `Bangers` font (already imported via
Google Fonts in the platform layout).

---

## 10. File structure summary

```
components/
  GameModule/
    GameModule.tsx          ← Main component (import this)
    GameModule.module.css   ← Scoped styles
    lincolnData.ts          ← Default puzzle data
    types.ts                ← Shared interfaces

public/
  panels/
    1.png                   ← Panel 1 image (Early Life)
    2.png                   ← Panel 2 image (Civil War)
    3.png                   ← Panel 3 image (Legacy)

preview/
  game.html                 ← Standalone HTML prototype (design reference)
```

---

## 11. Quick checklist before merging

- [ ] `npm install` — dependencies installed
- [ ] Panel images copied to `public/panels/`
- [ ] Google Fonts `Bangers` loaded in layout
- [ ] `<GameModule>` added to `#game` section in main page
- [ ] `isUnlocked` wired to platform's PDF upload state
- [ ] `onWordSolved` callback connected to Section 1 avatar (or left as `console.log` for now)
- [ ] Navbar "Game" link points to `#game` anchor
- [ ] Navbar lock/unlock state matches `isUnlocked` prop
