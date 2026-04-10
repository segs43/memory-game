import { useRef, useCallback, useEffect } from 'react';
import type { InputSystem } from '@engine/systems/InputSystem';

interface Props {
  inputSystem: InputSystem | null;
}

export function VirtualJoystick({ inputSystem }: Props) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activeTouch = useRef<number | null>(null);
  const baseCenter = useRef({ x: 0, y: 0 });
  const RADIUS = 50;

  const updateKnob = useCallback((dx: number, dy: number) => {
    const knob = knobRef.current;
    if (!knob) return;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, RADIUS);
    const angle = Math.atan2(dy, dx);
    const kx = Math.cos(angle) * clamped;
    const ky = Math.sin(angle) * clamped;
    knob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`;

    inputSystem?.setJoystick({ x: kx / RADIUS, y: ky / RADIUS });
  }, [inputSystem]);

  const resetKnob = useCallback(() => {
    const knob = knobRef.current;
    if (!knob) return;
    knob.style.transform = 'translate(-50%, -50%)';
    inputSystem?.setJoystick({ x: 0, y: 0 });
  }, [inputSystem]);

  useEffect(() => {
    const base = baseRef.current;
    if (!base) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (activeTouch.current !== null) return;
      const touch = e.changedTouches[0];
      activeTouch.current = touch.identifier;
      const rect = base.getBoundingClientRect();
      baseCenter.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      updateKnob(touch.clientX - baseCenter.current.x, touch.clientY - baseCenter.current.y);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeTouch.current) {
          updateKnob(touch.clientX - baseCenter.current.x, touch.clientY - baseCenter.current.y);
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouch.current) {
          activeTouch.current = null;
          resetKnob();
        }
      }
    };

    base.addEventListener('touchstart', onTouchStart, { passive: false });
    base.addEventListener('touchmove', onTouchMove, { passive: false });
    base.addEventListener('touchend', onTouchEnd);
    base.addEventListener('touchcancel', onTouchEnd);

    return () => {
      base.removeEventListener('touchstart', onTouchStart);
      base.removeEventListener('touchmove', onTouchMove);
      base.removeEventListener('touchend', onTouchEnd);
      base.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [updateKnob, resetKnob]);

  return (
    <div
      ref={baseRef}
      style={{
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: 'rgba(26,17,48,0.75)',
        border: '3px solid rgba(122,79,160,0.8)',
        boxShadow: '0 0 20px rgba(90,61,140,0.4)',
        position: 'relative',
        backdropFilter: 'blur(10px)',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <div
        ref={knobRef}
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 40%, #c9a0ff, #5a3d8c)',
          border: '2px solid #b385ff',
          boxShadow: '0 0 16px #9b6fd1',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          touchAction: 'none',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
