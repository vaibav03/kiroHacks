'use client';

import React from 'react';
import { useGameContext } from './GameContext';
import { LetterTile } from './LetterTile';
import styles from './LetterBank.module.css';

const QWERTY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export function LetterBank() {
  const { state, dispatch } = useGameContext();
  const { selectedLetter, selectedWordSlotId, wordSlots, cells } = state;

  const handleTileClick = (letter: string) => {
    // If a word slot is selected, find the first empty cell and place the letter
    if (selectedWordSlotId) {
      const slot = wordSlots.find((ws) => ws.id === selectedWordSlotId);
      if (slot) {
        const firstEmpty = slot.cells.find((ck) => !cells[ck]?.letter);
        if (firstEmpty) {
          dispatch({ type: 'PLACE_LETTER', cellKey: firstEmpty, letter });
          return;
        }
      }
    }
    // Otherwise enter click-to-select mode
    dispatch({ type: 'SELECT_LETTER', letter: selectedLetter === letter ? '' : letter });
  };

  return (
    <div
      role="toolbar"
      aria-label="Letter bank"
      className={styles.bank}
    >
      <p className={styles.hint}>
        Drag a letter to a cell, or click a letter then click a cell
      </p>
      {QWERTY_ROWS.map((row, ri) => (
        <div key={ri} className={styles.row}>
          {row.map((letter) => (
            <LetterTile
              key={letter}
              letter={letter}
              isSelected={selectedLetter === letter}
              onClick={() => handleTileClick(letter)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
