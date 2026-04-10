import type { PlayerEntity, NPCEntity, CorruptionState } from '@types-game/game';
import type { Camera } from '@engine/core/Camera';
import type { Particle } from '@engine/systems/ParticleSystem';
import type { GlitchState } from '@engine/systems/GlitchSystem';
import { WORLD } from '@engine/core/WorldMap';
import { renderGlitch } from '@engine/systems/GlitchSystem';

export class RenderSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreen: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    // Offscreen buffer for chromatic aberration pass
    this.offscreen = document.createElement('canvas');
    this.offscreen.width = canvas.width;
    this.offscreen.height = canvas.height;
    const offCtx = this.offscreen.getContext('2d');
    if (!offCtx) throw new Error('Could not get offscreen 2D context');
    this.offCtx = offCtx;
    // offCtx reserved for future chromatic aberration pass
    void this.offCtx;
  }

  resize(w: number, h: number): void {
    this.canvas.width = w;
    this.canvas.height = h;
    this.offscreen.width = w;
    this.offscreen.height = h;
  }

  render(
    player: PlayerEntity,
    npcs: NPCEntity[],
    particles: readonly Particle[],
    camera: Camera,
    corruption: CorruptionState,
    glitch: GlitchState,
    elapsed: number,
  ): void {
    const { canvas, ctx } = this;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // ── World pass (camera-transformed) ──────────────────────────────────────
    ctx.save();
    camera.applyTransform(ctx, W, H);

    this.drawFloor(ctx, elapsed);
    this.drawWalls(ctx);
    this.drawParticles(ctx, particles);
    this.drawNPCs(ctx, npcs, elapsed);
    this.drawPlayer(ctx, player, elapsed);

    ctx.restore();

    // ── Screen-space vignette (tied to vision radius) ────────────────────────
    this.drawVignette(ctx, player, camera, corruption, W, H);

    // ── Corruption blur overlay ───────────────────────────────────────────────
    if (corruption.blurAmount > 0.5) {
      ctx.save();
      ctx.filter = `blur(${corruption.blurAmount * 0.4}px)`;
      ctx.globalAlpha = Math.min(0.6, corruption.blurAmount * 0.08);
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
      ctx.restore();
    }

    // ── Glitch post-process ───────────────────────────────────────────────────
    renderGlitch(ctx, glitch, W, H);
  }

  // ── Private draw helpers ────────────────────────────────────────────────────

  private drawFloor(ctx: CanvasRenderingContext2D, elapsed: number): void {
    ctx.fillStyle = '#150f1c';
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    // Animated grid
    ctx.strokeStyle = `rgba(42,31,53,${0.18 + Math.sin(elapsed * 0.5) * 0.04})`;
    ctx.lineWidth = 1;
    const GRID = 40;
    for (let x = 0; x <= WORLD.width; x += GRID) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD.height);
      ctx.stroke();
    }
    for (let y = 0; y <= WORLD.height; y += GRID) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD.width, y);
      ctx.stroke();
    }
  }

  private drawWalls(ctx: CanvasRenderingContext2D): void {
    for (const w of WORLD.walls) {
      // Shadow
      ctx.fillStyle = '#0a0710';
      ctx.fillRect(w.x + 4, w.y + 4, w.w, w.h);
      // Body
      ctx.fillStyle = '#2f2040';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      // Inner face
      ctx.fillStyle = '#3a2850';
      ctx.fillRect(w.x + 2, w.y + 2, w.w - 4, w.h - 4);
      // Edge highlight
      ctx.strokeStyle = '#604878';
      ctx.lineWidth = 2;
      ctx.strokeRect(w.x, w.y, w.w, w.h);
    }
  }

  private drawNPCs(ctx: CanvasRenderingContext2D, npcs: NPCEntity[], elapsed: number): void {
    for (const npc of npcs) {
      const bob = Math.sin(npc.idlePhase + elapsed * 1.8) * npc.idleAmplitude;
      const { x, y } = npc.position;

      if (npc.state === 'stolen') {
        this.drawNPCShell(ctx, x, y);
      } else {
        this.drawNPCActive(ctx, x, y + bob, npc.state === 'alert');
      }
    }
  }

  private drawNPCShell(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#2a1f35';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1025';
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawNPCActive(ctx: CanvasRenderingContext2D, x: number, y: number, alert: boolean): void {
    const glowColor = alert ? '#ff9966' : '#b385ff';
    const bodyColor0 = alert ? '#ffb08a' : '#c9a0ff';
    const bodyColor1 = alert ? '#cc5533' : '#7a4fa0';

    const grad = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, 20);
    grad.addColorStop(0, bodyColor0);
    grad.addColorStop(1, bodyColor1);

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = alert ? 35 : 22;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#2a1540';
    ctx.beginPath();
    ctx.arc(x - 5, y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 5, y - 4, 4, 0, Math.PI * 2);
    ctx.fill();

    // Eye glow
    ctx.fillStyle = alert ? '#ffcc99' : '#c9a0ff';
    ctx.beginPath();
    ctx.arc(x - 4, y - 5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 6, y - 5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Memory crystal above head
    ctx.shadowColor = '#d4b5ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#d4b5ff';
    ctx.beginPath();
    ctx.arc(x, y - 26, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerEntity, elapsed: number): void {
    const { x, y } = player.position;
    const pulse = Math.sin(elapsed * 3) * 2;

    const grad = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, 18 + pulse);
    grad.addColorStop(0, '#f0d5ff');
    grad.addColorStop(1, '#a070d0');

    ctx.shadowColor = '#c09eff';
    ctx.shadowBlur = 30 + pulse * 2;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1a0f2a';
    ctx.beginPath();
    ctx.arc(x - 5, y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 5, y - 4, 4, 0, Math.PI * 2);
    ctx.fill();

    // Eye glow
    ctx.fillStyle = '#c9a0ff';
    ctx.beginPath();
    ctx.arc(x - 4, y - 5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 6, y - 5, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawParticles(ctx: CanvasRenderingContext2D, particles: readonly Particle[]): void {
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.size * 2;
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawVignette(
    ctx: CanvasRenderingContext2D,
    player: PlayerEntity,
    camera: Camera,
    corruption: CorruptionState,
    W: number,
    H: number,
  ): void {
    // Convert player world pos to screen pos for vignette center
    const screenPos = camera.worldToScreen(player.position, W, H);
    const scaleX = W / camera.viewWidth;
    const radiusPx = corruption.visionRadius * scaleX;

    const gradient = ctx.createRadialGradient(
      screenPos.x, screenPos.y, radiusPx * 0.2,
      screenPos.x, screenPos.y, radiusPx * 1.2,
    );
    gradient.addColorStop(0, 'rgba(20,10,30,0)');
    gradient.addColorStop(0.6, 'rgba(5,2,10,0.82)');
    gradient.addColorStop(1, '#05020a');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
  }

  drawInteractionHint(
    ctx: CanvasRenderingContext2D,
    player: PlayerEntity,
    camera: Camera,
    W: number,
    H: number,
  ): void {
    const sp = camera.worldToScreen(player.position, W, H);
    ctx.save();
    ctx.fillStyle = '#d4b5ff';
    ctx.font = `bold ${Math.floor(W / 50)}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    ctx.fillText('👇 STEAL MEMORY', sp.x, sp.y - (45 * H / 600));
    ctx.restore();
  }
}
