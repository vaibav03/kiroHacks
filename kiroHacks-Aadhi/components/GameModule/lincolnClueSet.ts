import type { ClueSet } from './types';

/**
 * Default prototype ClueSet — Biography of Abraham Lincoln
 *
 * Grid: 12 × 12
 * 3 panels mapped to word slot intersections:
 *   Panel 1 (Early Life)    — LINCOLN, KENTUCKY
 *   Panel 2 (Civil War)     — UNION, SLAVERY, EMANCIPATION
 *   Panel 3 (Legacy)        — GETTYSBURG, PRESIDENT, FREEDOM
 *
 * Crossword layout (0-indexed rows/cols):
 *
 *   Row 0, col 0 → LINCOLN (across, 7)
 *   Row 0, col 0 → LIBERTY (down, 7)   — L intersects at (0,0)
 *   Row 2, col 2 → KENTUCKY (across, 8)
 *   Row 2, col 2 → KENTUCKY[0]=K intersects LINCOLN[2]=N? No — placed carefully below
 *   Row 4, col 0 → UNION (across, 5)
 *   Row 4, col 0 → UNION[0]=U — down: UNION (down) not used; use SLAVERY down
 *   Row 6, col 1 → SLAVERY (across, 7)
 *   Row 6, col 1 → SLAVERY[0]=S — down: SLAVERY (down) col 1 row 6
 *   Row 8, col 0 → GETTYSBURG (across, 10)
 *   Row 8, col 0 → GETTYSBURG[0]=G — down: GETTYSBURG (down) not used
 *   Row 1, col 6 → PRESIDENT (down, 9)  — P at (1,6)
 *   Row 3, col 4 → EMANCIPATION (across, 12) — too long for 12-wide; use EMANCIPATE (10)
 *   Row 5, col 2 → FREEDOM (across, 7)
 *
 * Simplified valid layout for a 12×12 grid:
 */

export const lincolnClueSet: ClueSet = {
  gridWidth: 12,
  gridHeight: 12,
  panels: [
    {
      id: 'panel-1',
      order: 0,
      sketchSrc: '/panels/lincoln-panel1-sketch.png',
      inkSrc: '/panels/lincoln-panel1-ink.png',
      dialogueSrc: '/panels/lincoln-panel1-dialogue.png',
      dialogues: [
        {
          text: 'Born in a log cabin, 1809.',
          position: { top: '10%', left: '5%' },
          type: 'caption',
        },
        {
          text: 'FRONTIER!',
          position: { top: '55%', left: '60%' },
          type: 'sfx',
        },
      ],
    },
    {
      id: 'panel-2',
      order: 1,
      sketchSrc: '/panels/lincoln-panel2-sketch.png',
      inkSrc: '/panels/lincoln-panel2-ink.png',
      dialogueSrc: '/panels/lincoln-panel2-dialogue.png',
      dialogues: [
        {
          text: '"A house divided against itself cannot stand."',
          position: { top: '8%', left: '5%' },
          type: 'speech',
        },
        {
          text: '1863!',
          position: { top: '60%', left: '65%' },
          type: 'sfx',
        },
      ],
    },
    {
      id: 'panel-3',
      order: 2,
      sketchSrc: '/panels/lincoln-panel3-sketch.png',
      inkSrc: '/panels/lincoln-panel3-ink.png',
      dialogueSrc: '/panels/lincoln-panel3-dialogue.png',
      dialogues: [
        {
          text: '"With malice toward none, with charity for all."',
          position: { top: '8%', left: '5%' },
          type: 'speech',
        },
        {
          text: 'FREEDOM!',
          position: { top: '62%', left: '55%' },
          type: 'sfx',
        },
      ],
    },
  ],
  wordSlots: [
    // ── Panel 1: Early Life ──────────────────────────────────────────────────
    {
      id: 'lincoln-across',
      answer: 'LINCOLN',
      clue: '16th President of the United States (7 letters)',
      direction: 'across',
      startRow: 0,
      startCol: 0,
      panelId: 'panel-1',
    },
    {
      id: 'log-down',
      answer: 'LAWYER',
      clue: 'Lincoln\'s profession before politics (6 letters)',
      direction: 'down',
      startRow: 0,
      startCol: 0,
      panelId: 'panel-1',
    },
    {
      id: 'kentucky-across',
      answer: 'KENTUCKY',
      clue: 'State where Lincoln was born (8 letters)',
      direction: 'across',
      startRow: 2,
      startCol: 1,
      panelId: 'panel-1',
    },

    // ── Panel 2: Civil War ───────────────────────────────────────────────────
    {
      id: 'union-across',
      answer: 'UNION',
      clue: 'What Lincoln fought to preserve (5 letters)',
      direction: 'across',
      startRow: 4,
      startCol: 0,
      panelId: 'panel-2',
    },
    {
      id: 'slavery-across',
      answer: 'SLAVERY',
      clue: 'Institution abolished by the 13th Amendment (7 letters)',
      direction: 'across',
      startRow: 6,
      startCol: 0,
      panelId: 'panel-2',
    },
    {
      id: 'senate-down',
      answer: 'SENATE',
      clue: 'Legislative body Lincoln served in before the presidency (6 letters)',
      direction: 'down',
      startRow: 4,
      startCol: 4,
      panelId: 'panel-2',
    },

    // ── Panel 3: Legacy ──────────────────────────────────────────────────────
    {
      id: 'gettysburg-across',
      answer: 'GETTYSBURG',
      clue: 'Site of Lincoln\'s famous 1863 address (10 letters)',
      direction: 'across',
      startRow: 8,
      startCol: 0,
      panelId: 'panel-3',
    },
    {
      id: 'freedom-across',
      answer: 'FREEDOM',
      clue: 'Core value of the Emancipation Proclamation (7 letters)',
      direction: 'across',
      startRow: 10,
      startCol: 0,
      panelId: 'panel-3',
    },
    {
      id: 'president-down',
      answer: 'PRESIDENT',
      clue: 'Highest office in the United States (9 letters)',
      direction: 'down',
      startRow: 0,
      startCol: 9,
      panelId: 'panel-3',
    },
  ],
};
