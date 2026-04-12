import { vec2 } from '@utils/vec2';
export class InputSystem {
    keys = new Set();
    joystick = vec2.zero();
    interactPressed = false;
    interactConsumed = false;
    boundKeyDown;
    boundKeyUp;
    constructor() {
        this.boundKeyDown = this.onKeyDown.bind(this);
        this.boundKeyUp = this.onKeyUp.bind(this);
    }
    attach() {
        window.addEventListener('keydown', this.boundKeyDown);
        window.addEventListener('keyup', this.boundKeyUp);
    }
    detach() {
        window.removeEventListener('keydown', this.boundKeyDown);
        window.removeEventListener('keyup', this.boundKeyUp);
    }
    // Called by the virtual joystick UI component
    setJoystick(v) {
        this.joystick = vec2.clampLength(v, 1);
    }
    // Called by D-pad buttons (mobile fallback)
    setDpadKey(key, pressed) {
        if (pressed)
            this.keys.add(key);
        else
            this.keys.delete(key);
    }
    setInteract(pressed) {
        if (pressed && !this.interactConsumed) {
            this.interactPressed = true;
        }
        if (!pressed) {
            this.interactConsumed = false;
        }
    }
    consumeInteract() {
        if (this.interactPressed) {
            this.interactPressed = false;
            this.interactConsumed = true;
            return true;
        }
        return false;
    }
    getState() {
        // Build directional from keyboard OR joystick
        const kbDir = {
            x: (this.keys.has('ArrowRight') || this.keys.has('d') || this.keys.has('right') ? 1 : 0)
                - (this.keys.has('ArrowLeft') || this.keys.has('a') || this.keys.has('left') ? 1 : 0),
            y: (this.keys.has('ArrowDown') || this.keys.has('s') || this.keys.has('down') ? 1 : 0)
                - (this.keys.has('ArrowUp') || this.keys.has('w') || this.keys.has('up') ? 1 : 0),
        };
        // Prefer joystick if active
        const joystickActive = vec2.lengthSq(this.joystick) > 0.01;
        const dir = joystickActive ? this.joystick : vec2.normalize(kbDir);
        return {
            up: dir.y < -0.3,
            down: dir.y > 0.3,
            left: dir.x < -0.3,
            right: dir.x > 0.3,
            interact: this.interactPressed || this.keys.has('e') || this.keys.has(' '),
            joystick: dir,
        };
    }
    onKeyDown(e) {
        this.keys.add(e.key);
        if (e.key === 'e' || e.key === ' ') {
            this.interactPressed = true;
        }
        // Prevent arrow key scroll
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
    }
    onKeyUp(e) {
        this.keys.delete(e.key);
    }
}
