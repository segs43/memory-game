// src/core/GameLoop.ts
// ─────────────────────────────────────────────────────────────
// Professional fixed-timestep game loop with delta-time.
// Decoupled update rate from render rate.
// Supports pause, resume, and clean teardown.
// ─────────────────────────────────────────────────────────────
export class GameLoop {
    fixedStep;
    maxDelta;
    onUpdate;
    onRender;
    rafId = null;
    lastTime = null;
    accumulator = 0;
    elapsed = 0;
    _running = false;
    _paused = false;
    constructor(onUpdate, onRender, options = {}) {
        this.onUpdate = onUpdate;
        this.onRender = onRender;
        this.fixedStep = options.fixedStep ?? 1 / 60;
        this.maxDelta = options.maxDelta ?? 0.1;
    }
    get running() { return this._running; }
    get paused() { return this._paused; }
    start() {
        if (this._running)
            return;
        this._running = true;
        this._paused = false;
        this.lastTime = null;
        this.accumulator = 0;
        this.elapsed = 0;
        this.rafId = requestAnimationFrame(this.tick);
    }
    pause() {
        this._paused = true;
        this.lastTime = null; // reset so we don't get a huge delta on resume
    }
    resume() {
        this._paused = false;
        this.lastTime = null;
    }
    stop() {
        this._running = false;
        this._paused = false;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.lastTime = null;
        this.accumulator = 0;
        this.elapsed = 0;
    }
    tick = (timestamp) => {
        if (!this._running)
            return;
        this.rafId = requestAnimationFrame(this.tick);
        if (this._paused)
            return;
        if (this.lastTime === null) {
            this.lastTime = timestamp;
            return;
        }
        let delta = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        // Cap delta to prevent spiral of death after tab focus loss
        if (delta > this.maxDelta)
            delta = this.maxDelta;
        this.elapsed += delta;
        this.accumulator += delta;
        // Fixed-step updates
        while (this.accumulator >= this.fixedStep) {
            this.onUpdate(this.fixedStep, this.elapsed);
            this.accumulator -= this.fixedStep;
        }
        // Render with interpolation factor
        const interpolation = this.accumulator / this.fixedStep;
        this.onRender(interpolation);
    };
}
