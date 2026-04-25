/**
 * Property 11: ClueSet validation correctly classifies inputs
 * Validates: Requirements 12.1, 12.4
 *
 * For any ClueSet object: if it satisfies all validation rules (positive grid
 * dimensions, unique IDs, valid panelId references, in-bounds coordinates, no
 * conflicting cell overlaps), the module SHALL render the puzzle without error.
 * If it violates any validation rule, the module SHALL display an error message
 * and SHALL NOT render the grid.
 */

import * as fc from 'fast-check';
import { validateClueSet } from './validation';
import type { ClueSet, ValidationError } from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isValidationError(result: unknown): result is ValidationError {
  return (
    result !== null &&
    typeof result === 'object' &&
    (result as ValidationError).isValid === false &&
    Array.isArray((result as ValidationError).errors)
  );
}

function isClueSet(result: unknown): result is ClueSet {
  return (
    result !== null &&
    typeof result === 'object' &&
    !isValidationError(result)
  );
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Generates a valid uppercase answer string */
const answerArb = fc
  .stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), {
    minLength: 2,
    maxLength: 8,
  });

/** Generates a valid PanelConfig */
const panelArb = (id: string) =>
  fc.record({
    id: fc.constant(id),
    order: fc.nat(),
    sketchSrc: fc.string(),
    inkSrc: fc.string(),
    dialogueSrc: fc.string(),
    dialogues: fc.constant([]),
  });

/**
 * Generates a valid ClueSet with no conflicts.
 * Strategy: place word slots one at a time, tracking used cells.
 */
const validClueSetsArb: fc.Arbitrary<ClueSet> = fc
  .tuple(
    fc.integer({ min: 8, max: 20 }),  // gridWidth
    fc.integer({ min: 8, max: 20 }),  // gridHeight
    fc.integer({ min: 1, max: 3 }),   // number of panels
  )
  .chain(([gridWidth, gridHeight, panelCount]) => {
    const panelIds = Array.from({ length: panelCount }, (_, i) => `panel-${i}`);
    const panelsArb = fc.tuple(...panelIds.map(panelArb));

    // Build word slots that fit within bounds and don't conflict
    // Use a simple approach: generate across slots in distinct rows
    const wordSlotsArb = fc
      .tuple(
        ...Array.from({ length: panelCount }, (_, slotIdx) =>
          fc
            .tuple(
              answerArb,
              fc.integer({ min: 0, max: gridHeight - 1 }),
              fc.integer({ min: 0, max: Math.max(0, gridWidth - 2) }),
              fc.constantFrom(...panelIds),
            )
            .map(([answer, startRow, startCol, panelId]) => {
              // Clamp so answer fits
              const maxLen = gridWidth - startCol;
              const clampedAnswer = answer.slice(0, Math.max(2, maxLen));
              return {
                id: `slot-${slotIdx}`,
                answer: clampedAnswer,
                clue: `Clue for slot ${slotIdx}`,
                direction: 'across' as const,
                startRow,
                startCol,
                panelId,
              };
            })
        )
      )
      .filter((slots) => {
        // Ensure no cell conflicts (same cell, different letter)
        const cellMap = new Map<string, string>();
        for (const slot of slots) {
          for (let k = 0; k < slot.answer.length; k++) {
            const key = `${slot.startRow}-${slot.startCol + k}`;
            const letter = slot.answer[k];
            const existing = cellMap.get(key);
            if (existing && existing !== letter) return false;
            cellMap.set(key, letter);
          }
        }
        return true;
      });

    return fc.tuple(panelsArb, wordSlotsArb).map(([panelsTuple, slots]) => ({
      gridWidth,
      gridHeight,
      panels: panelsTuple as ClueSet['panels'],
      wordSlots: slots,
    }));
  });

// ─── Property 11 ─────────────────────────────────────────────────────────────

describe('Property 11: ClueSet validation correctly classifies inputs', () => {
  /**
   * **Validates: Requirements 12.1, 12.4**
   *
   * Valid ClueSet objects must pass validation (return the ClueSet, not a ValidationError).
   */
  it('accepts any valid ClueSet', () => {
    fc.assert(
      fc.property(validClueSetsArb, (clueSet) => {
        const result = validateClueSet(clueSet);
        expect(isValidationError(result)).toBe(false);
        expect(isClueSet(result)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 12.4**
   *
   * A ClueSet with non-positive gridWidth must fail validation.
   */
  it('rejects ClueSet with non-positive gridWidth', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 0 }),
        (badWidth) => {
          const clueSet = {
            gridWidth: badWidth,
            gridHeight: 10,
            panels: [{ id: 'p1', order: 0, sketchSrc: '', inkSrc: '', dialogueSrc: '', dialogues: [] }],
            wordSlots: [],
          };
          const result = validateClueSet(clueSet);
          expect(isValidationError(result)).toBe(true);
          if (isValidationError(result)) {
            expect(result.errors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 12.4**
   *
   * A ClueSet with non-positive gridHeight must fail validation.
   */
  it('rejects ClueSet with non-positive gridHeight', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 0 }),
        (badHeight) => {
          const clueSet = {
            gridWidth: 10,
            gridHeight: badHeight,
            panels: [{ id: 'p1', order: 0, sketchSrc: '', inkSrc: '', dialogueSrc: '', dialogues: [] }],
            wordSlots: [],
          };
          const result = validateClueSet(clueSet);
          expect(isValidationError(result)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 12.4**
   *
   * A ClueSet with duplicate WordSlotConfig ids must fail validation.
   */
  it('rejects ClueSet with duplicate word slot ids', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (dupId) => {
          const clueSet = {
            gridWidth: 10,
            gridHeight: 10,
            panels: [{ id: 'p1', order: 0, sketchSrc: '', inkSrc: '', dialogueSrc: '', dialogues: [] }],
            wordSlots: [
              { id: dupId, answer: 'HELLO', clue: 'c1', direction: 'across', startRow: 0, startCol: 0, panelId: 'p1' },
              { id: dupId, answer: 'WORLD', clue: 'c2', direction: 'across', startRow: 2, startCol: 0, panelId: 'p1' },
            ],
          };
          const result = validateClueSet(clueSet);
          expect(isValidationError(result)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 12.4**
   *
   * A ClueSet where a WordSlotConfig.panelId references a non-existent panel must fail.
   */
  it('rejects ClueSet with invalid panelId reference', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s !== 'p1'),
        (badPanelId) => {
          const clueSet = {
            gridWidth: 10,
            gridHeight: 10,
            panels: [{ id: 'p1', order: 0, sketchSrc: '', inkSrc: '', dialogueSrc: '', dialogues: [] }],
            wordSlots: [
              { id: 'slot-1', answer: 'HELLO', clue: 'c1', direction: 'across', startRow: 0, startCol: 0, panelId: badPanelId },
            ],
          };
          const result = validateClueSet(clueSet);
          expect(isValidationError(result)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 12.4**
   *
   * A ClueSet where a word slot extends beyond grid bounds must fail.
   */
  it('rejects ClueSet with out-of-bounds word slot', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 10 }),
        (gridWidth) => {
          // Place a 5-letter word starting at the last column — guaranteed out of bounds
          const clueSet = {
            gridWidth,
            gridHeight: 10,
            panels: [{ id: 'p1', order: 0, sketchSrc: '', inkSrc: '', dialogueSrc: '', dialogues: [] }],
            wordSlots: [
              {
                id: 'slot-1',
                answer: 'ABCDE',
                clue: 'c1',
                direction: 'across',
                startRow: 0,
                startCol: gridWidth - 1, // only 1 cell left, but answer is 5 letters
                panelId: 'p1',
              },
            ],
          };
          const result = validateClueSet(clueSet);
          expect(isValidationError(result)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 12.4**
   *
   * A ClueSet with conflicting letters at the same cell must fail.
   */
  it('rejects ClueSet with conflicting cell letters', () => {
    // across: HELLO at row 0, col 0  → cell (0,0)=H
    // down:   WORLD at row 0, col 0  → cell (0,0)=W  ← conflict
    const clueSet = {
      gridWidth: 10,
      gridHeight: 10,
      panels: [{ id: 'p1', order: 0, sketchSrc: '', inkSrc: '', dialogueSrc: '', dialogues: [] }],
      wordSlots: [
        { id: 'slot-1', answer: 'HELLO', clue: 'c1', direction: 'across', startRow: 0, startCol: 0, panelId: 'p1' },
        { id: 'slot-2', answer: 'WORLD', clue: 'c2', direction: 'down',   startRow: 0, startCol: 0, panelId: 'p1' },
      ],
    };
    const result = validateClueSet(clueSet);
    expect(isValidationError(result)).toBe(true);
  });

  /**
   * **Validates: Requirements 12.1**
   *
   * A valid crossword intersection (same letter at crossing cell) must pass.
   */
  it('accepts valid crossword intersections (same letter at crossing cell)', () => {
    // across: HELLO at row 2, col 0  → cell (2,0)=H
    // down:   HABIT at row 0, col 0  → cell (2,0)=H  ← valid intersection
    const clueSet: ClueSet = {
      gridWidth: 10,
      gridHeight: 10,
      panels: [{ id: 'p1', order: 0, sketchSrc: '', inkSrc: '', dialogueSrc: '', dialogues: [] }],
      wordSlots: [
        { id: 'slot-1', answer: 'HELLO', clue: 'c1', direction: 'across', startRow: 2, startCol: 0, panelId: 'p1' },
        { id: 'slot-2', answer: 'HABIT', clue: 'c2', direction: 'down',   startRow: 0, startCol: 0, panelId: 'p1' },
      ],
    };
    const result = validateClueSet(clueSet);
    expect(isValidationError(result)).toBe(false);
  });

  /**
   * **Validates: Requirements 12.4**
   *
   * Non-object inputs must always fail validation.
   */
  it('rejects non-object inputs', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null), fc.constant(undefined)),
        (badInput) => {
          const result = validateClueSet(badInput);
          expect(isValidationError(result)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
