// src/core/World.ts
// ─────────────────────────────────────────────────────────────
// The World owns all live entities and wires system update calls.
// This is the heart of the ECS-inspired architecture.
// RenderSystem is driven from outside (main.ts) with interpolation.
// ─────────────────────────────────────────────────────────────
import { createPlayer, createNpcFromSeed } from '@entities/EntityFactory.js';
import { NPC_SEEDS, MAP_WALLS } from '@data/WorldData.js';
import { PhysicsSystem } from '@systems/PhysicsSystem.js';
import { AISystem } from '@systems/AISystem.js';
import { InteractionSystem } from '@systems/InteractionSystem.js';
import { CorruptionSystem } from '@systems/CorruptionSystem.js';
import { DialogueSystem } from '@systems/DialogueSystem.js';
import { EffectSystem } from '@systems/EffectSystem.js';
import { AudioSystem } from '@systems/AudioSystem.js';
import { RenderSystem } from '@systems/RenderSystem.js';
import { InputSystem } from '@systems/InputSystem.js';
import { GameLoop } from './GameLoop.js';
import { getState } from './GameState.js';
import { CONFIG } from './GameConfig.js';
import { bus } from './EventBus.js';
export class World {
    // Entities
    player;
    npcs;
    // Systems
    physics;
    ai;
    dialogue;
    corruption;
    effects;
    audio;
    render;
    input;
    interaction;
    loop;
    constructor(canvas) {
        this.physics = new PhysicsSystem(MAP_WALLS);
        this.dialogue = new DialogueSystem();
        this.corruption = new CorruptionSystem();
        this.effects = new EffectSystem();
        this.audio = new AudioSystem();
        this.render = new RenderSystem(canvas, this.effects);
        this.input = new InputSystem(canvas);
        this.ai = new AISystem(this.physics);
        this.interaction = new InteractionSystem(this.dialogue, this.corruption);
    }
    async init() {
        // Init systems that need async setup
        await this.render.init(MAP_WALLS);
        // Init event-driven systems
        this.dialogue.init();
        this.effects.init();
        this.audio.init();
        this.interaction.init();
        this.input.init();
        // Spawn entities
        this.spawnEntities();
        this.render.initNpcs(this.npcs);
        // Game loop
        this.loop = new GameLoop((dt) => this.update(dt), (interp) => this.renderFrame(interp), { fixedStep: 1 / 60, maxDelta: 0.1 });
        // Unlock audio on first interaction
        const unlockAudio = () => {
            this.audio.unlock();
            window.removeEventListener('pointerdown', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
        window.addEventListener('pointerdown', unlockAudio, { once: true });
        window.addEventListener('keydown', unlockAudio, { once: true });
    }
    // ── Entity spawning ────────────────────────────────────────────
    spawnEntities() {
        this.player = createPlayer();
        this.npcs = NPC_SEEDS.map(createNpcFromSeed);
    }
    // ── Start game session ─────────────────────────────────────────
    startSession() {
        // Reset entities
        this.spawnEntities();
        this.render.initNpcs(this.npcs);
        // Reset state
        getState().reset();
        // Start loop
        this.loop.stop();
        this.loop.start();
    }
    // ── Fixed-step update ──────────────────────────────────────────
    update(dt) {
        const state = getState();
        if (state.phase !== 'playing')
            return;
        // ── Movement ────────────────────────────────────────────────
        const { input } = state;
        let dx = 0, dy = 0;
        if (input.up)
            dy -= 1;
        if (input.down)
            dy += 1;
        if (input.left)
            dx -= 1;
        if (input.right)
            dx += 1;
        // Joystick blends with DPAD
        if (Math.abs(input.joystick.x) > 0.1)
            dx = input.joystick.x;
        if (Math.abs(input.joystick.y) > 0.1)
            dy = input.joystick.y;
        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            let ndx = (dx / len) * CONFIG.player.speed * dt;
            let ndy = (dy / len) * CONFIG.player.speed * dt;
            // Invert controls effect
            if (state.invertControls) {
                ndx = -ndx;
                ndy = -ndy;
            }
            this.physics.moveEntity(this.player, ndx, ndy);
        }
        // ── AI ──────────────────────────────────────────────────────
        this.ai.update(this.npcs, this.player, dt);
        // Prevent NPC stacking
        this.physics.separateEntities([...this.npcs]);
        // ── Interaction proximity check ─────────────────────────────
        this.interaction.update(this.player, this.npcs);
        // ── Corruption ambient glitch ───────────────────────────────
        this.corruption.update(dt);
        // ── Audio ambient update (every ~1s equiv) ──────────────────
        this.audio.updateAmbient();
        // ── Effects update ──────────────────────────────────────────
        const px = this.player.transform.position.x;
        const py = this.player.transform.position.y;
        this.effects.update(dt, px, py);
    }
    // ── Render frame ───────────────────────────────────────────────
    renderFrame(interp) {
        const state = getState();
        if (state.phase === 'ending')
            return;
        this.render.render(this.player, this.npcs, state.nearbyNpcId, interp);
    }
    // ── STEAL button handler (called by UI) ────────────────────────
    handleStealAction() {
        this.audio.unlock();
        this.interaction.performSteal(this.player, this.npcs);
    }
    // ── Dialogue dismiss (called by UI) ───────────────────────────
    handleDialogueDismiss() {
        if (this.dialogue.active) {
            this.dialogue.dismiss();
            bus.emit('ui:hideDialogue', undefined);
        }
    }
    stop() {
        this.loop.stop();
    }
    destroy() {
        this.loop.stop();
        this.input.destroy();
        this.audio.destroy();
        this.render.destroy();
        bus.clear();
    }
}
