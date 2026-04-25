'use client';

import React from 'react';
import { useGameContext } from './GameContext';
import styles from './SectionHeader.module.css';

interface SectionHeaderProps {
  lessonTitle: string;
  pdfFilename: string;
  accentColor: string;
}

export function SectionHeader({ lessonTitle, pdfFilename, accentColor }: SectionHeaderProps) {
  const { dispatch } = useGameContext();

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <h2 className={styles.title}>{lessonTitle}</h2>
        {pdfFilename && (
          <span className={styles.fileChip} aria-label={`Lesson file: ${pdfFilename}`}>
            📄 {pdfFilename}
          </span>
        )}
      </div>
      <button
        className={styles.newGameBtn}
        style={{ backgroundColor: accentColor, borderColor: accentColor }}
        onClick={() => dispatch({ type: 'RESET_GAME' })}
        aria-label="Start a new game — resets all progress"
        type="button"
      >
        ↺ New game
      </button>
    </div>
  );
}
