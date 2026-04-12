// src/core/types.ts
// ─────────────────────────────────────────────────────────────
// Shared type definitions for the entire Memory Thief engine.
// Every system imports from here — no scattered inline types.
// ─────────────────────────────────────────────────────────────

export type EntityId = string;

export interface Vec2 {
  x: number;
  y: number;
}

// ── Component interfaces (ECS-style) ─────────────────────────

export interface TransformComponent {
  position: Vec2;
  velocity: Vec2;
  rotation: number;
}

export interface ColliderComponent {
  radius: number;
}

export interface RenderableComponent {
  spriteKey: string;
  tint: number;
  alpha: number;
  scale: Vec2;
  zIndex: number;
}

export interface MemoryComponent {
  text: string;
  stolen: boolean;
  corruptionThreshold: number; // memories stolen count when corruption text kicks in
  corruptedText?: string;
}

export interface AIComponent {
  state: 'idle' | 'patrol' | 'flee' | 'drained';
  patrolPath: Vec2[];
  patrolIndex: number;
  speed: number;
  fleeRadius: number;
  idleTimer: number;
  wanderTarget: Vec2 | null;
}

// ── Entity definitions ────────────────────────────────────────

export interface Entity {
  id: EntityId;
  transform: TransformComponent;
  collider: ColliderComponent;
  renderable: RenderableComponent;
}

export interface PlayerEntity extends Entity {
  type: 'player';
}

export interface NpcEntity extends Entity {
  type: 'npc';
  memory: MemoryComponent;
  ai: AIComponent;
  uniqueColor: number;
}

export type GameEntity = PlayerEntity | NpcEntity;

// ── Corruption level tiers ─────────────────────────────────────

export type CorruptionTier =
  | 'stable'       // 0
  | 'compromised'  // 1–2
  | 'unstable'     // 3–4
  | 'severe'       // 5
  | 'terminal';    // 6+ (triggers dark ending)

// ── Ending types ───────────────────────────────────────────────

export type EndingType = 'dark' | 'incomplete' | 'true';

export interface EndingData {
  type: EndingType;
  title: string;
  description: string;
  memoriesStolen: number;
  timeSurvived: number;
}

// ── Input state ────────────────────────────────────────────────

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  interact: boolean;
  joystick: Vec2; // normalized [-1, 1] range
}

// ── Game config (data-driven) ──────────────────────────────────

export interface GameConfig {
  canvas: {
    logicalWidth: number;
    logicalHeight: number;
  };
  player: {
    speed: number;
    radius: number;
    interactRadius: number;
  };
  corruption: {
    maxMemories: number;
    trueEndingMemories: number;
    invertControlsDuration: number;
    glitchProbability: number;
  };
  camera: {
    lerp: number;
    shakeDecay: number;
  };
}

// ── Wall / map geometry ────────────────────────────────────────

export interface WallRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ── Particle data ──────────────────────────────────────────────

export interface ParticleOptions {
  x: number;
  y: number;
  count: number;
  color: number;
  speed: number;
  lifetime: number;
}

// ── Save data for backend ──────────────────────────────────────

export interface SaveData {
  sessionId: string;
  memoriesStolen: number;
  ending: EndingType | null;
  timeSurvived: number;
  timestamp: number;
}
