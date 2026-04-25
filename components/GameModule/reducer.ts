import type { GameState, GameAction, WordSlotState, CellState } from './types';
import { initStateFromClueSet } from './initState';
import { computeTier } from './computeTier';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Recompute solvedLetterCount and isFullySolved for a single word slot. */
function recomputeWordSlot(
  ws: WordSlotState,
  cells: Record<string, CellState>
): WordSlotState {
  let solvedLetterCount = 0;
  for (const cellKey of ws.cells) {
    const cell = cells[cellKey];
    if (cell && cell.isCorrect) {
      solvedLetterCount++;
    }
  }
  const isFullySolved = solvedLetterCount === ws.cells.length;
  if (
    ws.solvedLetterCount === solvedLetterCount &&
    ws.isFullySolved === isFullySolved
  ) {
    return ws; // no change — return same reference
  }
  return { ...ws, solvedLetterCount, isFullySolved };
}

/**
 * After mutating cells, recompute all word slots that contain the given cell,
 * then recompute affected panel tiers and ink level.
 */
function recomputeAfterCellChange(
  state: GameState,
  changedCellKey: string
): GameState {
  const cells = state.cells;

  // Recompute word slots that contain the changed cell
  const affectedPanelIds = new Set<string>();
  const wordSlots = state.wordSlots.map((ws) => {
    if (!ws.cells.includes(changedCellKey)) return ws;
    affectedPanelIds.add(ws.panelId);
    return recomputeWordSlot(ws, cells);
  });

  // Recompute panel tiers for affected panels
  const panelStates = { ...state.panelStates };
  for (const panelId of affectedPanelIds) {
    const newTier = computeTier(panelId, wordSlots, cells);
    if (panelStates[panelId]?.tier !== newTier) {
      panelStates[panelId] = { panelId, tier: newTier };
    }
  }

  // Recompute ink level
  const totalSlots = wordSlots.length;
  const solvedSlots = wordSlots.filter((ws) => ws.isFullySolved).length;
  const inkLevel =
    totalSlots === 0 ? 0 : Math.round((solvedSlots / totalSlots) * 100);

  const publishEventFired =
    inkLevel >= 100
      ? true
      : inkLevel < 100
      ? false
      : state.publishEventFired;

  return {
    ...state,
    cells,
    wordSlots,
    panelStates,
    inkLevel,
    publishEventFired,
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT': {
      return initStateFromClueSet(action.clueSet);
    }

    case 'PLACE_LETTER': {
      const { cellKey, letter } = action;
      const cell = state.cells[cellKey];

      // Guard: blocked cell
      if (!cell || cell.isBlocked) return state;

      const upperLetter = letter.toUpperCase();
      const isCorrect = upperLetter === cell.correctLetter;

      const updatedCell: CellState = {
        ...cell,
        letter: upperLetter,
        isCorrect,
      };

      const newCells = { ...state.cells, [cellKey]: updatedCell };
      return recomputeAfterCellChange({ ...state, cells: newCells }, cellKey);
    }

    case 'REMOVE_LETTER': {
      const { cellKey } = action;
      const cell = state.cells[cellKey];

      // Guard: blocked cell or no letter
      if (!cell || cell.isBlocked || cell.letter === null) return state;

      const updatedCell: CellState = {
        ...cell,
        letter: null,
        isCorrect: false,
      };

      const newCells = { ...state.cells, [cellKey]: updatedCell };
      return recomputeAfterCellChange({ ...state, cells: newCells }, cellKey);
    }

    case 'SELECT_CELL': {
      const { cellKey } = action;
      // Find the first word slot containing this cell (prefer 'across' over 'down')
      const acrossSlot = state.wordSlots.find(
        (ws) => ws.direction === 'across' && ws.cells.includes(cellKey)
      );
      const selectedWordSlotId =
        acrossSlot?.id ??
        state.wordSlots.find((ws) => ws.cells.includes(cellKey))?.id ??
        null;

      return { ...state, selectedWordSlotId, selectedLetter: null };
    }

    case 'SELECT_WORD_SLOT': {
      return { ...state, selectedWordSlotId: action.wordSlotId };
    }

    case 'SELECT_LETTER': {
      return { ...state, selectedLetter: action.letter };
    }

    case 'RESET_GAME': {
      // Reset cells
      const cells: typeof state.cells = {};
      for (const [key, cell] of Object.entries(state.cells)) {
        cells[key] = cell.isBlocked
          ? cell
          : { ...cell, letter: null, isCorrect: false };
      }

      // Reset word slots
      const wordSlots = state.wordSlots.map((ws) => ({
        ...ws,
        solvedLetterCount: 0,
        isFullySolved: false,
      }));

      // Reset panel tiers
      const panelStates: typeof state.panelStates = {};
      for (const [id, ps] of Object.entries(state.panelStates)) {
        panelStates[id] = { ...ps, tier: 0 };
      }

      return {
        ...state,
        cells,
        wordSlots,
        panelStates,
        inkLevel: 0,
        publishEventFired: false,
        selectedWordSlotId: null,
        selectedLetter: null,
      };
    }

    default:
      return state;
  }
}
