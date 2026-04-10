import type { Vec2 } from '@types-game/game';
import { vec2 } from '@utils/vec2';

export class Camera {
  position: Vec2 = vec2.zero();
  private target: Vec2 = vec2.zero();
  private shake: Vec2 = vec2.zero();
  private shakeTimer = 0;
  private shakeMagnitude = 0;

  readonly viewWidth: number;
  readonly viewHeight: number;
  readonly worldWidth: number;
  readonly worldHeight: number;

  constructor(viewW: number, viewH: number, worldW: number, worldH: number) {
    this.viewWidth = viewW;
    this.viewHeight = viewH;
    this.worldWidth = worldW;
    this.worldHeight = worldH;
  }

  follow(target: Vec2): void {
    this.target = vec2.clone(target);
  }

  triggerShake(magnitude: number, duration: number): void {
    this.shakeMagnitude = magnitude;
    this.shakeTimer = duration;
  }

  update(dt: number): void {
    // Smooth follow with lerp
    this.position = vec2.lerp(this.position, this.target, Math.min(1, dt * 8));

    // Clamp to world bounds
    this.position.x = Math.max(this.viewWidth / 2, Math.min(this.worldWidth - this.viewWidth / 2, this.position.x));
    this.position.y = Math.max(this.viewHeight / 2, Math.min(this.worldHeight - this.viewHeight / 2, this.position.y));

    // Shake decay
    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
      const intensity = (this.shakeTimer / 0.3) * this.shakeMagnitude;
      this.shake = {
        x: (Math.random() - 0.5) * 2 * intensity,
        y: (Math.random() - 0.5) * 2 * intensity,
      };
    } else {
      this.shake = vec2.zero();
    }
  }

  // World-to-screen transform
  worldToScreen(world: Vec2, canvasW: number, canvasH: number): Vec2 {
    const scaleX = canvasW / this.viewWidth;
    const scaleY = canvasH / this.viewHeight;
    return {
      x: (world.x - this.position.x + this.viewWidth / 2 + this.shake.x) * scaleX,
      y: (world.y - this.position.y + this.viewHeight / 2 + this.shake.y) * scaleY,
    };
  }

  // Apply camera transform to canvas context
  applyTransform(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number): void {
    const scaleX = canvasW / this.viewWidth;
    const scaleY = canvasH / this.viewHeight;
    ctx.scale(scaleX, scaleY);
    ctx.translate(
      -this.position.x + this.viewWidth / 2 + this.shake.x,
      -this.position.y + this.viewHeight / 2 + this.shake.y,
    );
  }

  reset(position: Vec2): void {
    this.position = vec2.clone(position);
    this.target = vec2.clone(position);
    this.shake = vec2.zero();
    this.shakeTimer = 0;
  }
}
