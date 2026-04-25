'use client';

import React from 'react';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useGameContext } from './GameContext';
import { CrosswordGrid } from './CrosswordGrid';
import { CluePanel } from './CluePanel';
import { LetterBank } from './LetterBank';
import type { WordSlotConfig } from './types';
import styles from './CrosswordArea.module.css';

interface CrosswordAreaProps {
  wordSlots: WordSlotConfig[];
  accentColor: string;
}

export function CrosswordArea({ wordSlots, accentColor }: CrosswordAreaProps) {
  const { dispatch, state } = useGameContext();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // active.id is "tile-X", over.id is "row-col"
    const letter = (active.data.current as { letter: string })?.letter;
    const cellKey = over.id as string;

    if (letter && cellKey) {
      const cell = state.cells[cellKey];
      if (cell && !cell.isBlocked) {
        dispatch({ type: 'PLACE_LETTER', cellKey, letter });
      }
    }
  };

  const clues = wordSlots.map((ws) => ({
    id: ws.id,
    clue: ws.clue,
    direction: ws.direction,
    answer: ws.answer,
  }));

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className={styles.area}>
        <div className={styles.gridWrapper}>
          <CrosswordGrid accentColor={accentColor} />
        </div>
        <div className={styles.clueWrapper}>
          <CluePanel clues={clues} accentColor={accentColor} />
        </div>
      </div>
      <LetterBank />
    </DndContext>
  );
}
