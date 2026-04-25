// Public API for the GameModule
export { GameModule } from './GameModule';
export { lincolnClueSet } from './lincolnClueSet';

export type {
  ClueSet,
  WordSlotConfig,
  PanelConfig,
  DialogueBubble,
  GameState,
  CellState,
  WordSlotState,
  PanelState,
  TierLevel,
  GameAction,
  GameModuleProps,
  ValidationError,
} from './types';

export { validateClueSet } from './validation';
