export const vec2 = {
    zero: () => ({ x: 0, y: 0 }),
    clone: (v) => ({ x: v.x, y: v.y }),
    add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
    sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
    scale: (v, s) => ({ x: v.x * s, y: v.y * s }),
    length: (v) => Math.sqrt(v.x * v.x + v.y * v.y),
    lengthSq: (v) => v.x * v.x + v.y * v.y,
    normalize: (v) => {
        const len = vec2.length(v);
        if (len === 0)
            return vec2.zero();
        return { x: v.x / len, y: v.y / len };
    },
    distance: (a, b) => vec2.length(vec2.sub(b, a)),
    distanceSq: (a, b) => vec2.lengthSq(vec2.sub(b, a)),
    lerp: (a, b, t) => ({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
    }),
    dot: (a, b) => a.x * b.x + a.y * b.y,
    clampLength: (v, max) => {
        const len = vec2.length(v);
        if (len > max)
            return vec2.scale(vec2.normalize(v), max);
        return v;
    },
};
