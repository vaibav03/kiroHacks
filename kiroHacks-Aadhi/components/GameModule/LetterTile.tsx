'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import styles from './LetterTile.module.css';

interface LetterTileProps {
  letter: string;
  isSelected: boolean;
  onClick: () => void;
}

export function LetterTile({ letter, isSelected, onClick }: LetterTileProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `tile-${letter}`,
    data: { letter },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={[
        styles.tile,
        isSelected ? styles.selected : '',
        isDragging ? styles.dragging : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      aria-label={`Letter ${letter}`}
      aria-pressed={isSelected}
      type="button"
    >
      {letter}
    </button>
  );
}
