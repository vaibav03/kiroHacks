'use client';

import React from 'react';
import { useGameContext } from './GameContext';
import styles from './InkLevelBar.module.css';

interface InkLevelBarProps {
  accentColor: string;
}

export function InkLevelBar({ accentColor }: InkLevelBarProps) {
  const { state } = useGameContext();
  const { inkLevel } = state;

  return (
    <div className={styles.container} aria-label={`Ink level: ${inkLevel}%`}>
      <span className={styles.label}>INK LEVEL</span>
      <div className={styles.track} role="progressbar" aria-valuenow={inkLevel} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={styles.fill}
          style={{ width: `${inkLevel}%`, backgroundColor: accentColor }}
        />
      </div>
      <span className={styles.completion}>
        {inkLevel >= 100 ? '🎉 PUBLISHED!' : 'LEVEL TO FULL!'}
      </span>
    </div>
  );
}
