import { eventBus } from '@engine/core/EventBus';
const CORRUPT_GLYPHS = '█▓▒░▄▀■□●○◆◇⣿⢿⡿';
function distortText(text, intensity) {
    return text
        .split('')
        .map(c => (Math.random() < intensity ? CORRUPT_GLYPHS[Math.floor(Math.random() * CORRUPT_GLYPHS.length)] : c))
        .join('');
}
export class DialogueSystem {
    activeLine = null;
    onClose = null;
    open(memory, corruptionLevel, onClose) {
        const isCorrupted = corruptionLevel > 0.4;
        const text = isCorrupted
            ? distortText(memory.text, corruptionLevel * 0.4)
            : memory.text;
        this.activeLine = {
            text,
            speaker: memory.emotionTag,
            corrupted: isCorrupted,
        };
        this.onClose = onClose ?? null;
        eventBus.emit('DIALOGUE_OPEN', this.activeLine);
    }
    close() {
        this.activeLine = null;
        eventBus.emit('DIALOGUE_CLOSE', null);
        this.onClose?.();
        this.onClose = null;
    }
    isOpen() {
        return this.activeLine !== null;
    }
    getLine() {
        return this.activeLine;
    }
}
