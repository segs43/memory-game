import type { NPCMemory, Vec2 } from '@types-game/game';

export interface NPCSpawnData {
  position: Vec2;
  memory: NPCMemory;
}

function corruptText(text: string, intensity = 0.25): string {
  const glyphs = '█▓▒░▄▀■□●○◆◇';
  return text
    .split('')
    .map(c => (Math.random() < intensity ? glyphs[Math.floor(Math.random() * glyphs.length)] : c))
    .join('');
}

const RAW_MEMORIES: Array<{ text: string; emotionTag: string; position: Vec2 }> = [
  {
    text: "🌙 A child's laughter... was it mine?",
    emotionTag: '🌙',
    position: { x: 120, y: 120 },
  },
  {
    text: '🗝️ A key. A basement. Something buried deep.',
    emotionTag: '🗝️',
    position: { x: 650, y: 150 },
  },
  {
    text: "💉 They called me 'doctor'... but I remember pain.",
    emotionTag: '💉',
    position: { x: 350, y: 320 },
  },
  {
    text: '💔 You erased her... why?',
    emotionTag: '💔',
    position: { x: 680, y: 480 },
  },
  {
    text: '🪞 The last memory: you standing over yourself.',
    emotionTag: '🪞',
    position: { x: 150, y: 520 },
  },
];

export const NPC_SPAWN_DATA: NPCSpawnData[] = RAW_MEMORIES.map(m => ({
  position: m.position,
  memory: {
    text: m.text,
    corruptedText: corruptText(m.text, 0.3),
    emotionTag: m.emotionTag,
  },
}));
