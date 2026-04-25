import type { TierLevel, WordSlotState, CellState } from './types';

/**
 * Pure function that computes the tier level for a given panel.
 *
 * Tier logic:
 * - Tier 0: no word slot mapped to this panel has any correct letter
 * - Tier 1: at least one word slot mapped to this panel has ≥1 correct letter, but none are fully solved
 * - Tier 2: at least one word slot mapped to this panel is fully solved
 * - Tier 3: ALL word slots mapped to this panel are fully solved
 */
export function computeTier(
  panelId: string,
  wordSlots: WordSlotState[],
  cells: Record<string, CellState>
): TierLevel {
  const panelSlots = wordSlots.filter((ws) => ws.panelId === panelId);

  // No word slots mapped to this panel — stay at tier 0
  if (panelSlots.length === 0) {
    return 0;
  }

  // Check if ALL slots are fully solved → Tier 3
  const allFullySolved = panelSlots.every((ws) => ws.isFullySolved);
  if (allFullySolved) {
    return 3;
  }

  // Check if at least one slot is fully solved → Tier 2
  const anyFullySolved = panelSlots.some((ws) => ws.isFullySolved);
  if (anyFullySolved) {
    return 2;
  }

  // Check if at least one slot has ≥1 correct letter → Tier 1
  const anyHasCorrectLetter = panelSlots.some((ws) => {
    return ws.cells.some((cellKey) => {
      const cell = cells[cellKey];
      return cell !== undefined && cell.isCorrect;
    });
  });

  return anyHasCorrectLetter ? 1 : 0;
}
