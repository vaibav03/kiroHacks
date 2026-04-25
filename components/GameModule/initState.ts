import type { ClueSet, GameState, CellState, WordSlotState, PanelState } from './types';

/**
 * Derives the initial GameState from a ClueSet.
 */
export function initStateFromClueSet(clueSet: ClueSet): GameState {
  // ── Build the set of active cell keys from all word slots ──────────────────
  const activeCells = new Map<string, { correctLetter: string; row: number; col: number }>();

  for (const ws of clueSet.wordSlots) {
    const answer = ws.answer.toUpperCase();
    for (let k = 0; k < answer.length; k++) {
      const row = ws.direction === 'across' ? ws.startRow : ws.startRow + k;
      const col = ws.direction === 'across' ? ws.startCol + k : ws.startCol;
      const key = `${row}-${col}`;
      // If two slots share a cell the letter must be the same (validated upstream)
      if (!activeCells.has(key)) {
        activeCells.set(key, { correctLetter: answer[k], row, col });
      }
    }
  }

  // ── Build cells Record ─────────────────────────────────────────────────────
  const cells: Record<string, CellState> = {};

  // Active cells
  for (const [key, { correctLetter, row, col }] of activeCells) {
    cells[key] = {
      row,
      col,
      isBlocked: false,
      letter: null,
      correctLetter,
      isCorrect: false,
    };
  }

  // Blocked cells (every grid position not covered by a word slot)
  for (let row = 0; row < clueSet.gridHeight; row++) {
    for (let col = 0; col < clueSet.gridWidth; col++) {
      const key = `${row}-${col}`;
      if (!cells[key]) {
        cells[key] = {
          row,
          col,
          isBlocked: true,
          letter: null,
          correctLetter: null,
          isCorrect: false,
        };
      }
    }
  }

  // ── Build wordSlots array ──────────────────────────────────────────────────
  const wordSlots: WordSlotState[] = clueSet.wordSlots.map((ws) => {
    const answer = ws.answer.toUpperCase();
    const slotCells: string[] = [];
    for (let k = 0; k < answer.length; k++) {
      const row = ws.direction === 'across' ? ws.startRow : ws.startRow + k;
      const col = ws.direction === 'across' ? ws.startCol + k : ws.startCol;
      slotCells.push(`${row}-${col}`);
    }
    return {
      id: ws.id,
      direction: ws.direction,
      cells: slotCells,
      panelId: ws.panelId,
      solvedLetterCount: 0,
      isFullySolved: false,
    };
  });

  // ── Build panelStates Record ───────────────────────────────────────────────
  const panelStates: Record<string, PanelState> = {};
  for (const panel of clueSet.panels) {
    panelStates[panel.id] = { panelId: panel.id, tier: 0 };
  }

  return {
    cells,
    wordSlots,
    selectedWordSlotId: null,
    selectedLetter: null,
    panelStates,
    inkLevel: 0,
    publishEventFired: false,
    isLocked: false,
  };
}
