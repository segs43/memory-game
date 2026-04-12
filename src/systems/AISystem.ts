// src/systems/AISystem.ts
// ─────────────────────────────────────────────────────────────
// NPC behavior: idle, patrol, wander, flee.
// Called every fixed tick with delta-time.
// ─────────────────────────────────────────────────────────────

import type { NpcEntity, PlayerEntity, Vec2 } from '@core/types.js';
import { PhysicsSystem } from './PhysicsSystem.js';
import { CONFIG } from '@core/GameConfig.js';

const WANDER_BOUNDS = {
  minX: 30, maxX: CONFIG.canvas.logicalWidth  - 30,
  minY: 30, maxY: CONFIG.canvas.logicalHeight - 30,
};

export class AISystem {
  constructor(private readonly physics: PhysicsSystem) {}

  update(npcs: NpcEntity[], player: PlayerEntity, dt: number): void {
    for (const npc of npcs) {
      if (npc.memory.stolen) {
        // Drained NPCs drift to a stop
        npc.ai.state = 'drained';
        continue;
      }

      const distToPlayer = this.distVec(npc.transform.position, player.transform.position);

      // ── Flee logic ───────────────────────────────────────────
      if (distToPlayer < npc.ai.fleeRadius) {
        npc.ai.state = 'flee';
        this.flee(npc, player, dt);
        continue;
      }

      // ── Return to patrol / wander ────────────────────────────
      if (npc.ai.patrolPath.length >= 2) {
        npc.ai.state = 'patrol';
        this.patrol(npc, dt);
      } else {
        npc.ai.state = 'idle';
        this.wander(npc, dt);
      }
    }
  }

  // ── Flee away from player ──────────────────────────────────────
  private flee(npc: NpcEntity, player: PlayerEntity, dt: number): void {
    const dx = npc.transform.position.x - player.transform.position.x;
    const dy = npc.transform.position.y - player.transform.position.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    const speed = npc.ai.speed * 1.8 * dt;
    this.physics.moveEntity(npc, (dx / len) * speed, (dy / len) * speed);
  }

  // ── Patrol along defined path ─────────────────────────────────
  private patrol(npc: NpcEntity, dt: number): void {
    const path = npc.ai.patrolPath;
    const target = path[npc.ai.patrolIndex % path.length];
    if (!target) return;

    const dx = target.x - npc.transform.position.x;
    const dy = target.y - npc.transform.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 6) {
      npc.ai.patrolIndex = (npc.ai.patrolIndex + 1) % path.length;
      return;
    }

    const speed = npc.ai.speed * dt;
    this.physics.moveEntity(npc, (dx / dist) * speed, (dy / dist) * speed);
  }

  // ── Wander with idle pauses ────────────────────────────────────
  private wander(npc: NpcEntity, dt: number): void {
    npc.ai.idleTimer -= dt;

    if (!npc.ai.wanderTarget || npc.ai.idleTimer <= 0) {
      // Pick a new random target
      npc.ai.wanderTarget = this.randomTarget();
      npc.ai.idleTimer = 1.5 + Math.random() * 2.5;
    }

    const target = npc.ai.wanderTarget;
    const dx = target.x - npc.transform.position.x;
    const dy = target.y - npc.transform.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 8) {
      npc.ai.wanderTarget = null;
      return;
    }

    const speed = npc.ai.speed * 0.6 * dt;
    this.physics.moveEntity(npc, (dx / dist) * speed, (dy / dist) * speed);
  }

  private randomTarget(): Vec2 {
    return {
      x: WANDER_BOUNDS.minX + Math.random() * (WANDER_BOUNDS.maxX - WANDER_BOUNDS.minX),
      y: WANDER_BOUNDS.minY + Math.random() * (WANDER_BOUNDS.maxY - WANDER_BOUNDS.minY),
    };
  }

  private distVec(a: Vec2, b: Vec2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
