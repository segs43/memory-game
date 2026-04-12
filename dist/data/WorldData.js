// src/data/WorldData.ts
// ─────────────────────────────────────────────────────────────
// All map geometry and NPC seed data in one data-driven file.
// Adding new NPCs or rooms only requires editing here.
// ─────────────────────────────────────────────────────────────
// ── Map walls ─────────────────────────────────────────────────
// Format: { x, y, w, h } in logical 800×600 space
export const MAP_WALLS = [
    // Outer boundary
    { x: 0, y: 0, w: 800, h: 20 },
    { x: 0, y: 580, w: 800, h: 20 },
    { x: 0, y: 0, w: 20, h: 600 },
    { x: 780, y: 0, w: 20, h: 600 },
    // Inner architecture — rooms and corridors
    { x: 200, y: 100, w: 20, h: 160 },
    { x: 200, y: 330, w: 20, h: 100 },
    { x: 550, y: 190, w: 160, h: 20 },
    { x: 350, y: 370, w: 20, h: 160 },
    { x: 100, y: 440, w: 140, h: 20 },
    { x: 600, y: 390, w: 20, h: 140 },
    { x: 420, y: 100, w: 20, h: 120 },
    { x: 650, y: 300, w: 100, h: 20 },
    { x: 100, y: 280, w: 80, h: 20 },
];
// ── Spawn points ───────────────────────────────────────────────
export const PLAYER_SPAWN = { x: 400, y: 300 };
// ── NPC seed data ──────────────────────────────────────────────
export const NPC_SEEDS = [
    {
        id: 'npc-child',
        spawnPosition: { x: 120, y: 120 },
        memory: "🌙 A child's laughter... was it mine?",
        corruptedMemory: "🌙 A ch██d's la█ghter... was ██ m██e?",
        uniqueColor: 0xc9a0ff,
        patrolPath: [
            { x: 120, y: 120 },
            { x: 170, y: 140 },
            { x: 140, y: 80 },
        ],
        speed: 38,
        fleeRadius: 80,
    },
    {
        id: 'npc-keeper',
        spawnPosition: { x: 660, y: 140 },
        memory: "🗝️ A key. A basement. Something buried deep.",
        corruptedMemory: "🗝️ A k██. A ██sement. S███ething ██ried.",
        uniqueColor: 0xffe080,
        patrolPath: [
            { x: 660, y: 140 },
            { x: 700, y: 160 },
            { x: 680, y: 100 },
        ],
        speed: 42,
        fleeRadius: 90,
    },
    {
        id: 'npc-doctor',
        spawnPosition: { x: 340, y: 310 },
        memory: "💉 They called me 'doctor'... but I remember pain.",
        corruptedMemory: "💉 They cal██d me '██c██r'... bu█ I remem██r p█in.",
        uniqueColor: 0x80ffcc,
        patrolPath: [], // wander AI
        speed: 30,
        fleeRadius: 70,
    },
    {
        id: 'npc-erased',
        spawnPosition: { x: 690, y: 480 },
        memory: "💔 You erased her... why? WHY?",
        corruptedMemory: "💔 You era██d ██r... wh█? W██?",
        uniqueColor: 0xff80b0,
        patrolPath: [
            { x: 690, y: 480 },
            { x: 640, y: 510 },
            { x: 720, y: 520 },
        ],
        speed: 35,
        fleeRadius: 60,
    },
    {
        id: 'npc-mirror',
        spawnPosition: { x: 140, y: 520 },
        memory: "🪞 The last memory: you standing over yourself.",
        corruptedMemory: "🪞 The la██ mem███y: ██u ███nding ov██ ██ur██lf.",
        uniqueColor: 0x00ccff,
        patrolPath: [],
        speed: 25,
        fleeRadius: 100,
    },
    {
        id: 'npc-hidden',
        spawnPosition: { x: 740, y: 300 },
        memory: "⚠️ There is no truth — only what you choose to steal.",
        corruptedMemory: "⚠️ T████ is no t████ — ██ly ████ you ██████ to s████.",
        uniqueColor: 0xff4444,
        patrolPath: [
            { x: 740, y: 300 },
            { x: 760, y: 350 },
            { x: 720, y: 270 },
        ],
        speed: 55,
        fleeRadius: 120,
    },
];
// ── Ending definitions (data-driven) ───────────────────────────
export const ENDING_DATA = {
    dark: {
        title: '🌑 DARK ENDING',
        description: 'Six memories consumed. The void has taken everything you were.\nYou no longer remember your own name.',
        unlockCondition: 'Steal 6 memories',
    },
    incomplete: {
        title: '📖 INCOMPLETE TRUTH',
        description: 'Fragments remain buried. You walked away before the picture was whole.\nThe memories rot without a host.',
        unlockCondition: 'Steal fewer than 6 memories, exhaust all NPCs',
    },
    true: {
        title: '🔮 TRUE ENDING — THE THIEF REMEMBERS',
        description: 'You stole exactly 5 memories — enough to see the truth without being\nconsumed. The mirror NPC was you all along.',
        unlockCondition: 'Steal exactly 5 memories (including the hidden NPC)',
    },
};
