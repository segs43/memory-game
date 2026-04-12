// src/systems/InputSystem.ts
// ─────────────────────────────────────────────────────────────
// Handles keyboard input + advanced mobile virtual joystick.
// Writes normalized input state to GameState store.
// Emits 'player:interact' events for action buttons.
// ─────────────────────────────────────────────────────────────
import { gameStore } from '@core/GameState.js';
import { bus } from '@core/EventBus.js';
export class InputSystem {
    canvas;
    joystick = {
        active: false,
        originId: -1,
        origin: { x: 0, y: 0 },
        current: { x: 0, y: 0 },
    };
    keyMap = {};
    // Virtual D-pad from HTML buttons
    dpadActive = {
        up: false, down: false, left: false, right: false,
    };
    unbindKeyboard = null;
    unbindTouch = null;
    constructor(canvas) {
        this.canvas = canvas;
    }
    init() {
        this.bindKeyboard();
        this.bindTouch();
    }
    destroy() {
        this.unbindKeyboard?.();
        this.unbindTouch?.();
    }
    // Called by UI to register D-pad button state
    setDpadKey(key, active) {
        this.dpadActive[key] = active;
        this.syncState();
    }
    // Called by UI to trigger interact action
    triggerInteract() {
        const state = gameStore.getState();
        if (state.phase !== 'playing')
            return;
        // If dialogue is open, close it
        if (state.phase === 'playing' && state.nearbyNpcId) {
            bus.emit('ui:hideDialogue', undefined);
        }
        else {
            bus.emit('memory:steal', {}); // InteractionSystem listens
        }
    }
    // ── Keyboard ──────────────────────────────────────────────────
    bindKeyboard() {
        const onDown = (e) => {
            this.keyMap[e.code] = true;
            if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') {
                e.preventDefault();
                this.triggerInteract();
            }
            this.syncState();
        };
        const onUp = (e) => {
            this.keyMap[e.code] = false;
            this.syncState();
        };
        window.addEventListener('keydown', onDown);
        window.addEventListener('keyup', onUp);
        this.unbindKeyboard = () => {
            window.removeEventListener('keydown', onDown);
            window.removeEventListener('keyup', onUp);
        };
    }
    // ── Touch joystick ────────────────────────────────────────────
    bindTouch() {
        const onStart = (e) => {
            // Ignore touches on UI elements
            const target = e.target;
            if (target !== this.canvas)
                return;
            e.preventDefault();
            // Dismiss dialogue on tap
            const state = gameStore.getState();
            if (state.phase === 'dialogue') {
                bus.emit('ui:hideDialogue', undefined);
                return;
            }
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                // Only activate joystick from left half of screen
                const rect = this.canvas.getBoundingClientRect();
                const relX = touch.clientX - rect.left;
                if (!this.joystick.active && relX < rect.width * 0.5) {
                    this.joystick = {
                        active: true,
                        originId: touch.identifier,
                        origin: { x: touch.clientX, y: touch.clientY },
                        current: { x: touch.clientX, y: touch.clientY },
                    };
                }
            }
            this.syncState();
        };
        const onMove = (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.joystick.originId) {
                    this.joystick.current = { x: touch.clientX, y: touch.clientY };
                }
            }
            this.syncState();
        };
        const onEnd = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.joystick.originId) {
                    this.joystick = {
                        ...this.joystick,
                        active: false,
                        originId: -1,
                    };
                }
            }
            this.syncState();
        };
        this.canvas.addEventListener('touchstart', onStart, { passive: false });
        this.canvas.addEventListener('touchmove', onMove, { passive: false });
        this.canvas.addEventListener('touchend', onEnd);
        this.canvas.addEventListener('touchcancel', onEnd);
        this.unbindTouch = () => {
            this.canvas.removeEventListener('touchstart', onStart);
            this.canvas.removeEventListener('touchmove', onMove);
            this.canvas.removeEventListener('touchend', onEnd);
            this.canvas.removeEventListener('touchcancel', onEnd);
        };
    }
    // ── Compute joystick vector ────────────────────────────────────
    getJoystickVector() {
        if (!this.joystick.active)
            return { x: 0, y: 0 };
        const DEAD_ZONE = 12;
        const MAX_RANGE = 60;
        const dx = this.joystick.current.x - this.joystick.origin.x;
        const dy = this.joystick.current.y - this.joystick.origin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < DEAD_ZONE)
            return { x: 0, y: 0 };
        const clamped = Math.min(dist, MAX_RANGE);
        return {
            x: (dx / dist) * (clamped / MAX_RANGE),
            y: (dy / dist) * (clamped / MAX_RANGE),
        };
    }
    // ── Sync to store ─────────────────────────────────────────────
    syncState() {
        const jv = this.getJoystickVector();
        const up = this.keyMap['ArrowUp'] === true || this.keyMap['KeyW'] === true || this.dpadActive['up'] === true || jv.y < -0.25;
        const down = this.keyMap['ArrowDown'] === true || this.keyMap['KeyS'] === true || this.dpadActive['down'] === true || jv.y > 0.25;
        const left = this.keyMap['ArrowLeft'] === true || this.keyMap['KeyA'] === true || this.dpadActive['left'] === true || jv.x < -0.25;
        const right = this.keyMap['ArrowRight'] === true || this.keyMap['KeyD'] === true || this.dpadActive['right'] === true || jv.x > 0.25;
        gameStore.getState().setInput({
            up, down, left, right,
            joystick: jv,
        });
    }
    // ── Expose joystick origin for HUD rendering ──────────────────
    getJoystickState() {
        return { ...this.joystick };
    }
}
