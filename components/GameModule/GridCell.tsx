'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import styles from './GridCell.module.css';

interface GridCellProps {
  cellKey: string;
  letter: string | null;
  isBlocked: boolean;
  isCorrect: boolean;
  isWordStart: boolean;
  isSelected: boolean;
  isInSelectedSlot: boolean;
  accentColor: string;
  onClick: () => void;
}

export function GridCell({
  cellKey,
  letter,
  isBlocked,
  isCorrect,
  isWordStart,
  isSelected,
  isInSelectedSlot,
  accentColor,
  onClick,
}: GridCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: cellKey, disabled: isBlocked });

  if (isBlocked) {
    return <div className={styles.blocked} aria-hidden="true" />;
  }

  const cellStyle: React.CSSProperties = isSelected
    ? { borderColor: accentColor, backgroundColor: `${accentColor}33` }
    : isInSelectedSlot
    ? { borderColor: accentColor, backgroundColor: `${accentColor}18` }
    : isOver
    ? { backgroundColor: '#ffffff30' }
    : {};

  return (
    <div
      ref={setNodeRef}
      role="gridcell"
      data-cellkey={cellKey}
      aria-label={`Cell ${cellKey}${letter ? `, letter ${letter}` : ', empty'}`}
      className={[
        styles.cell,
        isCorrect ? styles.correct : '',
        isOver ? styles.dragOver : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={cellStyle}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
    >
      {isWordStart && (
        /* Action Star marker instead of a number */
        <span className={styles.starMarker} aria-hidden="true">✦</span>
      )}
      {letter && <span className={styles.letter}>{letter}</span>}
    </div>
  );
}
