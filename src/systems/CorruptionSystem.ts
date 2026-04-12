// src/systems/CorruptionSystem.ts
// ─────────────────────────────────────────────────────────────
// Manages all corruption effects triggered by memory theft.
// Data-driven tiers: stable → compromised → unstable → severe → terminal.
// Emits visual and audio effect events through the EventBus.
// ─────────────────────────────────────────────────────────────

import { bus } from '@core/EventBus.js';
import { getState } from '@core/GameState.js';
import { CONFIG } from '@core/GameConfig.js';
import type { CorruptionTier, NpcEntity } from '@core/types.js';
import type { EndingType } from '@core/types.js';

// ── Per-tier effect parameters ────────────────────────────────
const TIER_EFFECTS: Record<CorruptionTier, {
  vignetteRadius: number;
  chromaticIntensity: number;
  scanlineIntensity: number;
  glitchProbability: number;
  label: string;
}> = {
  stable:      { vignetteRadius: 280, chromaticIntensity: 0,    scanlineIntensity: 0.1, glitchProbability: 0,    label: '⚡ STABLE'      },
  compromised: { vignetteRadius: 240, chromaticIntensity: 0.02, scanlineIntensity: 0.2, glitchProbability: 0.05, label: '⚠️ COMPROMISED' },
  unstable:    { vignetteRadius: 190, chromaticIntensity: 0.05, scanlineIntensity: 0.4, glitchProbability: 0.15, label: '🌀 UNSTABLE'    },
  severe:      { vignetteRadius: 140, chromaticIntensity: 0.09, scanlineIntensity: 0.6, glitchProbability: 0.25, label: '💀 SEVERE'      },
  terminal:    { vignetteRadius: 90,  chromaticIntensity: 0.14, scanlineIntensity: 0.9, glitchProbability: 0.5,  label: '☠️ TERMINAL'    },
};

export class CorruptionSystem {
  private glitchTimer = 0;
  private readonly GLITCH_INTERVAL = 3.0; // seconds between random glitch checks

  update(dt: number): void {
    const state = getState();
    if (state.phase !== 'playing') return;

    // Random ambient glitches based on tier
    this.glitchTimer -= dt;
    if (this.glitchTimer <= 0) {
      this.glitchTimer = this.GLITCH_INTERVAL;

      const tier = state.corruptionTier;
      const effects = TIER_EFFECTS[tier];

      if (Math.random() < effects.glitchProbability) {
        this.triggerGlitch();
      }
    }

    // Release invert-controls if timer expired
    if (state.invertControls && Date.now() > state.invertControlsUntil) {
      state.setInvertControls(false, 0);
    }
  }

  /**
   * Called when a memory is stolen. Applies all tier-appropriate effects
   * and emits events for renderer and audio systems.
   */
  onMemoryStolen(npcs: NpcEntity[]): void {
    const state = getState();
    const count = state.memoriesStolen;
    const tier  = state.corruptionTier;
    const fx    = TIER_EFFECTS[tier];

    // Visual effects
    bus.emit('effect:vignette',   { radius: fx.vignetteRadius });
    bus.emit('effect:chromatic',  { intensity: fx.chromaticIntensity, duration: 2000 });
    bus.emit('effect:scanlines',  { intensity: fx.scanlineIntensity });
    bus.emit('effect:shake',      { intensity: 4 + count * 1.5 });
    bus.emit('corruption:glitch', undefined);

    // Audio
    bus.emit('audio:playSteal',   undefined);
    bus.emit('audio:playGlitch',  undefined);

    // Control inversion
    if (count >= 1) {
      const until = Date.now() + CONFIG.corruption.invertControlsDuration;
      state.setInvertControls(true, until);
    }

    // Emit for HUD update
    bus.emit('ui:updateHud', { memoriesStolen: count, tier });

    // Check endings
    this.checkEnding(count, npcs);
  }

  triggerGlitch(): void {
    const state = getState();
    const fx = TIER_EFFECTS[state.corruptionTier];
    bus.emit('effect:shake',   { intensity: fx.chromaticIntensity * 30 });
    bus.emit('corruption:glitch', undefined);
    bus.emit('audio:playGlitch', undefined);
  }

  getTierLabel(tier: CorruptionTier): string {
    return TIER_EFFECTS[tier].label;
  }

  getVignetteRadius(tier: CorruptionTier): number {
    return TIER_EFFECTS[tier].vignetteRadius;
  }

  private checkEnding(memoriesStolen: number, npcs: NpcEntity[]): void {

    // Dark ending — stole too many
    if (memoriesStolen >= CONFIG.corruption.maxMemories) {
      this.triggerEnding('dark');
      return;
    }

    // True ending — stole exactly 5, including hidden NPC
    const hiddenStolen = npcs.find(n => n.id === 'npc-hidden')?.memory.stolen ?? false;
    if (memoriesStolen === CONFIG.corruption.trueEndingMemories && hiddenStolen) {
      this.triggerEnding('true');
      return;
    }

    // Incomplete ending — all NPCs drained but fewer than maxMemories
    const allStolen = npcs.every(n => n.memory.stolen);
    if (allStolen && memoriesStolen < CONFIG.corruption.maxMemories) {
      this.triggerEnding('incomplete');
    }
  }

  private triggerEnding(type: EndingType): void {
    const state = getState();
    const timeSurvived = (Date.now() - state.sessionStartTime) / 1000;

    state.setPhase('ending');
    state.setEnding(type);

    setTimeout(() => {
      bus.emit('ui:showEnding', {
        endingType: type,
        memoriesStolen: state.memoriesStolen,
        timeSurvived,
      });
    }, 1200);
  }
}
