// src/core/EventBus.ts
// ─────────────────────────────────────────────────────────────
// Type-safe publish/subscribe event bus.
// All inter-system communication goes through here.
// Systems never import each other — they emit and listen.
// ─────────────────────────────────────────────────────────────

import type { EndingType, NpcEntity, CorruptionTier } from './types.js';

// ── Event payload map ──────────────────────────────────────────
export interface GameEventMap {
  'game:start': undefined;
  'game:pause': undefined;
  'game:resume': undefined;
  'game:end': { endingType: EndingType; memoriesStolen: number; timeSurvived: number };

  'memory:steal': { npc: NpcEntity; memoriesStolen: number };
  'memory:dialogueClose': undefined;

  'corruption:change': { tier: CorruptionTier; memoriesStolen: number };
  'corruption:glitch': undefined;

  'player:nearNpc': { npcId: string };
  'player:leaveNpc': undefined;

  'audio:playGlitch': undefined;
  'audio:playSteal': undefined;
  'audio:playAmbient': undefined;

  'ui:showDialogue': { text: string };
  'ui:hideDialogue': undefined;
  'ui:showEnding': { endingType: EndingType; memoriesStolen: number; timeSurvived: number };
  'ui:updateHud': { memoriesStolen: number; tier: CorruptionTier };

  'effect:shake': { intensity: number };
  'effect:chromatic': { intensity: number; duration: number };
  'effect:scanlines': { intensity: number };
  'effect:vignette': { radius: number };
  'effect:particles': { x: number; y: number; count: number; color: number };
}

type EventListener<T> = (payload: T) => void;

class EventBus {
  private listeners = new Map<string, Set<EventListener<unknown>>>();

  on<K extends keyof GameEventMap>(
    event: K,
    listener: EventListener<GameEventMap[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(listener as EventListener<unknown>);

    // Return unsubscribe function
    return () => {
      set.delete(listener as EventListener<unknown>);
    };
  }

  emit<K extends keyof GameEventMap>(
    event: K,
    payload: GameEventMap[K]
  ): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) {
      listener(payload);
    }
  }

  off<K extends keyof GameEventMap>(
    event: K,
    listener: EventListener<GameEventMap[K]>
  ): void {
    this.listeners.get(event)?.delete(listener as EventListener<unknown>);
  }

  clear(): void {
    this.listeners.clear();
  }
}

// Singleton — imported everywhere
export const bus = new EventBus();
