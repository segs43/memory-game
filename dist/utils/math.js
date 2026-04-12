// src/utils/math.ts
// ─────────────────────────────────────────────────────────────
// Common math helpers used across systems.
// ─────────────────────────────────────────────────────────────
export function lerp(a, b, t) {
    return a + (b - a) * t;
}
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
export function dist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}
export function normalize(v) {
    const len = Math.sqrt(v.x * v.x + v.y * v.y) || 1;
    return { x: v.x / len, y: v.y / len };
}
export function randomRange(min, max) {
    return min + Math.random() * (max - min);
}
export function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
}
export function angleBetween(from, to) {
    return Math.atan2(to.y - from.y, to.x - from.x);
}
export function vecFromAngle(angle, magnitude = 1) {
    return { x: Math.cos(angle) * magnitude, y: Math.sin(angle) * magnitude };
}
