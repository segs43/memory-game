function corruptText(text, intensity = 0.25) {
    const glyphs = '█▓▒░▄▀■□●○◆◇';
    return text
        .split('')
        .map(c => (Math.random() < intensity ? glyphs[Math.floor(Math.random() * glyphs.length)] : c))
        .join('');
}
const RAW_MEMORIES = [
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
export const NPC_SPAWN_DATA = RAW_MEMORIES.map(m => ({
    position: m.position,
    memory: {
        text: m.text,
        corruptedText: corruptText(m.text, 0.3),
        emotionTag: m.emotionTag,
    },
}));
