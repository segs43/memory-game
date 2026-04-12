// src/core/GameLoop.ts
// ─────────────────────────────────────────────────────────────
// Professional fixed-timestep game loop with delta-time.
// Decoupled update rate from render rate.
// Supports pause, resume, and clean teardown.
// ─────────────────────────────────────────────────────────────

export type UpdateCallback = (dt: number, elapsed: number) => void;
export type RenderCallback = (interpolation: number) => void;

interface GameLoopOptions {
  fixedStep?: number;   // seconds per fixed update (default: 1/60)
  maxDelta?: number;    // max delta cap to prevent spiral of death (default: 0.1s)
}

export class GameLoop {
  private readonly fixedStep: number;
  private readonly maxDelta: number;

  private onUpdate: UpdateCallback;
  private onRender: RenderCallback;

  private rafId: number | null = null;
  private lastTime: number | null = null;
  private accumulator = 0;
  private elapsed = 0;

  private _running = false;
  private _paused = false;

  constructor(
    onUpdate: UpdateCallback,
    onRender: RenderCallback,
    options: GameLoopOptions = {}
  ) {
    this.onUpdate = onUpdate;
    this.onRender = onRender;
    this.fixedStep = options.fixedStep ?? 1 / 60;
    this.maxDelta = options.maxDelta ?? 0.1;
  }

  get running(): boolean { return this._running; }
  get paused(): boolean { return this._paused; }

  start(): void {
    if (this._running) return;
    this._running = true;
    this._paused = false;
    this.lastTime = null;
    this.accumulator = 0;
    this.elapsed = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  pause(): void {
    this._paused = true;
    this.lastTime = null; // reset so we don't get a huge delta on resume
  }

  resume(): void {
    this._paused = false;
    this.lastTime = null;
  }

  stop(): void {
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

  private tick = (timestamp: number): void => {
    if (!this._running) return;

    this.rafId = requestAnimationFrame(this.tick);

    if (this._paused) return;

    if (this.lastTime === null) {
      this.lastTime = timestamp;
      return;
    }

    let delta = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    // Cap delta to prevent spiral of death after tab focus loss
    if (delta > this.maxDelta) delta = this.maxDelta;

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
