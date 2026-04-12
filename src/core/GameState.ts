// src/core/GameState.ts
// ─────────────────────────────────────────────────────────────
// Centralized type-safe state store using a Zustand-like pattern.
// Vanilla (no React dependency) — works anywhere in the engine.
// ─────────────────────────────────────────────────────────────

import { createStore } from 'zustand/vanilla';
import type { CorruptionTier, EndingType, InputState } from './types.js';

export type GamePhase = 'menu' | 'playing' | 'dialogue' | 'ending' | 'paused';

export interface GameStateShape {
  // Phase
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;

  // Corruption / progression
  memoriesStolen: number;
  corruptionTier: CorruptionTier;
  invertControls: boolean;
  invertControlsUntil: number;
  setMemoriesStolen: (count: number) => void;
  setCorruptionTier: (tier: CorruptionTier) => void;
  setInvertControls: (invert: boolean, until: number) => void;

  // Ending
  ending: EndingType | null;
  setEnding: (type: EndingType) => void;

  // Input (managed by InputSystem but readable everywhere)
  input: InputState;
  setInput: (input: Partial<InputState>) => void;

  // Session
  sessionStartTime: number;
  nearbyNpcId: string | null;
  setNearbyNpcId: (id: string | null) => void;

  // Reset
  reset: () => void;
}

const initialInput: InputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  interact: false,
  joystick: { x: 0, y: 0 },
};

function computeTier(count: number): CorruptionTier {
  if (count === 0) return 'stable';
  if (count <= 2) return 'compromised';
  if (count <= 4) return 'unstable';
  if (count === 5) return 'severe';
  return 'terminal';
}

export const gameStore = createStore<GameStateShape>()((set, _get) => ({
  phase: 'menu',
  setPhase: (phase) => set({ phase }),

  memoriesStolen: 0,
  corruptionTier: 'stable',
  invertControls: false,
  invertControlsUntil: 0,

  setMemoriesStolen: (count) =>
    set({ memoriesStolen: count, corruptionTier: computeTier(count) }),

  setCorruptionTier: (tier) => set({ corruptionTier: tier }),

  setInvertControls: (invert, until) =>
    set({ invertControls: invert, invertControlsUntil: until }),

  ending: null,
  setEnding: (type) => set({ ending: type }),

  input: { ...initialInput },
  setInput: (partial) =>
    set((s) => ({ input: { ...s.input, ...partial } })),

  sessionStartTime: Date.now(),
  nearbyNpcId: null,
  setNearbyNpcId: (id) => set({ nearbyNpcId: id }),

  reset: () =>
    set({
      phase: 'playing',
      memoriesStolen: 0,
      corruptionTier: 'stable',
      invertControls: false,
      invertControlsUntil: 0,
      ending: null,
      input: { ...initialInput },
      sessionStartTime: Date.now(),
      nearbyNpcId: null,
    }),
}));

// Convenience getter
export function getState(): GameStateShape {
  return gameStore.getState();
}
