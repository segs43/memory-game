export class GameLoop {
    updateFn;
    renderFn;
    rafId = null;
    lastTime = 0;
    elapsed = 0;
    running = false;
    MAX_DT = 1 / 20; // cap at 50ms to prevent spiral of death
    constructor(update, render) {
        this.updateFn = update;
        this.renderFn = render;
    }
    start() {
        if (this.running)
            return;
        this.running = true;
        this.lastTime = performance.now();
        this.rafId = requestAnimationFrame(this.tick);
    }
    stop() {
        this.running = false;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
    reset() {
        this.elapsed = 0;
        this.lastTime = performance.now();
    }
    tick = (now) => {
        if (!this.running)
            return;
        const rawDt = (now - this.lastTime) / 1000;
        const dt = Math.min(rawDt, this.MAX_DT);
        this.lastTime = now;
        this.elapsed += dt;
        this.updateFn(dt, this.elapsed);
        this.renderFn();
        this.rafId = requestAnimationFrame(this.tick);
    };
}
