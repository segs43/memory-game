// src/entities/EntityFactory.ts
// ─────────────────────────────────────────────────────────────
// Factory methods for creating typed entities.
// Systems receive entities from here — never construct raw objects.
// ─────────────────────────────────────────────────────────────

import { v4 as uuidv4 } from 'uuid';
import type { PlayerEntity, NpcEntity, Vec2 } from '@core/types.js';
import type { NpcSeedData } from '@data/WorldData.js';
import { PLAYER_SPAWN } from '@data/WorldData.js';
import { CONFIG } from '@core/GameConfig.js';

export function createPlayer(): PlayerEntity {
  return {
    id: 'player',
    type: 'player',
    transform: {
      position: { ...PLAYER_SPAWN },
      velocity: { x: 0, y: 0 },
      rotation: 0,
    },
    collider: { radius: CONFIG.player.radius },
    renderable: {
      spriteKey: 'player',
      tint: 0xf0d5ff,
      alpha: 1,
      scale: { x: 1, y: 1 },
      zIndex: 10,
    },
  };
}

export function createNpcFromSeed(seed: NpcSeedData): NpcEntity {
  return {
    id: seed.id,
    type: 'npc',
    transform: {
      position: { ...seed.spawnPosition },
      velocity: { x: 0, y: 0 },
      rotation: 0,
    },
    collider: { radius: 16 },
    renderable: {
      spriteKey: 'npc',
      tint: seed.uniqueColor,
      alpha: 1,
      scale: { x: 1, y: 1 },
      zIndex: 5,
    },
    memory: {
      text: seed.memory,
      stolen: false,
      corruptionThreshold: 2,
      corruptedText: seed.corruptedMemory,
    },
    ai: {
      state: 'idle',
      patrolPath: seed.patrolPath.map((p) => ({ ...p })),
      patrolIndex: 0,
      speed: seed.speed,
      fleeRadius: seed.fleeRadius,
      idleTimer: Math.random() * 2,
      wanderTarget: null,
    },
    uniqueColor: seed.uniqueColor,
  };
}

export function randomVec2InBounds(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): Vec2 {
  return {
    x: minX + Math.random() * (maxX - minX),
    y: minY + Math.random() * (maxY - minY),
  };
}

export function generateSessionId(): string {
  return uuidv4();
}
