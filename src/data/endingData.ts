import type { EndingType } from '@types-game/game';

const DARK_THRESHOLD = 5;       // stolen all 5
const TRUE_ENDING_STEAL = 4;    // steal exactly 4 (leave one)

export interface EndingResult {
  type: EndingType;
  title: string;
  description: string;
}

export const ENDINGS: Record<EndingType, EndingResult> = {
  dark: {
    type: 'dark',
    title: '🌑 DARK ENDING',
    description: 'You stole every memory. The void consumes what remains of you. There is nothing left to feel.',
  },
  incomplete: {
    type: 'incomplete',
    title: '📖 INCOMPLETE TRUTH',
    description: 'The full truth remains buried beneath the silence. Some memories were not meant to be stolen.',
  },
  true: {
    type: 'true',
    title: '🪞 TRUE ENDING',
    description: 'You remembered what you took. The last memory was your own. You stood over yourself — and chose to stop.',
  },
};

export function resolveEnding(memoriesStolen: number): EndingType {
  if (memoriesStolen >= DARK_THRESHOLD) return 'dark';
  if (memoriesStolen === TRUE_ENDING_STEAL) return 'true';
  return 'incomplete';
}

export function shouldTriggerEnding(memoriesStolen: number, allNPCsExhausted: boolean): boolean {
  return memoriesStolen >= DARK_THRESHOLD || allNPCsExhausted;
}
