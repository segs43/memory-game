import { vec2 } from '@utils/vec2';
export class ParticleSystem {
    pool = [];
    active = [];
    POOL_SIZE = 200;
    constructor() {
        for (let i = 0; i < this.POOL_SIZE; i++) {
            this.pool.push(this.makeParticle());
        }
    }
    makeParticle() {
        return { position: vec2.zero(), velocity: vec2.zero(), life: 0, maxLife: 1, size: 4, color: '#fff', alpha: 1 };
    }
    acquire() {
        return this.pool.pop() ?? null;
    }
    release(p) {
        this.pool.push(p);
    }
    burst(origin, count, color = '#c9a0ff') {
        for (let i = 0; i < count; i++) {
            const p = this.acquire();
            if (!p)
                continue;
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 40 + Math.random() * 120;
            p.position = vec2.clone(origin);
            p.velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
            p.maxLife = 0.4 + Math.random() * 0.6;
            p.life = p.maxLife;
            p.size = 2 + Math.random() * 6;
            p.color = color;
            p.alpha = 1;
            this.active.push(p);
        }
    }
    ambient(origin) {
        if (Math.random() > 0.15)
            return;
        const p = this.acquire();
        if (!p)
            return;
        p.position = { x: origin.x + (Math.random() - 0.5) * 30, y: origin.y + (Math.random() - 0.5) * 30 };
        p.velocity = { x: (Math.random() - 0.5) * 20, y: -10 - Math.random() * 20 };
        p.maxLife = 1 + Math.random();
        p.life = p.maxLife;
        p.size = 1 + Math.random() * 3;
        p.color = '#b385ff';
        p.alpha = 0.6;
        this.active.push(p);
    }
    update(dt) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const p = this.active[i];
            p.life -= dt;
            p.position.x += p.velocity.x * dt;
            p.position.y += p.velocity.y * dt;
            p.velocity.x *= 0.95;
            p.velocity.y *= 0.95;
            p.alpha = Math.max(0, p.life / p.maxLife);
            if (p.life <= 0) {
                this.active.splice(i, 1);
                this.release(p);
            }
        }
    }
    getActive() {
        return this.active;
    }
    clear() {
        this.active.forEach(p => this.release(p));
        this.active = [];
    }
}
