// ─── Vector ──────────────────────────────────────────────────────────────────
export interface Vec2 {
  x: number;
  y: number;
}

// ─── Entities ────────────────────────────────────────────────────────────────
export interface Entity {
  id: string;
  position: Vec2;
  radius: number;
}

export interface PlayerEntity extends Entity {
  speed: number;
  facing: Vec2;
}

export type NPCState = 'idle' | 'alert' | 'stolen';

export interface NPCMemory {
  text: string;
  corruptedText: string;
  emotionTag: string;
}

export interface NPCEntity extends Entity {
  state: NPCState;
  memory: NPCMemory;
  idlePhase: number;
  idleAmplitude: number;
  alertRadius: number;
  wanderTarget: Vec2 | null;
  wanderTimer: number;
}

// ─── World ───────────────────────────────────────────────────────────────────
export interface WallRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WorldMap {
  width: number;
  height: number;
  walls: WallRect[];
}

// ─── Corruption ──────────────────────────────────────────────────────────────
export type CorruptionTier = 'stable' | 'compromised' | 'unstable' | 'severe' | 'void';

export interface CorruptionState {
  level: number;       // 0–1 normalized
  tier: CorruptionTier;
  invertControls: boolean;
  invertTimer: number;
  visionRadius: number;
  blurAmount: number;
  glitchIntensity: number;
}

// ─── Game State ───────────────────────────────────────────────────────────────
export type GamePhase = 'menu' | 'playing' | 'dialogue' | 'ending';

export type EndingType = 'dark' | 'incomplete' | 'true';

export interface GameState {
  phase: GamePhase;
  memoriesStolen: number;
  totalNPCs: number;
  corruption: CorruptionState;
  activeDialogue: DialogueLine | null;
  ending: EndingType | null;
}

// ─── Dialogue ────────────────────────────────────────────────────────────────
export interface DialogueLine {
  text: string;
  speaker: string;
  corrupted: boolean;
}

// ─── Input ───────────────────────────────────────────────────────────────────
export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  interact: boolean;
  joystick: Vec2; // normalized -1..1
}

// ─── Events ──────────────────────────────────────────────────────────────────
export type GameEventType =
  | 'MEMORY_STOLEN'
  | 'DIALOGUE_OPEN'
  | 'DIALOGUE_CLOSE'
  | 'CORRUPTION_CHANGED'
  | 'GAME_OVER'
  | 'GLITCH_TRIGGER'
  | 'PLAYER_MOVED';

export interface GameEvent<T = unknown> {
  type: GameEventType;
  payload: T;
}
