// src/core/GameState.ts
// ─────────────────────────────────────────────────────────────
// Centralized type-safe state store using a Zustand-like pattern.
// Vanilla (no React dependency) — works anywhere in the engine.
// ─────────────────────────────────────────────────────────────
import { createStore } from 'zustand/vanilla';
const initialInput = {
    up: false,
    down: false,
    left: false,
    right: false,
    interact: false,
    joystick: { x: 0, y: 0 },
};
function computeTier(count) {
    if (count === 0)
        return 'stable';
    if (count <= 2)
        return 'compromised';
    if (count <= 4)
        return 'unstable';
    if (count === 5)
        return 'severe';
    return 'terminal';
}
export const gameStore = createStore()((set, _get) => ({
    phase: 'menu',
    setPhase: (phase) => set({ phase }),
    memoriesStolen: 0,
    corruptionTier: 'stable',
    invertControls: false,
    invertControlsUntil: 0,
    setMemoriesStolen: (count) => set({ memoriesStolen: count, corruptionTier: computeTier(count) }),
    setCorruptionTier: (tier) => set({ corruptionTier: tier }),
    setInvertControls: (invert, until) => set({ invertControls: invert, invertControlsUntil: until }),
    ending: null,
    setEnding: (type) => set({ ending: type }),
    input: { ...initialInput },
    setInput: (partial) => set((s) => ({ input: { ...s.input, ...partial } })),
    sessionStartTime: Date.now(),
    nearbyNpcId: null,
    setNearbyNpcId: (id) => set({ nearbyNpcId: id }),
    reset: () => set({
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
export function getState() {
    return gameStore.getState();
}
