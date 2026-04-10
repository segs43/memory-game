import type { InputSystem } from '@engine/systems/InputSystem';
import { VirtualJoystick } from './VirtualJoystick';

interface Props {
  inputSystem: InputSystem | null;
}

export function MobileControls({ inputSystem }: Props) {
  const handleStealStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    inputSystem?.setInteract(true);
    // Auto-release after short pulse so consumeInteract fires cleanly
    setTimeout(() => inputSystem?.setInteract(false), 80);
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      padding: '0 24px',
      pointerEvents: 'none',
      zIndex: 40,
    }}>
      {/* Virtual joystick */}
      <div style={{ pointerEvents: 'auto' }}>
        <VirtualJoystick inputSystem={inputSystem} />
      </div>

      {/* Steal button */}
      <div
        onTouchStart={handleStealStart}
        onMouseDown={handleStealStart}
        style={{
          pointerEvents: 'auto',
          width: 96,
          height: 96,
          borderRadius: 24,
          background: 'rgba(42,21,64,0.88)',
          border: '4px solid #b77aff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f0e4ff',
          fontSize: '0.85rem',
          fontWeight: 'bold',
          fontFamily: '"Courier New", monospace',
          letterSpacing: 2,
          textTransform: 'uppercase',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 0 #1a0f2a, 0 0 30px rgba(155,111,209,0.5)',
          cursor: 'pointer',
          userSelect: 'none',
          touchAction: 'none',
          textAlign: 'center',
          lineHeight: 1.2,
          flexDirection: 'column',
          transition: 'transform 0.08s, box-shadow 0.08s',
        }}
      >
        <span style={{ fontSize: '1.4rem' }}>🧠</span>
        STEAL
      </div>
    </div>
  );
}
