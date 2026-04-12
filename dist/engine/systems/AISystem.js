import { vec2 } from '@utils/vec2';
import { WORLD, resolveWallSlide } from '@engine/core/WorldMap';
const WANDER_SPEED = 45;
const FLEE_SPEED = 90;
const ALERT_RADIUS = 120;
const FLEE_RADIUS = 55;
const ALERT_LINGER = 2.5;
const WANDER_MIN = 1.5;
const WANDER_MAX = 4.5;
const WANDER_RANGE = 70;
function randomWanderTarget(base) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 25 + Math.random() * WANDER_RANGE;
    return {
        x: Math.max(30, Math.min(WORLD.width - 30, base.x + Math.cos(angle) * dist)),
        y: Math.max(30, Math.min(WORLD.height - 30, base.y + Math.sin(angle) * dist)),
    };
}
export function updateNPCBehavior(npc, player, dt) {
    if (npc.state === 'stolen')
        return npc;
    const idlePhase = npc.idlePhase + dt * 1.8;
    const distToPlayer = vec2.distance(npc.position, player.position);
    const playerClose = distToPlayer < ALERT_RADIUS;
    const playerVeryClose = distToPlayer < FLEE_RADIUS;
    let { wanderTarget, wanderTimer } = npc;
    let state = npc.state;
    // alertRadius field repurposed as alert-linger countdown when out of range
    let lingerTimer = npc.alertRadius;
    if (playerClose) {
        state = 'alert';
        lingerTimer = ALERT_LINGER;
    }
    else if (state === 'alert') {
        lingerTimer = Math.max(0, lingerTimer - dt);
        state = lingerTimer > 0 ? 'alert' : 'idle';
    }
    let position = vec2.clone(npc.position);
    if (playerVeryClose) {
        // Flee directly away from player
        const awayDir = vec2.normalize(vec2.sub(npc.position, player.position));
        const step = vec2.scale(awayDir, FLEE_SPEED * dt);
        position = resolveWallSlide(WORLD.walls, position, vec2.add(position, step), npc.radius);
        wanderTarget = null;
    }
    else if (state === 'idle') {
        wanderTimer -= dt;
        if (wanderTimer <= 0 || wanderTarget === null) {
            wanderTarget = randomWanderTarget(npc.position);
            wanderTimer = WANDER_MIN + Math.random() * (WANDER_MAX - WANDER_MIN);
        }
        if (wanderTarget) {
            const dir = vec2.normalize(vec2.sub(wanderTarget, position));
            const dist = vec2.distance(position, wanderTarget);
            if (dist > 5) {
                position = resolveWallSlide(WORLD.walls, position, vec2.add(position, vec2.scale(dir, WANDER_SPEED * dt)), npc.radius);
            }
            else {
                wanderTarget = null;
            }
        }
    }
    return { ...npc, state, idlePhase, wanderTarget, wanderTimer, alertRadius: lingerTimer, position };
}
