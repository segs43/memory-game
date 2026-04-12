// src/core/GameConfig.ts
// ─────────────────────────────────────────────────────────────
// Single source of truth for all tunable game parameters.
// No magic numbers elsewhere in the codebase.
// ─────────────────────────────────────────────────────────────
export const CONFIG = {
    canvas: {
        logicalWidth: 800,
        logicalHeight: 600,
    },
    player: {
        speed: 160, // pixels per second (delta-time based)
        radius: 14,
        interactRadius: 48,
    },
    corruption: {
        maxMemories: 6,
        trueEndingMemories: 5,
        invertControlsDuration: 4000, // ms
        glitchProbability: 0.3,
    },
    camera: {
        lerp: 0.08,
        shakeDecay: 0.92,
    },
};
