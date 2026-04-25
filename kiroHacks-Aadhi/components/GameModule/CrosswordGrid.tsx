'use client';

import React, { useCallback } from 'react';
import { useGameContext } from './GameContext';
import { GridCell } from './GridCell';
import styles from './CrosswordGrid.module.css';

interface CrosswordGridProps {
  accentColor: string;
}

export function CrosswordGrid({ accentColor }: CrosswordGridProps) {
  const { state, dispatch } = useGameContext();
  const { cells, wordSlots, selectedWordSlotId } = state;

  // Determine grid dimensions from cell keys
  const rows = Math.max(...Object.values(cells).map((c) => c.row)) + 1;
  const cols = Math.max(...Object.values(cells).map((c) => c.col)) + 1;

  // Build set of cells in the selected word slot
  const selectedSlotCells = new Set<string>(
    selectedWordSlotId
      ? wordSlots.find((ws) => ws.id === selectedWordSlotId)?.cells ?? []
      : []
  );

  // Build set of word-start cells (Action Star markers)
  const wordStartCells = new Set<string>(
    wordSlots.map((ws) => ws.cells[0])
  );

  const handleCellClick = useCallback(
    (cellKey: string) => {
      const cell = cells[cellKey];
      if (!cell || cell.isBlocked) return;

      // If clicking a cell already in the selected slot, toggle direction
      if (selectedSlotCells.has(cellKey) && selectedWordSlotId) {
        const currentSlot = wordSlots.find((ws) => ws.id === selectedWordSlotId);
        if (currentSlot) {
          const otherDir = currentSlot.direction === 'across' ? 'down' : 'across';
          const altSlot = wordSlots.find(
            (ws) => ws.direction === otherDir && ws.cells.includes(cellKey)
          );
          if (altSlot) {
            dispatch({ type: 'SELECT_WORD_SLOT', wordSlotId: altSlot.id });
            return;
          }
        }
      }

      dispatch({ type: 'SELECT_CELL', cellKey });

      // If a letter is selected in click mode, place it
      if (state.selectedLetter) {
        dispatch({ type: 'PLACE_LETTER', cellKey, letter: state.selectedLetter });
        dispatch({ type: 'SELECT_LETTER', letter: '' });
      }
    },
    [cells, dispatch, selectedSlotCells, selectedWordSlotId, state.selectedLetter, wordSlots]
  );

  // Keyboard handler: when a cell is focused, typing a letter places it
  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const cellKey = target.getAttribute('data-cellkey');
      if (!cellKey) return;

      if (e.key === 'Backspace' || e.key === 'Delete') {
        dispatch({ type: 'REMOVE_LETTER', cellKey });
        return;
      }

      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        dispatch({ type: 'PLACE_LETTER', cellKey, letter: e.key.toUpperCase() });
        // Advance focus to next empty cell in selected slot
        if (selectedWordSlotId) {
          const slot = wordSlots.find((ws) => ws.id === selectedWordSlotId);
          if (slot) {
            const currentIdx = slot.cells.indexOf(cellKey);
            const nextCell = slot.cells.slice(currentIdx + 1).find((ck) => !cells[ck]?.letter);
            if (nextCell) {
              const el = document.querySelector(`[data-cellkey="${nextCell}"]`) as HTMLElement;
              el?.focus();
            }
          }
        }
      }
    },
    [cells, dispatch, selectedWordSlotId, wordSlots]
  );

  return (
    <div
      role="grid"
      aria-label="Crossword puzzle grid"
      className={styles.grid}
      onKeyDown={handleGridKeyDown}
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => {
          const key = `${row}-${col}`;
          const cell = cells[key];
          if (!cell) return null;
          return (
            <GridCell
              key={key}
              cellKey={key}
              letter={cell.letter}
              isBlocked={cell.isBlocked}
              isCorrect={cell.isCorrect}
              isWordStart={wordStartCells.has(key)}
              isSelected={selectedSlotCells.has(key) && key === (wordSlots.find(ws => ws.id === selectedWordSlotId)?.cells[0] ?? '')}
              isInSelectedSlot={selectedSlotCells.has(key)}
              accentColor={accentColor}
              onClick={() => handleCellClick(key)}
            />

          );
        })
      )}
    </div>
  );
}
