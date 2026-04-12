// src/systems/PhysicsSystem.ts
// ─────────────────────────────────────────────────────────────
// Handles movement, wall collision, and entity–entity separation.
// Pure functions — no state, no side effects beyond mutation
// of entity transform components.
// ─────────────────────────────────────────────────────────────
import { CONFIG } from '@core/GameConfig.js';
const { logicalWidth: W, logicalHeight: H } = CONFIG.canvas;
const WALL_MARGIN = 1;
// ── AABB vs Circle overlap ─────────────────────────────────────
function circleVsRect(cx, cy, cr, rx, ry, rw, rh) {
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < cr * cr;
}
// ── MTV (minimum translation vector) push-out ─────────────────
function resolveCircleRect(cx, cy, cr, rx, ry, rw, rh) {
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    const distSq = dx * dx + dy * dy;
    if (distSq >= cr * cr)
        return null;
    const dist = Math.sqrt(distSq) || 0.001;
    const overlap = cr - dist + WALL_MARGIN;
    return {
        x: (dx / dist) * overlap,
        y: (dy / dist) * overlap,
    };
}
export class PhysicsSystem {
    walls;
    constructor(walls) {
        this.walls = walls;
    }
    /**
     * Moves an entity by the given velocity delta, resolves wall collisions.
     * Returns the final resolved position.
     */
    moveEntity(entity, dx, dy) {
        const pos = entity.transform.position;
        const r = entity.collider.radius;
        let nx = pos.x + dx;
        let ny = pos.y + dy;
        // Boundary clamp
        nx = Math.max(20 + r, Math.min(W - 20 - r, nx));
        ny = Math.max(20 + r, Math.min(H - 20 - r, ny));
        // Wall resolution — try full move, then axis-separated fallback
        for (const w of this.walls) {
            const mtv = resolveCircleRect(nx, ny, r, w.x, w.y, w.w, w.h);
            if (mtv) {
                nx += mtv.x;
                ny += mtv.y;
            }
        }
        // Second pass after axis-separated push (handles corners cleanly)
        for (const w of this.walls) {
            const mtv = resolveCircleRect(nx, ny, r, w.x, w.y, w.w, w.h);
            if (mtv) {
                nx += mtv.x;
                ny += mtv.y;
            }
        }
        pos.x = nx;
        pos.y = ny;
    }
    /**
     * Returns true if a point + radius is in collision with any wall.
     */
    isBlocked(x, y, r) {
        for (const w of this.walls) {
            if (circleVsRect(x, y, r, w.x, w.y, w.w, w.h))
                return true;
        }
        return false;
    }
    /**
     * Returns distance between two entities.
     */
    distance(a, b) {
        const dx = a.transform.position.x - b.transform.position.x;
        const dy = a.transform.position.y - b.transform.position.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    /**
     * Simple circle–circle separation for NPC stacking prevention.
     */
    separateEntities(entities) {
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const a = entities[i];
                const b = entities[j];
                const dx = b.transform.position.x - a.transform.position.x;
                const dy = b.transform.position.y - a.transform.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
                const minDist = a.collider.radius + b.collider.radius + 2;
                if (dist < minDist) {
                    const overlap = (minDist - dist) / 2;
                    const nx = (dx / dist) * overlap;
                    const ny = (dy / dist) * overlap;
                    a.transform.position.x -= nx;
                    a.transform.position.y -= ny;
                    b.transform.position.x += nx;
                    b.transform.position.y += ny;
                }
            }
        }
    }
}
