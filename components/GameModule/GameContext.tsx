'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type { GameState, GameAction, ClueSet } from './types';
import { gameReducer } from './reducer';
import { initStateFromClueSet } from './initState';

// ── Context ───────────────────────────────────────────────────────────────────

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGameContext(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGameContext must be used inside <GameProvider>');
  }
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface GameProviderProps {
  clueSet: ClueSet;
  onWordSolved?: (wordSlotId: string) => void;
  children: ReactNode;
}

export function GameProvider({ clueSet, onWordSolved, children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, clueSet, initStateFromClueSet);

  // Re-initialise when clueSet reference changes (e.g. "New game" with different puzzle)
  const prevClueSetRef = useRef(clueSet);
  useEffect(() => {
    if (prevClueSetRef.current !== clueSet) {
      prevClueSetRef.current = clueSet;
      dispatch({ type: 'INIT', clueSet });
    }
  }, [clueSet]);

  // Fire onWordSolved callback when a word slot transitions to Tier 2 (fully solved)
  const prevWordSlotsRef = useRef(state.wordSlots);
  useEffect(() => {
    if (!onWordSolved) return;
    const prev = prevWordSlotsRef.current;
    const curr = state.wordSlots;

    for (const currSlot of curr) {
      const prevSlot = prev.find((s) => s.id === currSlot.id);
      // Transition to isFullySolved (Tier 2+) that wasn't there before
      if (currSlot.isFullySolved && prevSlot && !prevSlot.isFullySolved) {
        onWordSolved(currSlot.id);
      }
    }

    prevWordSlotsRef.current = curr;
  }, [state.wordSlots, onWordSolved]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}
