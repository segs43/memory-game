import type { Vec2 } from '@types-game/game';

export const vec2 = {
  zero: (): Vec2 => ({ x: 0, y: 0 }),

  clone: (v: Vec2): Vec2 => ({ x: v.x, y: v.y }),

  add: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y }),

  sub: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y }),

  scale: (v: Vec2, s: number): Vec2 => ({ x: v.x * s, y: v.y * s }),

  length: (v: Vec2): number => Math.sqrt(v.x * v.x + v.y * v.y),

  lengthSq: (v: Vec2): number => v.x * v.x + v.y * v.y,

  normalize: (v: Vec2): Vec2 => {
    const len = vec2.length(v);
    if (len === 0) return vec2.zero();
    return { x: v.x / len, y: v.y / len };
  },

  distance: (a: Vec2, b: Vec2): number => vec2.length(vec2.sub(b, a)),

  distanceSq: (a: Vec2, b: Vec2): number => vec2.lengthSq(vec2.sub(b, a)),

  lerp: (a: Vec2, b: Vec2, t: number): Vec2 => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  }),

  dot: (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y,

  clampLength: (v: Vec2, max: number): Vec2 => {
    const len = vec2.length(v);
    if (len > max) return vec2.scale(vec2.normalize(v), max);
    return v;
  },
};
