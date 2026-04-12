// src/systems/InteractionSystem.ts
// ─────────────────────────────────────────────────────────────
// Manages player-NPC proximity detection and memory stealing.
// Wires together DialogueSystem, CorruptionSystem, AudioSystem,
// and EffectSystem via events — no direct coupling.
// ─────────────────────────────────────────────────────────────
import { CONFIG } from '@core/GameConfig.js';
import { getState } from '@core/GameState.js';
import { bus } from '@core/EventBus.js';
export class InteractionSystem {
    dialogue;
    corruption;
    previousNearbyId = null;
    constructor(dialogue, corruption) {
        this.dialogue = dialogue;
        this.corruption = corruption;
    }
    init() {
        // Triggered by InputSystem / action button
        bus.on('memory:steal', () => {
            this.attemptSteal();
        });
        bus.on('ui:hideDialogue', () => {
            this.dialogue.dismiss();
        });
    }
    /**
     * Called every fixed tick — updates nearby NPC detection.
     */
    update(player, npcs) {
        const state = getState();
        if (state.phase !== 'playing')
            return;
        const nearbyNpc = this.findNearbyNpc(player, npcs);
        const nearbyId = nearbyNpc?.id ?? null;
        if (nearbyId !== this.previousNearbyId) {
            this.previousNearbyId = nearbyId;
            state.setNearbyNpcId(nearbyId);
            if (nearbyId) {
                bus.emit('player:nearNpc', { npcId: nearbyId });
            }
            else {
                bus.emit('player:leaveNpc', undefined);
            }
        }
    }
    /**
     * Steal memory from the nearest NPC (if in range and not stolen).
     */
    tryStealFromPlayer(player, npcs) {
        const state = getState();
        if (state.phase !== 'playing')
            return;
        if (this.dialogue.active) {
            // Second press closes dialogue
            this.dialogue.dismiss();
            bus.emit('ui:hideDialogue', undefined);
            return;
        }
        this.performSteal(player, npcs);
    }
    attemptSteal() {
        // Signals that the STEAL button was pressed — actual entity context
        // comes from World which calls tryStealFromPlayer directly.
        // This path handles the keyboard/dpad steal action.
    }
    performSteal(player, npcs) {
        const state = getState();
        if (state.phase !== 'playing')
            return;
        if (this.dialogue.active) {
            this.dialogue.dismiss();
            bus.emit('ui:hideDialogue', undefined);
            return;
        }
        const npc = this.findNearbyNpc(player, npcs);
        if (!npc)
            return;
        // Mark stolen
        npc.memory.stolen = true;
        state.setMemoriesStolen(state.memoriesStolen + 1);
        // Show corrupted dialogue
        this.dialogue.showMemory(npc);
        // Spawn particles at NPC position
        bus.emit('effect:particles', {
            x: npc.transform.position.x,
            y: npc.transform.position.y,
            count: 24,
            color: npc.uniqueColor,
        });
        // Emit for CorruptionSystem
        bus.emit('memory:steal', { npc, memoriesStolen: state.memoriesStolen });
        // Apply corruption effects
        this.corruption.onMemoryStolen(npcs);
    }
    findNearbyNpc(player, npcs) {
        const { interactRadius } = CONFIG.player;
        const px = player.transform.position.x;
        const py = player.transform.position.y;
        let closest = null;
        let closestDist = Infinity;
        for (const npc of npcs) {
            if (npc.memory.stolen)
                continue;
            const dx = px - npc.transform.position.x;
            const dy = py - npc.transform.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < interactRadius && dist < closestDist) {
                closestDist = dist;
                closest = npc;
            }
        }
        return closest;
    }
}
