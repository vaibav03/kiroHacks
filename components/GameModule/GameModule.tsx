'use client';

import React, { useReducer, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './GameModule.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SlotConfig {
  id: string;
  ans: string;
  clue: string;
  dir: 'a' | 'd';
  row: number;
  col: number;
  pid: string;
}

export interface PanelConfig {
  id: string;
  label: string;
  imageSrc: string;
  badgeText: string;
  unlockPct: number;
}

export interface GameModuleProps {
  lessonTitle: string;
  pdfFilename: string;
  isUnlocked: boolean;
  slots: SlotConfig[];
  panels: PanelConfig[];
  gridWidth: number;
  gridHeight: number;
  studentName?: string;
  onWordSolved?: (slotId: string) => void; // avatar integration hook
}

interface CellState {
  r: number; c: number;
  blk: boolean;
  ltr: string | null;
  ok: boolean;
  correct: string | null;
}

interface SlotState { solved: boolean; count: number; }

interface GameState {
  cells: Record<string, CellState>;
  slotStates: Record<string, SlotState>;
  ink: number;
  selSlot: string | null;
  cursor: string | null;
  selLetter: string | null;
  unlockedPanels: Set<string>;
  published: boolean;
}

type Action =
  | { type: 'INIT' }
  | { type: 'PLACE'; key: string; letter: string }
  | { type: 'ERASE'; key: string }
  | { type: 'SELECT_CELL'; key: string; newSlot: string | null }
  | { type: 'SELECT_SLOT'; id: string }
  | { type: 'SELECT_LETTER'; letter: string | null }
  | { type: 'ADVANCE_CURSOR'; key: string }
  | { type: 'RESET' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSlotCells(slot: SlotConfig): string[] {
  return Array.from({ length: slot.ans.length }, (_, k) => {
    const r = slot.dir === 'a' ? slot.row : slot.row + k;
    const c = slot.dir === 'a' ? slot.col + k : slot.col;
    return `${r}-${c}`;
  });
}

function buildInitialState(
  slots: SlotConfig[],
  gw: number,
  gh: number
): Pick<GameState, 'cells' | 'slotStates' | 'ink' | 'unlockedPanels' | 'published'> {
  const active: Record<string, string> = {};
  for (const s of slots) {
    for (let k = 0; k < s.ans.length; k++) {
      const r = s.dir === 'a' ? s.row : s.row + k;
      const c = s.dir === 'a' ? s.col + k : s.col;
      const key = `${r}-${c}`;
      if (!active[key]) active[key] = s.ans[k];
    }
  }
  const cells: Record<string, CellState> = {};
  for (let r = 0; r < gh; r++) {
    for (let c = 0; c < gw; c++) {
      const key = `${r}-${c}`;
      cells[key] = { r, c, blk: !active[key], ltr: null, ok: false, correct: active[key] ?? null };
    }
  }
  const slotStates: Record<string, SlotState> = {};
  for (const s of slots) slotStates[s.id] = { solved: false, count: 0 };
  return { cells, slotStates, ink: 0, unlockedPanels: new Set(), published: false };
}

function recompute(
  cells: Record<string, CellState>,
  slotStates: Record<string, SlotState>,
  changedKey: string,
  slots: SlotConfig[]
): { slotStates: Record<string, SlotState>; ink: number; published: boolean } {
  const next = { ...slotStates };
  for (const s of slots) {
    const sc = getSlotCells(s);
    if (!sc.includes(changedKey)) continue;
    const cnt = sc.filter(ck => cells[ck]?.ok).length;
    next[s.id] = { solved: cnt === s.ans.length, count: cnt };
  }
  const total = slots.length;
  const solved = slots.filter(s => next[s.id]?.solved).length;
  const ink = total === 0 ? 0 : Math.round((solved / total) * 100);
  return { slotStates: next, ink, published: ink >= 100 };
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function makeReducer(slots: SlotConfig[], gw: number, gh: number) {
  return function reducer(state: GameState, action: Action): GameState {
    switch (action.type) {
      case 'INIT':
      case 'RESET': {
        const base = buildInitialState(slots, gw, gh);
        return { ...base, selSlot: null, cursor: null, selLetter: null };
      }
      case 'PLACE': {
        const cell = state.cells[action.key];
        if (!cell || cell.blk) return state;
        const updated = { ...cell, ltr: action.letter.toUpperCase(), ok: action.letter.toUpperCase() === cell.correct };
        const cells = { ...state.cells, [action.key]: updated };
        const { slotStates, ink, published } = recompute(cells, state.slotStates, action.key, slots);
        const unlockedPanels = new Set(state.unlockedPanels);
        return { ...state, cells, slotStates, ink, published };
      }
      case 'ERASE': {
        const cell = state.cells[action.key];
        if (!cell || cell.blk || !cell.ltr) return state;
        const updated = { ...cell, ltr: null, ok: false };
        const cells = { ...state.cells, [action.key]: updated };
        const { slotStates, ink, published } = recompute(cells, state.slotStates, action.key, slots);
        return { ...state, cells, slotStates, ink, published };
      }
      case 'SELECT_CELL':
        return { ...state, cursor: action.key, selSlot: action.newSlot, selLetter: null };
      case 'SELECT_SLOT':
        return { ...state, selSlot: action.id };
      case 'SELECT_LETTER':
        return { ...state, selLetter: action.letter };
      case 'ADVANCE_CURSOR':
        return { ...state, cursor: action.key };
      default:
        return state;
    }
  };
}

// ── QWERTY layout ─────────────────────────────────────────────────────────────

const QWERTY = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
];

// ── Component ─────────────────────────────────────────────────────────────────

export function GameModule({
  lessonTitle,
  pdfFilename,
  isUnlocked,
  slots,
  panels,
  gridWidth,
  gridHeight,
  studentName = 'Student',
  onWordSolved,
}: GameModuleProps) {
  const reducer = useCallback(makeReducer(slots, gridWidth, gridHeight), [slots, gridWidth, gridHeight]);
  const [state, dispatch] = useReducer(reducer, null, () => ({
    ...buildInitialState(slots, gridWidth, gridHeight),
    selSlot: null, cursor: null, selLetter: null,
  }));

  const unlockedRef = useRef<Set<string>>(new Set());
  const prevSolvedRef = useRef<Set<string>>(new Set());

  // Fire onWordSolved callback
  useEffect(() => {
    if (!onWordSolved) return;
    for (const s of slots) {
      if (state.slotStates[s.id]?.solved && !prevSolvedRef.current.has(s.id)) {
        onWordSolved(s.id);
      }
    }
    prevSolvedRef.current = new Set(slots.filter(s => state.slotStates[s.id]?.solved).map(s => s.id));
  }, [state.slotStates, onWordSolved, slots]);

  // Panel unlock tracking (permanent — never re-lock)
  const panelUnlockTimers = useRef<Record<string, boolean>>({});
  for (const p of panels) {
    if (state.ink >= p.unlockPct && !unlockedRef.current.has(p.id)) {
      unlockedRef.current.add(p.id);
    }
  }

  // Helpers
  const slotCellsMap = useCallback((id: string) => {
    const s = slots.find(x => x.id === id);
    return s ? getSlotCells(s) : [];
  }, [slots]);

  const wordStartSet = new Set(slots.map(s => `${s.row}-${s.col}`));
  const activeSlotCells = new Set(state.selSlot ? slotCellsMap(state.selSlot) : []);

  // Cell click
  const handleCellClick = (key: string) => {
    const cell = state.cells[key];
    if (!cell || cell.blk) return;

    if (state.selLetter) {
      const sc = state.selSlot ? slotCellsMap(state.selSlot) : [];
      const idx = sc.indexOf(key);
      const nextCursor = sc[idx + 1] ?? key;
      dispatch({ type: 'PLACE', key, letter: state.selLetter });
      dispatch({ type: 'ADVANCE_CURSOR', key: nextCursor });
      dispatch({ type: 'SELECT_LETTER', letter: null });
      return;
    }

    const aSlot = slots.find(s => s.dir === 'a' && getSlotCells(s).includes(key));
    const dSlot = slots.find(s => s.dir === 'd' && getSlotCells(s).includes(key));
    let newSlot = state.selSlot;

    if (state.selSlot && slotCellsMap(state.selSlot).includes(key)) {
      const cur = slots.find(s => s.id === state.selSlot);
      if (cur?.dir === 'a' && dSlot) newSlot = dSlot.id;
      else if (cur?.dir === 'd' && aSlot) newSlot = aSlot.id;
    } else {
      newSlot = (aSlot || dSlot)?.id ?? null;
    }
    dispatch({ type: 'SELECT_CELL', key, newSlot });
  };

  // Key handler
  const handleKeyDown = (e: React.KeyboardEvent, key: string) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      const sc = state.selSlot ? slotCellsMap(state.selSlot) : [];
      const idx = sc.indexOf(key);
      if (idx > 0) dispatch({ type: 'ADVANCE_CURSOR', key: sc[idx - 1] });
      dispatch({ type: 'ERASE', key });
      return;
    }
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      e.preventDefault();
      const sc = state.selSlot ? slotCellsMap(state.selSlot) : [];
      const idx = sc.indexOf(key);
      const next = sc[idx + 1] ?? key;
      dispatch({ type: 'PLACE', key, letter: e.key.toUpperCase() });
      dispatch({ type: 'ADVANCE_CURSOR', key: next });
    }
  };

  // Tile click
  const handleTileClick = (letter: string) => {
    if (state.cursor && state.cells[state.cursor] && !state.cells[state.cursor].blk) {
      const sc = state.selSlot ? slotCellsMap(state.selSlot) : [];
      const idx = sc.indexOf(state.cursor);
      const next = sc[idx + 1] ?? state.cursor;
      dispatch({ type: 'PLACE', key: state.cursor, letter });
      dispatch({ type: 'ADVANCE_CURSOR', key: next });
      dispatch({ type: 'SELECT_LETTER', letter: null });
    } else {
      dispatch({ type: 'SELECT_LETTER', letter: state.selLetter === letter ? null : letter });
    }
  };

  const resetGame = () => {
    unlockedRef.current.clear();
    prevSolvedRef.current.clear();
    panelUnlockTimers.current = {};
    dispatch({ type: 'RESET' });
  };

  const acrossSlots = slots.filter(s => s.dir === 'a');
  const downSlots = slots.filter(s => s.dir === 'd');

  return (
    <section id="game" className={styles.root} aria-label="HistorAI Game Module">
      {/* Header */}
      <header className={styles.hdr}>
        <div>
          <span className={styles.hdrTitle}>⚔️ {lessonTitle.toUpperCase()}</span>
          <span className={styles.hdrChip}>📄 {pdfFilename}</span>
        </div>
        <button className={styles.hdrBtn} onClick={resetGame} type="button">↺ NEW GAME</button>
      </header>

      {/* Main grid */}
      <div className={styles.body}>

        {/* Left: Badge panels */}
        <div className={styles.panels}>
          {panels.map(p => {
            const unlocked = unlockedRef.current.has(p.id);
            return (
              <div
                key={p.id}
                className={`${styles.panel} ${unlocked ? styles.unlocked : styles.locked}`}
              >
                <div className={styles.panelArt}>
                  <Image
                    src={p.imageSrc}
                    alt={p.label}
                    fill
                    style={{ objectFit: 'cover', zIndex: 1,
                      filter: unlocked ? 'none' : 'blur(8px) brightness(0.22) saturate(0)',
                      transition: 'filter 0.7s ease' }}
                  />
                  {!unlocked && (
                    <div className={styles.panelOverlay}>
                      <span className={styles.lockIco}>🔒</span>
                      <span className={styles.lockTxt}>SOLVE {p.unlockPct}%</span>
                    </div>
                  )}
                  {unlocked && (
                    <div className={styles.panelBadge}>{p.badgeText}</div>
                  )}
                </div>
                <div className={styles.panelLbl}>{p.label}</div>
              </div>
            );
          })}
        </div>

        {/* Right: Crossword + Clues */}
        <div className={styles.puzzle}>
          <div className={styles.gridWrap}>
            <div
              role="grid"
              aria-label="Crossword puzzle grid"
              className={styles.grid}
              style={{
                gridTemplateColumns: `repeat(${gridWidth}, var(--cell-size))`,
                gridTemplateRows: `repeat(${gridHeight}, var(--cell-size))`,
              }}
            >
              {Array.from({ length: gridHeight }, (_, r) =>
                Array.from({ length: gridWidth }, (_, c) => {
                  const key = `${r}-${c}`;
                  const cell = state.cells[key];
                  if (!cell) return null;
                  if (cell.blk) return <div key={key} className={styles.cellBlk} aria-hidden="true" />;
                  const isCursor = key === state.cursor;
                  const inSlot = activeSlotCells.has(key);
                  const cellClass = [
                    styles.cell,
                    isCursor ? styles.cellCur : inSlot ? styles.cellSlot : '',
                    cell.ltr ? (cell.ok ? styles.cellOk : styles.cellWrong) : '',
                  ].filter(Boolean).join(' ');
                  return (
                    <div
                      key={key}
                      role="gridcell"
                      className={cellClass}
                      data-k={key}
                      tabIndex={0}
                      aria-label={`Cell ${key}${cell.ltr ? `, letter ${cell.ltr}` : ', empty'}`}
                      onClick={() => handleCellClick(key)}
                      onKeyDown={e => handleKeyDown(e, key)}
                    >
                      {wordStartSet.has(key) && <span className={styles.cellStar}>✦</span>}
                      {cell.ltr && <span className={styles.cellLtr}>{cell.ltr}</span>}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Clues */}
          <div className={styles.clues} aria-label="Crossword clues">
            <div>
              <h3 className={styles.clueHd}>⚡ ACROSS <span className={styles.clueSub}>(INK REVEAL)</span></h3>
              <ol className={styles.clueList}>
                {acrossSlots.map((s, i) => (
                  <li
                    key={s.id}
                    className={`${styles.clueItem} ${s.id === state.selSlot ? styles.clueActive : ''} ${state.slotStates[s.id]?.solved ? styles.clueDone : ''}`}
                    onClick={() => dispatch({ type: 'SELECT_SLOT', id: s.id })}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter') dispatch({ type: 'SELECT_SLOT', id: s.id }); }}
                  >
                    <span className={styles.clueNum}>{i + 1}.</span>
                    <span>{s.clue}</span>
                    {state.slotStates[s.id]?.solved && <span style={{ color: 'var(--green)', marginLeft: 'auto' }}>✓</span>}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className={styles.clueHd}>⬇ DOWN</h3>
              <ol className={styles.clueList}>
                {downSlots.map((s, i) => (
                  <li
                    key={s.id}
                    className={`${styles.clueItem} ${s.id === state.selSlot ? styles.clueActive : ''} ${state.slotStates[s.id]?.solved ? styles.clueDone : ''}`}
                    onClick={() => dispatch({ type: 'SELECT_SLOT', id: s.id })}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter') dispatch({ type: 'SELECT_SLOT', id: s.id }); }}
                  >
                    <span className={styles.clueNum}>{i + 1}.</span>
                    <span>{s.clue}</span>
                    {state.slotStates[s.id]?.solved && <span style={{ color: 'var(--green)', marginLeft: 'auto' }}>✓</span>}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Letter bank */}
        <div className={styles.bank} role="toolbar" aria-label="Letter bank">
          <p className={styles.bankHint}>
            {state.selLetter ? '👆 Now click a cell in the grid!' : '① Click a cell · ② Click a letter · Backspace to erase'}
          </p>
          {QWERTY.map((row, ri) => (
            <div key={ri} className={styles.bankRow}>
              {row.map(l => (
                <button
                  key={l}
                  type="button"
                  className={`${styles.tile} ${state.selLetter === l ? styles.tileSel : ''}`}
                  onClick={() => handleTileClick(l)}
                  aria-label={`Letter ${l}`}
                  aria-pressed={state.selLetter === l}
                >
                  {l}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Ink bar */}
      <div className={styles.inkbar}>
        <span className={styles.inkLbl}>🖋 INK LEVEL</span>
        <div className={styles.inkTrack} role="progressbar" aria-valuenow={state.ink} aria-valuemin={0} aria-valuemax={100}>
          <div className={styles.inkFill} style={{ width: `${state.ink}%` }} />
        </div>
        <span className={styles.inkDone}>
          {state.ink >= 100 ? '🎉 PUBLISHED!' : `${state.ink}% — LEVEL TO FULL!`}
        </span>
      </div>

      {/* Avatar placeholder — wire up Section 1 avatar here */}
      <div className={styles.avatar} title="Avatar — coming soon from Section 1">🎨</div>

      {/* Locked overlay */}
      {!isUnlocked && (
        <div className={styles.lockedOverlay}>
          <div className={styles.lockedBox}>
            <span>🔒</span>
            <p>Upload a PDF to unlock this section</p>
            <a href="#tutors" style={{ color: 'var(--gold)' }}>Go to Tutors ↑</a>
          </div>
        </div>
      )}

      {/* Legacy Cover Modal */}
      {state.published && (
        <div className={styles.modalBg} role="dialog" aria-modal="true" aria-label="Legacy Cover">
          <div className={styles.modal}>
            <div className={styles.cover}>
              <div className={styles.coverHdr}>
                <span className={styles.coverTag}>⭐ LEGACY COVER ⭐</span>
                <span className={styles.coverTitle}>{lessonTitle.toUpperCase()}</span>
              </div>
              <div className={styles.coverGrid}>
                {panels.map(p => (
                  <div key={p.id} className={styles.coverCell}>
                    <Image src={p.imageSrc} alt={p.label} fill style={{ objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
              <div className={styles.coverFoot}>
                <span className={styles.coverBy}>Written &amp; Solved by</span>
                <span className={styles.coverName}>{studentName}</span>
                <span className={styles.coverPw}>HistorAI · historai.app</span>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.dlBtn} type="button" onClick={() => alert('PNG export — wire up html-to-image in production')}>
                ⬇ DOWNLOAD PNG
              </button>
              <button className={styles.closeBtn} type="button" onClick={resetGame}>✕ CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
