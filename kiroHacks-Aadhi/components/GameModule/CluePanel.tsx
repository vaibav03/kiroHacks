'use client';

import React from 'react';
import { useGameContext } from './GameContext';
import styles from './CluePanel.module.css';

interface CluePanelProps {
  clues: Array<{ id: string; clue: string; direction: 'across' | 'down'; answer: string }>;
  accentColor: string;
}

export function CluePanel({ clues, accentColor }: CluePanelProps) {
  const { state, dispatch } = useGameContext();
  const { selectedWordSlotId, wordSlots } = state;

  const acrossClues = clues.filter((c) => c.direction === 'across');
  const downClues = clues.filter((c) => c.direction === 'down');

  const handleClueClick = (id: string) => {
    dispatch({ type: 'SELECT_WORD_SLOT', wordSlotId: id });
  };

  const isSolved = (id: string) =>
    wordSlots.find((ws) => ws.id === id)?.isFullySolved ?? false;

  const renderClue = (c: typeof clues[0], index: number) => {
    const active = selectedWordSlotId === c.id;
    const solved = isSolved(c.id);
    return (
      <li
        key={c.id}
        className={[
          styles.clueItem,
          active ? styles.active : '',
          solved ? styles.solved : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={active ? { borderLeftColor: accentColor } : {}}
        onClick={() => handleClueClick(c.id)}
        role="button"
        tabIndex={0}
        aria-pressed={active}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleClueClick(c.id);
        }}
      >
        <span className={styles.clueNum}>{index + 1}.</span>
        <span className={styles.clueText}>{c.clue}</span>
        {solved && <span className={styles.checkmark}>✓</span>}
      </li>
    );
  };

  return (
    <div className={styles.panel} aria-label="Crossword clues">
      <div className={styles.section}>
        <h3 className={styles.heading}>
          <span className={styles.inkDrop}>🖋</span> Across
          <span className={styles.subLabel}>(Ink Reveal)</span>
        </h3>
        <ol className={styles.clueList}>
          {acrossClues.map((c, i) => renderClue(c, i))}
        </ol>
      </div>
      <div className={styles.section}>
        <h3 className={styles.heading}>
          <span className={styles.inkDrop}>🖋</span> Down
        </h3>
        <ol className={styles.clueList}>
          {downClues.map((c, i) => renderClue(c, i))}
        </ol>
      </div>
    </div>
  );
}
