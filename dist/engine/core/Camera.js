import { vec2 } from '@utils/vec2';
export class Camera {
    position = vec2.zero();
    target = vec2.zero();
    shake = vec2.zero();
    shakeTimer = 0;
    shakeMagnitude = 0;
    viewWidth;
    viewHeight;
    worldWidth;
    worldHeight;
    constructor(viewW, viewH, worldW, worldH) {
        this.viewWidth = viewW;
        this.viewHeight = viewH;
        this.worldWidth = worldW;
        this.worldHeight = worldH;
    }
    follow(target) {
        this.target = vec2.clone(target);
    }
    triggerShake(magnitude, duration) {
        this.shakeMagnitude = magnitude;
        this.shakeTimer = duration;
    }
    update(dt) {
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
        }
        else {
            this.shake = vec2.zero();
        }
    }
    // World-to-screen transform
    worldToScreen(world, canvasW, canvasH) {
        const scaleX = canvasW / this.viewWidth;
        const scaleY = canvasH / this.viewHeight;
        return {
            x: (world.x - this.position.x + this.viewWidth / 2 + this.shake.x) * scaleX,
            y: (world.y - this.position.y + this.viewHeight / 2 + this.shake.y) * scaleY,
        };
    }
    // Apply camera transform to canvas context
    applyTransform(ctx, canvasW, canvasH) {
        const scaleX = canvasW / this.viewWidth;
        const scaleY = canvasH / this.viewHeight;
        ctx.scale(scaleX, scaleY);
        ctx.translate(-this.position.x + this.viewWidth / 2 + this.shake.x, -this.position.y + this.viewHeight / 2 + this.shake.y);
    }
    reset(position) {
        this.position = vec2.clone(position);
        this.target = vec2.clone(position);
        this.shake = vec2.zero();
        this.shakeTimer = 0;
    }
}
