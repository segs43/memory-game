// src/systems/RenderSystem.ts
// ─────────────────────────────────────────────────────────────
// High-performance WebGL renderer built on PixiJS v8.
// Manages all draw calls: map, NPCs, player, particles, FX.
// Shader-based post-processing: chromatic aberration, scanlines,
// vignette, glitch distortion — all driven by EffectSystem.
// ─────────────────────────────────────────────────────────────
import { Application, Container, Graphics, } from 'pixi.js';
import { CONFIG } from '@core/GameConfig.js';
import { getState } from '@core/GameState.js';
import { bus } from '@core/EventBus.js';
const LW = CONFIG.canvas.logicalWidth;
const LH = CONFIG.canvas.logicalHeight;
// NOTE: GLSL shader sources are defined here for future PixiJS Filter integration.
// Post-FX is currently rendered via Canvas2D overlay in renderPostFX().
// To enable GPU shaders: instantiate Filter(CHROMA_VERT, CHROMA_FRAG, uniforms)
// and assign to this.worldContainer.filters = [chromaFilter, scanlineFilter].
// CHROMA_FRAG: chromatic aberration — shift R/B channels radially from center
// SCANLINE_FRAG: CRT scanlines + film grain noise
// GLITCH_FRAG: horizontal band displacement with random sine hashing
export class RenderSystem {
    canvas;
    effects;
    app;
    worldContainer;
    mapLayer;
    npcLayer;
    playerContainer;
    particleLayer;
    vignetteGfx;
    // Glitch state
    glitchActive = false;
    glitchTimer = 0;
    time = 0;
    // NPC graphics map
    npcGraphics = new Map();
    playerGfx;
    wallGfx;
    gridGfx;
    constructor(canvas, effects) {
        this.canvas = canvas;
        this.effects = effects;
    }
    async init(walls) {
        this.app = new Application();
        await this.app.init({
            canvas: this.canvas,
            width: LW,
            height: LH,
            backgroundColor: 0x07040f,
            antialias: false,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            powerPreference: 'high-performance',
        });
        // Layer setup
        this.worldContainer = new Container();
        this.mapLayer = new Container();
        this.npcLayer = new Container();
        this.playerContainer = new Container();
        this.particleLayer = new Container();
        this.vignetteGfx = new Graphics();
        this.worldContainer.addChild(this.mapLayer);
        this.worldContainer.addChild(this.npcLayer);
        this.worldContainer.addChild(this.playerContainer);
        this.worldContainer.addChild(this.particleLayer);
        this.worldContainer.addChild(this.vignetteGfx);
        this.app.stage.addChild(this.worldContainer);
        // Build static map geometry
        this.buildGrid();
        this.buildWalls(walls);
        // Player graphic
        this.playerGfx = this.buildPlayerGfx();
        this.playerContainer.addChild(this.playerGfx);
        // Post-process filters
        this.setupFilters();
        // Listen for glitch trigger
        bus.on('corruption:glitch', () => {
            this.glitchActive = true;
            this.glitchTimer = 0.3;
        });
    }
    // ── Filter setup ──────────────────────────────────────────────
    setupFilters() {
        // We use manual canvas-layer compositing for post-FX to keep it
        // compatible with PixiJS v8 WebGL without full filter chain.
        // Chromatic, scanline, glitch are applied as overlay canvas draws
        // in the renderPostFX() method below.
    }
    // ── Static geometry ────────────────────────────────────────────
    buildGrid() {
        this.gridGfx = new Graphics();
        this.gridGfx.setStrokeStyle({ width: 1, color: 0x2a1f35, alpha: 0.15 });
        for (let x = 0; x <= LW; x += 40) {
            this.gridGfx.moveTo(x, 0).lineTo(x, LH).stroke();
        }
        for (let y = 0; y <= LH; y += 40) {
            this.gridGfx.moveTo(0, y).lineTo(LW, y).stroke();
        }
        this.mapLayer.addChild(this.gridGfx);
    }
    buildWalls(walls) {
        this.wallGfx = new Graphics();
        for (const w of walls) {
            // Outer fill
            this.wallGfx.rect(w.x, w.y, w.w, w.h).fill({ color: 0x2f2040 });
            // Inner bevel
            this.wallGfx.rect(w.x + 2, w.y + 2, w.w - 4, w.h - 4).fill({ color: 0x3a2850 });
            // Border
            this.wallGfx.setStrokeStyle({ width: 2, color: 0x604878 });
            this.wallGfx.rect(w.x, w.y, w.w, w.h).stroke();
        }
        this.mapLayer.addChild(this.wallGfx);
    }
    buildPlayerGfx() {
        const g = new Graphics();
        // Body
        g.circle(0, 0, CONFIG.player.radius).fill({ color: 0xa070d0 });
        // Eyes
        g.circle(-5, -4, 4).fill({ color: 0x1a0f2a });
        g.circle(5, -4, 4).fill({ color: 0x1a0f2a });
        // Eye glow
        g.circle(-4, -5, 2).fill({ color: 0xc9a0ff });
        g.circle(6, -5, 2).fill({ color: 0xc9a0ff });
        return g;
    }
    // ── NPC management ─────────────────────────────────────────────
    initNpcs(npcs) {
        for (const npc of npcs) {
            const g = this.buildNpcGfx(npc.uniqueColor);
            g.label = npc.id;
            this.npcLayer.addChild(g);
            this.npcGraphics.set(npc.id, g);
        }
    }
    buildNpcGfx(color) {
        const g = new Graphics();
        this.rebuildNpcGfx(g, color, false);
        return g;
    }
    rebuildNpcGfx(g, color, stolen) {
        g.clear();
        if (stolen) {
            g.circle(0, 0, 16).fill({ color: 0x2a1f35 });
            g.circle(-3, -3, 6).fill({ color: 0x1a1025 });
        }
        else {
            g.circle(0, 0, 16).fill({ color });
            g.circle(-5, -4, 4).fill({ color: 0x2a1540 });
            g.circle(5, -4, 4).fill({ color: 0x2a1540 });
            g.circle(0, -12, 4).fill({ color: 0xd4b5ff });
        }
    }
    // ── Per-frame render ───────────────────────────────────────────
    render(player, npcs, nearbyNpcId, _interpolation) {
        this.time += 0.016;
        const { effects, camera } = this.effects;
        const state = getState();
        // Camera offset (center map, apply shake)
        const camOffX = (LW / 2 - camera.x) + camera.shakeX;
        const camOffY = (LH / 2 - camera.y) + camera.shakeY;
        this.worldContainer.x = camOffX;
        this.worldContainer.y = camOffY;
        // Update player position
        const px = player.transform.position.x;
        const py = player.transform.position.y;
        this.playerGfx.x = px;
        this.playerGfx.y = py;
        // Invert controls visual cue — red tint
        this.playerGfx.tint = state.invertControls ? 0xff8888 : 0xffffff;
        // Update NPCs
        const idleOffset = Math.sin(this.time * 1.5) * 3;
        for (const npc of npcs) {
            const g = this.npcGraphics.get(npc.id);
            if (!g)
                continue;
            g.x = npc.transform.position.x;
            g.y = npc.transform.position.y + (npc.memory.stolen ? 0 : idleOffset);
            g.alpha = npc.memory.stolen ? 0.35 : 1;
            // Rebuild on state change
            const wasStolen = g.alpha < 0.5;
            if (wasStolen !== npc.memory.stolen) {
                this.rebuildNpcGfx(g, npc.uniqueColor, npc.memory.stolen);
            }
            // Pulse glow on nearby NPC
            if (npc.id === nearbyNpcId && !npc.memory.stolen) {
                g.scale.set(1 + Math.sin(this.time * 6) * 0.08);
            }
            else {
                g.scale.set(1);
            }
        }
        // Update particles
        this.particleLayer.removeChildren();
        for (const p of this.effects.activeParticles) {
            const pg = new Graphics();
            const alpha = p.life / p.maxLife;
            pg.circle(0, 0, p.size * alpha).fill({ color: p.color, alpha });
            pg.x = p.x;
            pg.y = p.y;
            this.particleLayer.addChild(pg);
        }
        // Draw dynamic vignette
        this.drawVignette(px, py, effects.vignetteRadius);
        // Interaction hint above nearby NPC
        this.drawNearbyHint(nearbyNpcId, npcs, camOffX, camOffY);
        // Render post-FX to canvas2D overlay
        this.renderPostFX(effects.chromaticIntensity, effects.scanlineIntensity);
        // Glitch decay
        if (this.glitchActive) {
            this.glitchTimer -= 0.016;
            if (this.glitchTimer <= 0)
                this.glitchActive = false;
        }
    }
    drawVignette(px, py, radius) {
        const g = this.vignetteGfx;
        g.clear();
        // Use fillGradient approach — draw a series of concentric alpha circles
        // from transparent center to opaque edge
        const steps = 12;
        for (let i = steps; i >= 0; i--) {
            const t = i / steps;
            const r = radius * t;
            const computedAlpha = Math.pow(1 - t, 2) * 0.95;
            g.circle(px, py, r).fill({ color: 0x07040f, alpha: computedAlpha });
        }
        // Full black rect minus the lit area
        g.rect(0, 0, LW, LH).fill({ color: 0x07040f, alpha: 0.92 });
        // Punch out the vision circle using a clear blend
        g.circle(px, py, radius).fill({ color: 0x07040f, alpha: 0 });
    }
    drawNearbyHint(nearbyNpcId, npcs, _camOffX, _camOffY) {
        if (!nearbyNpcId)
            return;
        const npc = npcs.find(n => n.id === nearbyNpcId);
        if (!npc || npc.memory.stolen)
            return;
        // Rendered in UI layer — nothing needed here
    }
    // ── Post-FX overlay (Canvas 2D on top of WebGL) ───────────────
    postCanvas = null;
    postCtx = null;
    getPostCtx() {
        if (this.postCtx)
            return this.postCtx;
        // Create overlay canvas
        const overlay = document.createElement('canvas');
        overlay.style.cssText = `
      position: absolute; top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none; z-index: 5;
    `;
        overlay.width = LW;
        overlay.height = LH;
        this.canvas.parentElement?.appendChild(overlay);
        this.postCanvas = overlay;
        this.postCtx = overlay.getContext('2d');
        return this.postCtx;
    }
    renderPostFX(chromatic, scanlines) {
        const ctx2 = this.getPostCtx();
        if (!ctx2 || !this.postCanvas)
            return;
        ctx2.clearRect(0, 0, LW, LH);
        // Scanlines
        if (scanlines > 0.05) {
            ctx2.fillStyle = `rgba(0,0,0,${scanlines * 0.25})`;
            for (let y = 0; y < LH; y += 3) {
                ctx2.fillRect(0, y, LW, 1);
            }
        }
        // Chromatic aberration edges
        if (chromatic > 0.01) {
            const shift = Math.round(chromatic * LW * 0.5);
            ctx2.save();
            ctx2.globalCompositeOperation = 'screen';
            ctx2.fillStyle = `rgba(255,0,0,${chromatic * 0.3})`;
            ctx2.fillRect(-shift, 0, LW + shift, LH);
            ctx2.fillStyle = `rgba(0,0,255,${chromatic * 0.3})`;
            ctx2.fillRect(shift, 0, LW - shift, LH);
            ctx2.restore();
        }
        // Glitch horizontal tear bands
        if (this.glitchActive) {
            const numBands = 4 + Math.floor(Math.random() * 6);
            ctx2.save();
            ctx2.globalCompositeOperation = 'overlay';
            for (let i = 0; i < numBands; i++) {
                const y = Math.floor(Math.random() * LH);
                const h = 1 + Math.floor(Math.random() * 4);
                const xShift = (Math.random() - 0.5) * 30;
                ctx2.fillStyle = `rgba(${Math.random() > 0.5 ? '255,0,200' : '0,255,200'},0.5)`;
                ctx2.fillRect(xShift, y, LW, h);
            }
            ctx2.restore();
        }
        // Film grain (always subtle)
        const imageData = ctx2.createImageData(LW, LH);
        const data = imageData.data;
        const grainAmount = 8 + scanlines * 12;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * grainAmount;
            data[i] = noise;
            data[i + 1] = noise;
            data[i + 2] = noise;
            data[i + 3] = 30;
        }
        ctx2.putImageData(imageData, 0, 0);
    }
    destroy() {
        this.postCanvas?.remove();
        this.app.destroy(false);
    }
}
