import type { CorruptionState, CorruptionTier } from '@types-game/game';
import { eventBus } from '@engine/core/EventBus';

const TOTAL_MEMORIES = 5;

function getTier(level: number): CorruptionTier {
  if (level >= 1.0) return 'void';
  if (level >= 0.8) return 'severe';
  if (level >= 0.5) return 'unstable';
  if (level >= 0.2) return 'compromised';
  return 'stable';
}

export function buildCorruptionState(memoriesStolen: number): CorruptionState {
  const level = Math.min(1, memoriesStolen / TOTAL_MEMORIES);
  const tier = getTier(level);

  return {
    level,
    tier,
    invertControls: false,
    invertTimer: 0,
    visionRadius: Math.max(80, 280 - memoriesStolen * 35),
    blurAmount: Math.min(8, memoriesStolen * 1.5),
    glitchIntensity: level,
  };
}

export function updateCorruptionTimers(state: CorruptionState, dt: number): CorruptionState {
  if (state.invertTimer > 0) {
    const newTimer = Math.max(0, state.invertTimer - dt);
    return {
      ...state,
      invertTimer: newTimer,
      invertControls: newTimer > 0,
    };
  }
  return state;
}

export function applyMemorySteal(_state: CorruptionState, memoriesStolen: number): CorruptionState {
  const next = buildCorruptionState(memoriesStolen);
  const updated = {
    ...next,
    invertControls: true,
    invertTimer: 4.0,
  };
  eventBus.emit('CORRUPTION_CHANGED', updated);
  return updated;
}

export const CORRUPTION_LABELS: Record<CorruptionTier, string> = {
  stable:      '⚡ STABLE',
  compromised: '⚠️ COMPROMISED',
  unstable:    '🌀 UNSTABLE',
  severe:      '💀 SEVERE',
  void:        '☠️ VOID',
};
