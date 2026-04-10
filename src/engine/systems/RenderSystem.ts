import type { PlayerEntity, NPCEntity, CorruptionState } from '@types-game/game';
import type { Camera } from '@engine/core/Camera';
import type { Particle } from '@engine/systems/ParticleSystem';
import type { GlitchState } from '@engine/systems/GlitchSystem';
import { WORLD } from '@engine/core/WorldMap';
import { renderGlitch } from '@engine/systems/GlitchSystem';

// Trail position history for player motion blur
interface TrailPoint { x: number; y: number; age: number }

export class RenderSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreen: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D;
  private playerTrail: TrailPoint[] = [];
  private readonly TRAIL_LENGTH = 8;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    this.offscreen = document.createElement('canvas');
    this.offscreen.width = canvas.width;
    this.offscreen.height = canvas.height;
    const offCtx = this.offscreen.getContext('2d');
    if (!offCtx) throw new Error('Could not get offscreen 2D context');
    this.offCtx = offCtx;
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

    // Update motion trail
    this.playerTrail.push({ x: player.position.x, y: player.position.y, age: 0 });
    if (this.playerTrail.length > this.TRAIL_LENGTH) this.playerTrail.shift();
    this.playerTrail.forEach(p => p.age++);

    // Choose render target: offscreen when chromatic aberration is active
    const useOffscreen = corruption.level > 0.35;
    const target  = useOffscreen ? this.offCtx : ctx;
    const tCanvas = useOffscreen ? this.offscreen : canvas;

    target.clearRect(0, 0, W, H);

    // ── World pass (camera-transformed) ──────────────────────────────────────
    target.save();
    camera.applyTransform(target, W, H);

    this.drawFloor(target, elapsed, corruption.level);
    this.drawWalls(target, elapsed);
    this.drawParticles(target, particles);
    this.drawNPCGlowPools(target, npcs, elapsed);
    this.drawNPCs(target, npcs, elapsed);
    this.drawPlayerTrail(target, corruption.level);
    this.drawPlayer(target, player, elapsed, corruption.level);

    target.restore();

    // ── Chromatic aberration (offscreen → main canvas) ───────────────────────
    if (useOffscreen) {
      ctx.clearRect(0, 0, W, H);
      const shift = Math.round(corruption.level * 5);
      ctx.drawImage(tCanvas, 0, 0);
      if (shift > 0) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.globalCompositeOperation = 'screen';
        ctx.filter = 'hue-rotate(180deg) saturate(3)';
        ctx.drawImage(tCanvas, shift, 0);
        ctx.filter = 'none';
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.globalCompositeOperation = 'screen';
        ctx.filter = 'hue-rotate(0deg) saturate(3)';
        ctx.drawImage(tCanvas, -shift, 0);
        ctx.filter = 'none';
        ctx.restore();
      }
    }

    // ── Screen-space vignette ─────────────────────────────────────────────────
    this.drawVignette(ctx, player, camera, corruption, W, H);

    // ── Glitch post-process ───────────────────────────────────────────────────
    renderGlitch(ctx, glitch, W, H);
  }

  // ── Floor ──────────────────────────────────────────────────────────────────

  private drawFloor(ctx: CanvasRenderingContext2D, elapsed: number, corruption: number): void {
    ctx.fillStyle = '#120d1a';
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    // Subtle floor tile pattern
    const TILE = 80;
    ctx.strokeStyle = `rgba(38,27,52,0.5)`;
    ctx.lineWidth = 1;
    for (let x = 0; x <= WORLD.width; x += TILE) {
      for (let y = 0; y <= WORLD.height; y += TILE) {
        ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
      }
    }

    // Fine grid overlay, pulses with corruption
    const gridAlpha = 0.12 + corruption * 0.08 + Math.sin(elapsed * 0.4) * 0.02;
    ctx.strokeStyle = `rgba(60,40,80,${gridAlpha})`;
    ctx.lineWidth = 0.5;
    const GRID = 40;
    for (let x = 0; x <= WORLD.width; x += GRID) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD.height); ctx.stroke();
    }
    for (let y = 0; y <= WORLD.height; y += GRID) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD.width, y); ctx.stroke();
    }

    // At high corruption, draw floor veins
    if (corruption > 0.4) {
      const veinAlpha = (corruption - 0.4) * 0.5;
      ctx.strokeStyle = `rgba(120,0,180,${veinAlpha})`;
      ctx.lineWidth = 1;
      ctx.shadowColor = '#8800cc';
      ctx.shadowBlur = 6;
      for (let i = 0; i < 3; i++) {
        const ox = 100 + i * 220;
        ctx.beginPath();
        ctx.moveTo(ox, 0);
        ctx.bezierCurveTo(ox + 60, 200, ox - 40, 400, ox + 20, 600);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }
  }

  // ── Walls ─────────────────────────────────────────────────────────────────

  private drawWalls(ctx: CanvasRenderingContext2D, elapsed: number): void {
    for (const w of WORLD.walls) {
      // Outer drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(w.x + 6, w.y + 6, w.w, w.h);

      // Base body
      const wallGrad = ctx.createLinearGradient(w.x, w.y, w.x + w.w, w.y + w.h);
      wallGrad.addColorStop(0, '#2a1c3a');
      wallGrad.addColorStop(1, '#1e1228');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(w.x, w.y, w.w, w.h);

      // Top face highlight (3D feel)
      ctx.fillStyle = 'rgba(100,70,140,0.25)';
      ctx.fillRect(w.x, w.y, w.w, 3);
      ctx.fillStyle = 'rgba(100,70,140,0.1)';
      ctx.fillRect(w.x, w.y, 3, w.h);

      // Animated edge glow
      const pulse = 0.4 + Math.sin(elapsed * 1.2) * 0.2;
      ctx.strokeStyle = `rgba(80,50,110,${pulse})`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
    }
  }

  // ── NPC glow pools on floor ───────────────────────────────────────────────

  private drawNPCGlowPools(ctx: CanvasRenderingContext2D, npcs: NPCEntity[], elapsed: number): void {
    for (const npc of npcs) {
      if (npc.state === 'stolen') continue;
      const pulse = 0.12 + Math.sin(npc.idlePhase + elapsed * 1.2) * 0.05;
      const isAlert = npc.state === 'alert';
      const poolColor = isAlert ? `rgba(255,100,50,${pulse})` : `rgba(150,80,220,${pulse})`;
      const poolGrad = ctx.createRadialGradient(npc.position.x, npc.position.y, 0, npc.position.x, npc.position.y, 40);
      poolGrad.addColorStop(0, poolColor);
      poolGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = poolGrad;
      ctx.beginPath();
      ctx.ellipse(npc.position.x, npc.position.y + 12, 40, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── NPCs ──────────────────────────────────────────────────────────────────

  private drawNPCs(ctx: CanvasRenderingContext2D, npcs: NPCEntity[], elapsed: number): void {
    for (const npc of npcs) {
      const bob = Math.sin(npc.idlePhase + elapsed * 1.8) * npc.idleAmplitude;
      const { x, y } = npc.position;
      if (npc.state === 'stolen') {
        this.drawNPCShell(ctx, x, y, elapsed);
      } else {
        this.drawNPCActive(ctx, x, y + bob, npc.state === 'alert', elapsed);
      }
    }
  }

  private drawNPCShell(ctx: CanvasRenderingContext2D, x: number, y: number, elapsed: number): void {
    // Cracked hollow shell
    ctx.save();
    ctx.globalAlpha = 0.55 + Math.sin(elapsed * 2.5) * 0.1;
    ctx.fillStyle = '#1e1530';
    ctx.shadowColor = '#110a1a';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();

    // Crack lines
    ctx.strokeStyle = 'rgba(80,50,110,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 10); ctx.lineTo(x + 2, y + 6);
    ctx.moveTo(x + 6, y - 8);  ctx.lineTo(x - 2, y + 4);
    ctx.stroke();

    // Empty eye sockets
    ctx.fillStyle = '#0a0510';
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(x - 5, y - 3, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 5, y - 3, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  private drawNPCActive(ctx: CanvasRenderingContext2D, x: number, y: number, alert: boolean, elapsed: number): void {
    const glowColor  = alert ? '#ff7744' : '#b385ff';
    const bodyTop    = alert ? '#ffaa77' : '#c9a0ff';
    const bodyBottom = alert ? '#aa3311' : '#6a3d90';

    ctx.save();

    // Body gradient
    const grad = ctx.createRadialGradient(x - 4, y - 6, 1, x, y, 18);
    grad.addColorStop(0, bodyTop);
    grad.addColorStop(0.7, bodyBottom);
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = alert ? 40 : 28;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();

    // Rim light
    ctx.strokeStyle = alert ? 'rgba(255,180,100,0.7)' : 'rgba(200,160,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 16, Math.PI * 1.2, Math.PI * 2.2);
    ctx.stroke();

    // Eyes — whites
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f0e8ff';
    ctx.beginPath(); ctx.ellipse(x - 5, y - 4, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 5, y - 4, 5, 4, 0, 0, Math.PI * 2); ctx.fill();

    // Eye pupils
    ctx.fillStyle = alert ? '#cc2200' : '#3a1060';
    ctx.beginPath(); ctx.arc(x - 5, y - 4, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 5, y - 4, 2.5, 0, Math.PI * 2); ctx.fill();

    // Memory orb — orbits above head
    const orbitAngle = elapsed * 2.2 + (alert ? Math.PI : 0);
    const orbX = x + Math.cos(orbitAngle) * 8;
    const orbY = y - 26 + Math.sin(orbitAngle * 0.5) * 3;
    const orbColor = alert ? '#ffaa55' : '#d4b5ff';

    ctx.shadowColor = orbColor;
    ctx.shadowBlur = 18;
    ctx.fillStyle = orbColor;
    ctx.beginPath();
    ctx.arc(orbX, orbY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Orb sparkle
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(orbX - 1.5, orbY - 1.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ── Player ────────────────────────────────────────────────────────────────

  private drawPlayerTrail(ctx: CanvasRenderingContext2D, corruptionLevel: number): void {
    if (corruptionLevel < 0.1) return;
    for (let i = 0; i < this.playerTrail.length; i++) {
      const p = this.playerTrail[i];
      const t = i / this.playerTrail.length;
      const alpha = t * corruptionLevel * 0.4;
      const radius = 14 * t * 0.8;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = corruptionLevel > 0.7 ? '#cc44ff' : '#8855cc';
      ctx.shadowColor = '#8855cc';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerEntity, elapsed: number, corruptionLevel: number): void {
    const { x, y } = player.position;
    const pulse = Math.sin(elapsed * 4) * 2;

    ctx.save();

    // Outer aura ring, grows with corruption
    const auraRadius = 22 + corruptionLevel * 12 + pulse;
    const auraGrad = ctx.createRadialGradient(x, y, player.radius, x, y, auraRadius);
    auraGrad.addColorStop(0, `rgba(160,80,240,${0.15 + corruptionLevel * 0.2})`);
    auraGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(x, y, auraRadius, 0, Math.PI * 2);
    ctx.fill();

    // Body
    const bodyGrad = ctx.createRadialGradient(x - 5, y - 6, 0, x, y, player.radius + 2);
    bodyGrad.addColorStop(0, corruptionLevel > 0.6 ? '#ff99ff' : '#f0d5ff');
    bodyGrad.addColorStop(0.6, corruptionLevel > 0.6 ? '#aa22ee' : '#a070d0');
    bodyGrad.addColorStop(1, '#4a2080');

    ctx.shadowColor = corruptionLevel > 0.6 ? '#ee00ff' : '#c09eff';
    ctx.shadowBlur = 28 + corruptionLevel * 20 + pulse;
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(x, y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Rim light
    ctx.strokeStyle = `rgba(220,180,255,${0.4 + corruptionLevel * 0.3})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(x, y, player.radius, Math.PI * 1.3, Math.PI * 2.3);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#f0e8ff';
    ctx.beginPath(); ctx.ellipse(x - 5, y - 4, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 5, y - 4, 5, 4, 0, 0, Math.PI * 2); ctx.fill();

    // Pupils — shift with corruption
    const pupilColor = corruptionLevel > 0.7 ? '#ff00aa' : '#2a0a4a';
    ctx.fillStyle = pupilColor;
    ctx.shadowColor = pupilColor;
    ctx.shadowBlur = corruptionLevel > 0.7 ? 8 : 0;
    ctx.beginPath(); ctx.arc(x - 5, y - 4, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 5, y - 4, 2.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  // ── Particles ─────────────────────────────────────────────────────────────

  private drawParticles(ctx: CanvasRenderingContext2D, particles: readonly Particle[]): void {
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.size * 3;
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Vignette ──────────────────────────────────────────────────────────────

  private drawVignette(
    ctx: CanvasRenderingContext2D,
    player: PlayerEntity,
    camera: Camera,
    corruption: CorruptionState,
    W: number,
    H: number,
  ): void {
    const screenPos = camera.worldToScreen(player.position, W, H);
    const scaleX = W / camera.viewWidth;
    const radiusPx = corruption.visionRadius * scaleX;

    // Inner bright zone
    const gradient = ctx.createRadialGradient(
      screenPos.x, screenPos.y, radiusPx * 0.15,
      screenPos.x, screenPos.y, radiusPx * 1.3,
    );
    gradient.addColorStop(0, 'rgba(15,8,24,0)');
    gradient.addColorStop(0.55, `rgba(5,2,10,${0.75 + corruption.level * 0.15})`);
    gradient.addColorStop(1, '#04010a');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Heavy corruption — tint the entire screen purple-red
    if (corruption.level > 0.7) {
      const tintAlpha = (corruption.level - 0.7) * 0.25;
      ctx.fillStyle = `rgba(80,0,60,${tintAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ── Interaction hint ──────────────────────────────────────────────────────

  drawInteractionHint(
    ctx: CanvasRenderingContext2D,
    player: PlayerEntity,
    camera: Camera,
    W: number,
    H: number,
    elapsed: number,
  ): void {
    const sp = camera.worldToScreen(player.position, W, H);
    const pulse = 0.7 + Math.sin(elapsed * 4) * 0.3;
    const fontSize = Math.max(12, Math.floor(W / 52));

    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#d4b5ff';
    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#8800ff';
    ctx.shadowBlur = 14;
    ctx.fillText('[ E ] STEAL MEMORY', sp.x, sp.y - (50 * H / 600));
    ctx.restore();
  }
}
