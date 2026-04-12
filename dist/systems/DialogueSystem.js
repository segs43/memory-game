// src/systems/DialogueSystem.ts
// ─────────────────────────────────────────────────────────────
// Manages dialogue display with corruption-aware text corruption.
// Characters randomly replaced with glitch symbols based on tier.
// ─────────────────────────────────────────────────────────────
import { bus } from '@core/EventBus.js';
import { getState } from '@core/GameState.js';
const GLITCH_CHARS = ['█', '▓', '▒', '░', '▀', '▄', '■', '◼', '▪', '◆'];
export class DialogueSystem {
    _active = false;
    get active() { return this._active; }
    init() {
        bus.on('ui:hideDialogue', () => {
            this._active = false;
        });
    }
    /**
     * Show memory text for the given NPC.
     * Corruption level determines how many characters are replaced.
     */
    showMemory(npc) {
        const { memoriesStolen } = getState();
        const raw = memoriesStolen >= npc.memory.corruptionThreshold
            ? npc.memory.corruptedText ?? npc.memory.text
            : npc.memory.text;
        const text = this.applyCorruption(raw, memoriesStolen);
        this._active = true;
        bus.emit('ui:showDialogue', { text });
    }
    /**
     * Progressively corrupt text based on memories stolen count.
     */
    applyCorruption(text, memoriesStolen) {
        if (memoriesStolen < 2)
            return text;
        // Corruption rate ramps from ~5% at 2 stolen to ~40% at 6
        const rate = Math.min(0.4, (memoriesStolen - 1) * 0.07);
        return text
            .split('')
            .map((char) => {
            if (char === ' ' || char === '\n')
                return char;
            if (Math.random() < rate) {
                const idx = Math.floor(Math.random() * GLITCH_CHARS.length);
                return GLITCH_CHARS[idx] ?? char;
            }
            return char;
        })
            .join('');
    }
    dismiss() {
        if (!this._active)
            return;
        this._active = false;
        bus.emit('ui:hideDialogue', undefined);
    }
}
