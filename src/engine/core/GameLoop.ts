export type UpdateFn = (dt: number, elapsed: number) => void;
export type RenderFn = () => void;

export class GameLoop {
  private updateFn: UpdateFn;
  private renderFn: RenderFn;
  private rafId: number | null = null;
  private lastTime = 0;
  private elapsed = 0;
  private running = false;

  private readonly MAX_DT = 1 / 20; // cap at 50ms to prevent spiral of death

  constructor(update: UpdateFn, render: RenderFn) {
    this.updateFn = update;
    this.renderFn = render;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  reset(): void {
    this.elapsed = 0;
    this.lastTime = performance.now();
  }

  private tick = (now: number): void => {
    if (!this.running) return;

    const rawDt = (now - this.lastTime) / 1000;
    const dt = Math.min(rawDt, this.MAX_DT);
    this.lastTime = now;
    this.elapsed += dt;

    this.updateFn(dt, this.elapsed);
    this.renderFn();

    this.rafId = requestAnimationFrame(this.tick);
  };
}
