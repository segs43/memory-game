import type { DialogueLine, NPCMemory } from '@types-game/game';
import { eventBus } from '@engine/core/EventBus';

const CORRUPT_GLYPHS = '█▓▒░▄▀■□●○◆◇⣿⢿⡿';

function distortText(text: string, intensity: number): string {
  return text
    .split('')
    .map(c => (Math.random() < intensity ? CORRUPT_GLYPHS[Math.floor(Math.random() * CORRUPT_GLYPHS.length)] : c))
    .join('');
}

export class DialogueSystem {
  private activeLine: DialogueLine | null = null;
  private onClose: (() => void) | null = null;

  open(memory: NPCMemory, corruptionLevel: number, onClose?: () => void): void {
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

  close(): void {
    this.activeLine = null;
    eventBus.emit('DIALOGUE_CLOSE', null);
    this.onClose?.();
    this.onClose = null;
  }

  isOpen(): boolean {
    return this.activeLine !== null;
  }

  getLine(): DialogueLine | null {
    return this.activeLine;
  }
}
