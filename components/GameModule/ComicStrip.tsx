'use client';

import React from 'react';
import { useGameContext } from './GameContext';
import { ComicPanel } from './ComicPanel';
import type { PanelConfig } from './types';
import styles from './ComicStrip.module.css';

interface ComicStripProps {
  panels: PanelConfig[];
}

export function ComicStrip({ panels }: ComicStripProps) {
  const { state } = useGameContext();
  const { panelStates } = state;

  const sortedPanels = [...panels].sort((a, b) => a.order - b.order);

  return (
    <div className={styles.strip} aria-label="Comic strip panels">
      {sortedPanels.map((panel) => (
        <ComicPanel
          key={panel.id}
          panel={panel}
          tier={panelStates[panel.id]?.tier ?? 0}
        />
      ))}
    </div>
  );
}
