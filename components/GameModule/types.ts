// ─── ClueSet input types ────────────────────────────────────────────────────

export interface DialogueBubble {
  text: string;
  position: { top: string; left: string };
  type: 'speech' | 'caption' | 'sfx';
}

export interface PanelConfig {
  id: string;
  order: number;
  sketchSrc: string;
  inkSrc: string;
  dialogueSrc: string;
  dialogues: DialogueBubble[];
}

export interface WordSlotConfig {
  id: string;
  answer: string; // uppercase
  clue: string;
  direction: 'across' | 'down';
  startRow: number; // 0-indexed
  startCol: number; // 0-indexed
  panelId: string;
}

export interface ClueSet {
  gridWidth: number;
  gridHeight: number;
  wordSlots: WordSlotConfig[];
  panels: PanelConfig[];
}

// ─── Game state types ────────────────────────────────────────────────────────

export type TierLevel = 0 | 1 | 2 | 3;

export interface CellState {
  row: number;
  col: number;
  isBlocked: boolean;
  letter: string | null;
  correctLetter: string | null;
  isCorrect: boolean;
}

export interface WordSlotState {
  id: string;
  direction: 'across' | 'down';
  cells: string[]; // ordered cell keys "row-col"
  panelId: string;
  solvedLetterCount: number;
  isFullySolved: boolean;
}

export interface PanelState {
  panelId: string;
  tier: TierLevel;
}

export interface GameState {
  cells: Record<string, CellState>;
  wordSlots: WordSlotState[];
  selectedWordSlotId: string | null;
  selectedLetter: string | null;
  panelStates: Record<string, PanelState>;
  inkLevel: number; // 0-100
  publishEventFired: boolean;
  isLocked: boolean;
}

// ─── Reducer actions ─────────────────────────────────────────────────────────

export type GameAction =
  | { type: 'PLACE_LETTER'; cellKey: string; letter: string }
  | { type: 'REMOVE_LETTER'; cellKey: string }
  | { type: 'SELECT_CELL'; cellKey: string }
  | { type: 'SELECT_WORD_SLOT'; wordSlotId: string }
  | { type: 'SELECT_LETTER'; letter: string }
  | { type: 'RESET_GAME' }
  | { type: 'INIT'; clueSet: ClueSet };

// ─── Component props ─────────────────────────────────────────────────────────

export interface GameModuleProps {
  clueSet: ClueSet;
  studentName: string;
  lessonTitle: string;
  pdfFilename: string;
  isUnlocked: boolean;
  accentColor?: string; // defaults to '#6B2737'
  onWordSolved?: (wordSlotId: string) => void;
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface ValidationError {
  isValid: false;
  errors: string[];
}
