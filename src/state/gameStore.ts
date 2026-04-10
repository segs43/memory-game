import { create } from 'zustand';
import type { GamePhase, EndingType, DialogueLine, CorruptionState, CorruptionTier } from '@types-game/game';
import { buildCorruptionState } from '@engine/systems/CorruptionSystem';

export interface GameStore {
  // ── Phase ──────────────────────────────────────────────────────────────────
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;

  // ── Progression ────────────────────────────────────────────────────────────
  memoriesStolen: number;
  totalNPCs: number;
  incrementMemories: () => void;
  resetProgression: () => void;

  // ── Corruption ─────────────────────────────────────────────────────────────
  corruption: CorruptionState;
  setCorruption: (c: CorruptionState) => void;

  // ── Dialogue ───────────────────────────────────────────────────────────────
  activeDialogue: DialogueLine | null;
  openDialogue: (line: DialogueLine) => void;
  closeDialogue: () => void;

  // ── Ending ─────────────────────────────────────────────────────────────────
  ending: EndingType | null;
  triggerEnding: (type: EndingType) => void;

  // ── NPC nearby hint ────────────────────────────────────────────────────────
  npcNearby: boolean;
  setNpcNearby: (v: boolean) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Phase
  phase: 'menu',
  setPhase: (phase) => set({ phase }),

  // Progression
  memoriesStolen: 0,
  totalNPCs: 5,
  incrementMemories: () => {
    const next = get().memoriesStolen + 1;
    set({
      memoriesStolen: next,
      corruption: buildCorruptionState(next),
    });
  },
  resetProgression: () =>
    set({
      memoriesStolen: 0,
      corruption: buildCorruptionState(0),
      ending: null,
      activeDialogue: null,
      npcNearby: false,
    }),

  // Corruption
  corruption: buildCorruptionState(0),
  setCorruption: (c) => set({ corruption: c }),

  // Dialogue
  activeDialogue: null,
  openDialogue: (line) => set({ activeDialogue: line, phase: 'dialogue' }),
  closeDialogue: () => set({ activeDialogue: null, phase: 'playing' }),

  // Ending
  ending: null,
  triggerEnding: (type) => set({ ending: type, phase: 'ending' }),

  // NPC hint
  npcNearby: false,
  setNpcNearby: (v) => set({ npcNearby: v }),
}));

// Selectors
export const selectCorruptionTier = (s: GameStore): CorruptionTier => s.corruption.tier;
export const selectCorruptionLevel = (s: GameStore): number => s.corruption.level;
export const selectPhase = (s: GameStore): GamePhase => s.phase;
