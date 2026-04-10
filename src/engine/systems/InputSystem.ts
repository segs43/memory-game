import type { InputState, Vec2 } from '@types-game/game';
import { vec2 } from '@utils/vec2';

export class InputSystem {
  private keys: Set<string> = new Set();
  private joystick: Vec2 = vec2.zero();
  private interactPressed = false;
  private interactConsumed = false;

  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;

  constructor() {
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
  }

  attach(): void {
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }

  detach(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
  }

  // Called by the virtual joystick UI component
  setJoystick(v: Vec2): void {
    this.joystick = vec2.clampLength(v, 1);
  }

  // Called by D-pad buttons (mobile fallback)
  setDpadKey(key: 'up' | 'down' | 'left' | 'right', pressed: boolean): void {
    if (pressed) this.keys.add(key);
    else this.keys.delete(key);
  }

  setInteract(pressed: boolean): void {
    if (pressed && !this.interactConsumed) {
      this.interactPressed = true;
    }
    if (!pressed) {
      this.interactConsumed = false;
    }
  }

  consumeInteract(): boolean {
    if (this.interactPressed) {
      this.interactPressed = false;
      this.interactConsumed = true;
      return true;
    }
    return false;
  }

  getState(): InputState {
    // Build directional from keyboard OR joystick
    const kbDir: Vec2 = {
      x: (this.keys.has('ArrowRight') || this.keys.has('d') || this.keys.has('right') ? 1 : 0)
        - (this.keys.has('ArrowLeft')  || this.keys.has('a') || this.keys.has('left')  ? 1 : 0),
      y: (this.keys.has('ArrowDown')  || this.keys.has('s') || this.keys.has('down')  ? 1 : 0)
        - (this.keys.has('ArrowUp')   || this.keys.has('w') || this.keys.has('up')    ? 1 : 0),
    };

    // Prefer joystick if active
    const joystickActive = vec2.lengthSq(this.joystick) > 0.01;
    const dir = joystickActive ? this.joystick : vec2.normalize(kbDir);

    return {
      up:       dir.y < -0.3,
      down:     dir.y >  0.3,
      left:     dir.x < -0.3,
      right:    dir.x >  0.3,
      interact: this.interactPressed || this.keys.has('e') || this.keys.has(' '),
      joystick: dir,
    };
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.key);
    if (e.key === 'e' || e.key === ' ') {
      this.interactPressed = true;
    }
    // Prevent arrow key scroll
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
      e.preventDefault();
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.key);
  }
}
