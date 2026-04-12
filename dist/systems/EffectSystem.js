// src/systems/EffectSystem.ts
// ─────────────────────────────────────────────────────────────
// Manages all runtime visual effects:
//   - Camera shake (screen-space, delta-decayed)
//   - Chromatic aberration intensity
//   - Scanline intensity
//   - Vignette radius
//   - Particle pool for memory extraction bursts
// ─────────────────────────────────────────────────────────────
import { bus } from '@core/EventBus.js';
import { CONFIG } from '@core/GameConfig.js';
const POOL_SIZE = 256;
export class EffectSystem {
    camera = { x: 400, y: 300, shakeX: 0, shakeY: 0 };
    effects = {
        vignetteRadius: 280,
        chromaticIntensity: 0,
        scanlineIntensity: 0.1,
        chromaticDecayTimer: 0,
    };
    // Particle pool — pre-allocated, no GC pressure
    particles = Array.from({ length: POOL_SIZE }, () => ({
        active: false,
        x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 1,
        color: 0xffffff, size: 3,
    }));
    shakeIntensity = 0;
    init() {
        bus.on('effect:shake', (p) => this.addShake(p.intensity));
        bus.on('effect:chromatic', (p) => this.setChromaticAberration(p.intensity, p.duration));
        bus.on('effect:scanlines', (p) => { this.effects.scanlineIntensity = p.intensity; });
        bus.on('effect:vignette', (p) => { this.effects.vignetteRadius = p.radius; });
        bus.on('effect:particles', (p) => this.spawnParticles(p.x, p.y, p.count, p.color));
    }
    update(dt, targetX, targetY) {
        this.updateCamera(dt, targetX, targetY);
        this.updateParticles(dt);
        this.updateChromatic(dt);
    }
    // ── Camera ─────────────────────────────────────────────────────
    updateCamera(dt, targetX, targetY) {
        const lerp = CONFIG.camera.lerp;
        this.camera.x += (targetX - this.camera.x) * lerp;
        this.camera.y += (targetY - this.camera.y) * lerp;
        // Shake decay
        if (this.shakeIntensity > 0.01) {
            this.camera.shakeX = (Math.random() * 2 - 1) * this.shakeIntensity;
            this.camera.shakeY = (Math.random() * 2 - 1) * this.shakeIntensity;
            this.shakeIntensity *= Math.pow(CONFIG.camera.shakeDecay, dt * 60);
        }
        else {
            this.shakeIntensity = 0;
            this.camera.shakeX = 0;
            this.camera.shakeY = 0;
        }
    }
    addShake(intensity) {
        this.shakeIntensity = Math.min(20, this.shakeIntensity + intensity);
    }
    // ── Chromatic aberration ───────────────────────────────────────
    setChromaticAberration(intensity, duration) {
        this.effects.chromaticIntensity = intensity;
        this.effects.chromaticDecayTimer = duration / 1000;
    }
    updateChromatic(dt) {
        if (this.effects.chromaticDecayTimer > 0) {
            this.effects.chromaticDecayTimer -= dt;
            if (this.effects.chromaticDecayTimer <= 0) {
                this.effects.chromaticIntensity *= 0.5;
            }
        }
    }
    // ── Particles ──────────────────────────────────────────────────
    spawnParticles(x, y, count, color) {
        let spawned = 0;
        for (const p of this.particles) {
            if (!p.active && spawned < count) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 60 + Math.random() * 120;
                p.active = true;
                p.x = x;
                p.y = y;
                p.vx = Math.cos(angle) * speed;
                p.vy = Math.sin(angle) * speed;
                p.life = 0.5 + Math.random() * 0.5;
                p.maxLife = p.life;
                p.color = color;
                p.size = 2 + Math.random() * 4;
                spawned++;
            }
        }
    }
    updateParticles(dt) {
        for (const p of this.particles) {
            if (!p.active)
                continue;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.life -= dt;
            if (p.life <= 0)
                p.active = false;
        }
    }
    get activeParticles() {
        return this.particles.filter(p => p.active);
    }
}
