import type { ClueSet, ValidationError } from './types';

/**
 * Validates a ClueSet input against all five rules:
 * 1. gridWidth and gridHeight are positive integers
 * 2. Every WordSlotConfig has a unique id
 * 3. Every WordSlotConfig.panelId references an existing PanelConfig.id
 * 4. No two word slots require conflicting letters in the same cell
 * 5. All startRow/startCol + answer length values fit within grid bounds
 *
 * Returns the typed ClueSet on success, or a ValidationError on failure.
 */
export function validateClueSet(clueSet: unknown): ClueSet | ValidationError {
  const errors: string[] = [];

  if (clueSet === null || typeof clueSet !== 'object') {
    return { isValid: false, errors: ['ClueSet must be a non-null object.'] };
  }

  const cs = clueSet as Record<string, unknown>;

  // Rule 1: gridWidth and gridHeight are positive integers
  if (!Number.isInteger(cs.gridWidth) || (cs.gridWidth as number) <= 0) {
    errors.push(`gridWidth must be a positive integer, got: ${JSON.stringify(cs.gridWidth)}`);
  }
  if (!Number.isInteger(cs.gridHeight) || (cs.gridHeight as number) <= 0) {
    errors.push(`gridHeight must be a positive integer, got: ${JSON.stringify(cs.gridHeight)}`);
  }

  // Validate panels array
  if (!Array.isArray(cs.panels)) {
    errors.push('panels must be an array.');
  }

  // Validate wordSlots array
  if (!Array.isArray(cs.wordSlots)) {
    errors.push('wordSlots must be an array.');
  }

  // If structural errors exist, return early — further checks would throw
  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const gridWidth = cs.gridWidth as number;
  const gridHeight = cs.gridHeight as number;
  const panels = cs.panels as unknown[];
  const wordSlots = cs.wordSlots as unknown[];

  // Build panel id set
  const panelIds = new Set<string>();
  for (let i = 0; i < panels.length; i++) {
    const panel = panels[i];
    if (panel === null || typeof panel !== 'object') {
      errors.push(`panels[${i}] must be an object.`);
      continue;
    }
    const p = panel as Record<string, unknown>;
    if (typeof p.id !== 'string' || p.id.trim() === '') {
      errors.push(`panels[${i}].id must be a non-empty string.`);
    } else {
      panelIds.add(p.id);
    }
  }

  // Rule 2: Every WordSlotConfig has a unique id
  const wordSlotIds = new Set<string>();
  // Rule 3 + 4 + 5 checked per slot
  // Map from "row-col" → expected letter (for conflict detection)
  const cellLetterMap = new Map<string, { letter: string; slotId: string }>();

  for (let i = 0; i < wordSlots.length; i++) {
    const slot = wordSlots[i];
    if (slot === null || typeof slot !== 'object') {
      errors.push(`wordSlots[${i}] must be an object.`);
      continue;
    }
    const s = slot as Record<string, unknown>;

    // id uniqueness
    if (typeof s.id !== 'string' || s.id.trim() === '') {
      errors.push(`wordSlots[${i}].id must be a non-empty string.`);
    } else if (wordSlotIds.has(s.id)) {
      errors.push(`Duplicate WordSlotConfig id: "${s.id}".`);
    } else {
      wordSlotIds.add(s.id);
    }

    // answer must be a non-empty string
    if (typeof s.answer !== 'string' || s.answer.trim() === '') {
      errors.push(`wordSlots[${i}].answer must be a non-empty string.`);
      continue; // can't do bounds/conflict checks without a valid answer
    }

    const answer = s.answer as string;
    const direction = s.direction as string;
    const startRow = s.startRow as number;
    const startCol = s.startCol as number;
    const slotId = typeof s.id === 'string' ? s.id : `[${i}]`;

    // direction
    if (direction !== 'across' && direction !== 'down') {
      errors.push(`wordSlots[${i}].direction must be "across" or "down".`);
    }

    // startRow / startCol must be non-negative integers
    if (!Number.isInteger(startRow) || startRow < 0) {
      errors.push(`wordSlots[${i}].startRow must be a non-negative integer.`);
    }
    if (!Number.isInteger(startCol) || startCol < 0) {
      errors.push(`wordSlots[${i}].startCol must be a non-negative integer.`);
    }

    // Rule 3: panelId references an existing panel
    if (typeof s.panelId !== 'string') {
      errors.push(`wordSlots[${i}].panelId must be a string.`);
    } else if (!panelIds.has(s.panelId)) {
      errors.push(`wordSlots[${i}].panelId "${s.panelId}" does not reference any PanelConfig.id.`);
    }

    // Rule 5: bounds check
    if (
      Number.isInteger(startRow) && startRow >= 0 &&
      Number.isInteger(startCol) && startCol >= 0 &&
      (direction === 'across' || direction === 'down')
    ) {
      if (direction === 'across') {
        const endCol = startCol + answer.length - 1;
        if (startRow >= gridHeight) {
          errors.push(`wordSlots[${i}] ("${slotId}"): startRow ${startRow} is out of grid bounds (height=${gridHeight}).`);
        }
        if (endCol >= gridWidth) {
          errors.push(`wordSlots[${i}] ("${slotId}"): answer extends to col ${endCol}, which exceeds gridWidth ${gridWidth}.`);
        }
      } else {
        const endRow = startRow + answer.length - 1;
        if (startCol >= gridWidth) {
          errors.push(`wordSlots[${i}] ("${slotId}"): startCol ${startCol} is out of grid bounds (width=${gridWidth}).`);
        }
        if (endRow >= gridHeight) {
          errors.push(`wordSlots[${i}] ("${slotId}"): answer extends to row ${endRow}, which exceeds gridHeight ${gridHeight}.`);
        }
      }
    }

    // Rule 4: no conflicting letters in the same cell
    if (
      Number.isInteger(startRow) && startRow >= 0 &&
      Number.isInteger(startCol) && startCol >= 0 &&
      (direction === 'across' || direction === 'down')
    ) {
      for (let k = 0; k < answer.length; k++) {
        const row = direction === 'across' ? startRow : startRow + k;
        const col = direction === 'across' ? startCol + k : startCol;
        const cellKey = `${row}-${col}`;
        const letter = answer[k].toUpperCase();
        const existing = cellLetterMap.get(cellKey);
        if (existing) {
          if (existing.letter !== letter) {
            errors.push(
              `Cell conflict at (${row}, ${col}): slot "${slotId}" requires "${letter}" but slot "${existing.slotId}" requires "${existing.letter}".`
            );
          }
          // Same letter at intersection is fine (valid crossword crossing)
        } else {
          cellLetterMap.set(cellKey, { letter, slotId });
        }
      }
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return clueSet as ClueSet;
}
