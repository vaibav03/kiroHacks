'use client';

import React, { useState } from 'react';
import type { PanelConfig, TierLevel } from './types';
import styles from './ComicPanel.module.css';

interface ComicPanelProps {
  panel: PanelConfig;
  tier: TierLevel;
}

// Fallback background colors per tier when images fail to load
const FALLBACK_BG: Record<TierLevel, string> = {
  0: '#111111',
  1: '#2a2a2a',
  2: '#1a1a2e',
  3: '#0d0d1a',
};

export function ComicPanel({ panel, tier }: ComicPanelProps) {
  const [imgError, setImgError] = useState(false);

  const src =
    tier === 0 ? null :
    tier === 1 ? panel.sketchSrc :
    tier === 2 ? panel.inkSrc :
    panel.dialogueSrc;

  return (
    <div
      className={[
        styles.panel,
        tier >= 1 ? styles.sketch : '',
        tier >= 2 ? styles.inked : '',
        tier >= 3 ? styles.dialogue : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={(!src || imgError) ? { backgroundColor: FALLBACK_BG[tier] } : {}}
      aria-label={`Comic panel ${panel.order + 1}, tier ${tier}`}
    >
      {/* Empty / locked state */}
      {tier === 0 && (
        <div className={styles.locked}>
          <span className={styles.lockIcon}>🔒</span>
          <span className={styles.lockLabel}>Solve a clue to reveal</span>
        </div>
      )}

      {/* Image layer */}
      {src && !imgError && (
        <img
          src={src}
          alt={`Panel ${panel.order + 1} — tier ${tier}`}
          className={styles.image}
          onError={() => setImgError(true)}
        />
      )}

      {/* Dialogue bubbles (Tier 3 only) */}
      {tier === 3 &&
        panel.dialogues.map((bubble, i) => (
          <div
            key={i}
            className={[
              styles.bubble,
              styles[bubble.type],
            ].join(' ')}
            style={{ top: bubble.position.top, left: bubble.position.left }}
          >
            {bubble.text}
          </div>
        ))}
    </div>
  );
}
