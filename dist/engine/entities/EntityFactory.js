import { vec2 } from '@utils/vec2';
let _idCounter = 0;
const uid = () => `entity_${++_idCounter}`;
export function createPlayer(position) {
    return {
        id: uid(),
        position: vec2.clone(position),
        radius: 14,
        speed: 180, // pixels/sec
        facing: { x: 0, y: 1 },
    };
}
export function createNPC(position, memory) {
    return {
        id: uid(),
        position: vec2.clone(position),
        radius: 16,
        state: 'idle',
        memory,
        idlePhase: Math.random() * Math.PI * 2,
        idleAmplitude: 3 + Math.random() * 2,
        alertRadius: 120,
        wanderTarget: null,
        wanderTimer: 0,
    };
}
