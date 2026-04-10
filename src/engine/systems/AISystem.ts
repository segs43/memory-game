import type { NPCEntity, PlayerEntity } from '@types-game/game';
import { vec2 } from '@utils/vec2';
import { WORLD, resolveWallSlide } from '@engine/core/WorldMap';

const WANDER_SPEED = 40;
const WANDER_INTERVAL_MIN = 2;
const WANDER_INTERVAL_MAX = 5;
const WANDER_RANGE = 60;

function randomWanderTarget(base: { x: number; y: number }): { x: number; y: number } {
  const angle = Math.random() * Math.PI * 2;
  const dist = 20 + Math.random() * WANDER_RANGE;
  return {
    x: Math.max(30, Math.min(WORLD.width - 30, base.x + Math.cos(angle) * dist)),
    y: Math.max(30, Math.min(WORLD.height - 30, base.y + Math.sin(angle) * dist)),
  };
}

export function updateNPCBehavior(
  npc: NPCEntity,
  player: PlayerEntity,
  dt: number
): NPCEntity {
  if (npc.state === 'stolen') return npc;

  // Idle phase animation
  const idlePhase = npc.idlePhase + dt * 1.8;

  // Alert detection
  const distToPlayer = vec2.distance(npc.position, player.position);
  const isAlert = distToPlayer < npc.alertRadius;
  const state = isAlert ? 'alert' : 'idle';

  // Wander logic (only when idle)
  let { wanderTarget, wanderTimer } = npc;
  let position = vec2.clone(npc.position);

  if (state === 'idle') {
    wanderTimer -= dt;
    if (wanderTimer <= 0 || wanderTarget === null) {
      wanderTarget = randomWanderTarget(npc.position);
      wanderTimer = WANDER_INTERVAL_MIN + Math.random() * (WANDER_INTERVAL_MAX - WANDER_INTERVAL_MIN);
    }

    if (wanderTarget) {
      const dir = vec2.normalize(vec2.sub(wanderTarget, position));
      const dist = vec2.distance(position, wanderTarget);
      if (dist > 4) {
        const step = vec2.scale(dir, WANDER_SPEED * dt);
        const next = vec2.add(position, step);
        position = resolveWallSlide(WORLD.walls, position, next, npc.radius);
      } else {
        wanderTarget = null;
      }
    }
  }

  return { ...npc, state, idlePhase, wanderTarget, wanderTimer, position };
}
