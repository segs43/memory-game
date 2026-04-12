import { create } from 'zustand';
import { buildCorruptionState } from '@engine/systems/CorruptionSystem';
export const useGameStore = create((set, get) => ({
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
    resetProgression: () => set({
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
export const selectCorruptionTier = (s) => s.corruption.tier;
export const selectCorruptionLevel = (s) => s.corruption.level;
export const selectPhase = (s) => s.phase;
