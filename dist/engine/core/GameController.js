import { GameLoop } from '@engine/core/GameLoop';
import { Camera } from '@engine/core/Camera';
import { RenderSystem } from '@engine/systems/RenderSystem';
import { InputSystem } from '@engine/systems/InputSystem';
import { AudioSystem } from '@engine/systems/AudioSystem';
import { DialogueSystem } from '@engine/systems/DialogueSystem';
import { ParticleSystem } from '@engine/systems/ParticleSystem';
import { updateNPCBehavior } from '@engine/systems/AISystem';
import { createGlitchState, triggerGlitch, updateGlitch, } from '@engine/systems/GlitchSystem';
import { applyMemorySteal, updateCorruptionTimers, } from '@engine/systems/CorruptionSystem';
import { createPlayer, createNPC } from '@engine/entities/EntityFactory';
import { WORLD, resolveWallSlide } from '@engine/core/WorldMap';
import { vec2 } from '@utils/vec2';
import { NPC_SPAWN_DATA } from '@data/npcData';
import { resolveEnding, shouldTriggerEnding } from '@data/endingData';
import { useGameStore } from '@state/gameStore';
export class GameController {
    canvas;
    loop;
    renderer;
    camera;
    input;
    audio;
    dialogue;
    particles;
    player;
    npcs;
    corruption;
    glitch;
    elapsed = 0;
    glitchAccumulator = 0;
    // Random glitch interval tracking
    nextGlitchIn = 3;
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new RenderSystem(canvas);
        this.camera = new Camera(WORLD.width, WORLD.height, WORLD.width, WORLD.height);
        this.input = new InputSystem();
        this.audio = new AudioSystem();
        this.dialogue = new DialogueSystem();
        this.particles = new ParticleSystem();
        this.player = createPlayer({ x: 400, y: 300 });
        this.npcs = NPC_SPAWN_DATA.map(d => createNPC(d.position, d.memory));
        this.corruption = useGameStore.getState().corruption;
        this.glitch = createGlitchState();
        this.loop = new GameLoop(this.update.bind(this), this.render.bind(this));
    }
    start() {
        this.input.attach();
        this.audio.init();
        this.camera.reset(this.player.position);
        this.loop.start();
    }
    stop() {
        this.loop.stop();
        this.input.detach();
        this.audio.destroy();
    }
    reset() {
        this.player = createPlayer({ x: 400, y: 300 });
        this.npcs = NPC_SPAWN_DATA.map(d => createNPC(d.position, d.memory));
        this.glitch = createGlitchState();
        this.elapsed = 0;
        this.glitchAccumulator = 0;
        this.nextGlitchIn = 3;
        this.particles.clear();
        this.camera.reset(this.player.position);
        this.corruption = useGameStore.getState().corruption;
        this.loop.reset();
    }
    getInputSystem() {
        return this.input;
    }
    // ── Update ────────────────────────────────────────────────────────────────
    update(dt, elapsed) {
        this.elapsed = elapsed;
        const store = useGameStore.getState();
        if (store.phase !== 'playing')
            return;
        this.corruption = updateCorruptionTimers(this.corruption, dt);
        store.setCorruption(this.corruption);
        this.handleMovement(dt);
        this.updateNPCs(dt);
        this.checkInteraction();
        this.particles.update(dt);
        this.camera.follow(this.player.position);
        this.camera.update(dt);
        this.glitch = updateGlitch(this.glitch, dt);
        // Ambient particles from nearby active NPCs
        for (const npc of this.npcs) {
            if (npc.state !== 'stolen')
                this.particles.ambient(npc.position);
        }
        // Random corruption glitches
        if (this.corruption.level > 0.2) {
            this.glitchAccumulator += dt;
            if (this.glitchAccumulator >= this.nextGlitchIn) {
                this.glitchAccumulator = 0;
                this.nextGlitchIn = 2 + Math.random() * 4 * (1 - this.corruption.level);
                if (Math.random() < this.corruption.level) {
                    this.doGlitch();
                }
            }
        }
        // NPC nearby hint
        store.setNpcNearby(this.getNearbyNPCIndex() !== -1);
    }
    handleMovement(dt) {
        const inputState = this.input.getState();
        let dir = vec2.clone(inputState.joystick);
        if (this.corruption.invertControls) {
            dir = vec2.scale(dir, -1);
        }
        if (vec2.lengthSq(dir) > 0.01) {
            const normalized = vec2.normalize(dir);
            const delta = vec2.scale(normalized, this.player.speed * dt);
            const desired = vec2.add(this.player.position, delta);
            const resolved = resolveWallSlide(WORLD.walls, this.player.position, desired, this.player.radius);
            // Clamp to world
            this.player = {
                ...this.player,
                position: {
                    x: Math.max(20 + this.player.radius, Math.min(WORLD.width - 20 - this.player.radius, resolved.x)),
                    y: Math.max(20 + this.player.radius, Math.min(WORLD.height - 20 - this.player.radius, resolved.y)),
                },
                facing: normalized,
            };
        }
    }
    updateNPCs(dt) {
        this.npcs = this.npcs.map(npc => updateNPCBehavior(npc, this.player, dt));
    }
    checkInteraction() {
        const store = useGameStore.getState();
        if (store.phase !== 'playing')
            return;
        if (!this.input.consumeInteract())
            return;
        const idx = this.getNearbyNPCIndex();
        if (idx === -1)
            return;
        this.stealMemory(idx);
    }
    getNearbyNPCIndex() {
        for (let i = 0; i < this.npcs.length; i++) {
            const npc = this.npcs[i];
            if (npc.state !== 'stolen' && vec2.distance(this.player.position, npc.position) < 50) {
                return i;
            }
        }
        return -1;
    }
    stealMemory(index) {
        const npc = this.npcs[index];
        this.npcs[index] = { ...npc, state: 'stolen' };
        const store = useGameStore.getState();
        store.incrementMemories();
        // Read count after increment (Zustand state is synchronous)
        const newCount = useGameStore.getState().memoriesStolen;
        this.corruption = applyMemorySteal(this.corruption, newCount);
        store.setCorruption(this.corruption);
        this.audio.playMemorySteal();
        this.audio.setCorruptionLevel(this.corruption.level);
        this.doGlitch();
        this.camera.triggerShake(6 + this.corruption.level * 10, 0.35);
        this.particles.burst(npc.position, 20 + Math.floor(this.corruption.level * 20), '#c9a0ff');
        this.dialogue.open(npc.memory, this.corruption.level, () => {
            store.closeDialogue();
            this.checkEndCondition(newCount);
        });
        store.openDialogue(this.dialogue.getLine());
    }
    checkEndCondition(count) {
        const allExhausted = this.npcs.every(n => n.state === 'stolen');
        if (shouldTriggerEnding(count, allExhausted)) {
            setTimeout(() => {
                const endType = resolveEnding(count);
                useGameStore.getState().triggerEnding(endType);
                this.loop.stop();
            }, 800);
        }
    }
    doGlitch() {
        this.glitch = triggerGlitch(this.glitch, this.corruption.glitchIntensity);
        this.audio.playGlitch();
    }
    // ── Render ────────────────────────────────────────────────────────────────
    render() {
        const store = useGameStore.getState();
        if (store.phase === 'menu' || store.phase === 'ending')
            return;
        this.renderer.render(this.player, this.npcs, this.particles.getActive(), this.camera, this.corruption, this.glitch, this.elapsed);
        // Interaction hint (screen-space)
        if (store.npcNearby && store.phase === 'playing') {
            this.renderer.drawInteractionHint(this.canvas.getContext('2d'), this.player, this.camera, this.canvas.width, this.canvas.height, this.elapsed);
        }
    }
}
