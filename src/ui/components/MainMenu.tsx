interface Props {
  onStart: () => void;
}

export function MainMenu({ onStart }: Props) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(135deg, #0a0612 0%, #150e1f 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: 20,
      fontFamily: '"Courier New", monospace',
    }}>
      <div style={{
        background: '#0f0b1a',
        border: '3px solid #5a3d8c',
        boxShadow: '0 0 60px #3a2566, inset 0 0 20px #1a1030',
        padding: '40px 28px',
        maxWidth: 420,
        width: '100%',
        textAlign: 'center',
        color: '#e8ddff',
        borderRadius: 28,
      }}>
        {/* Glitch title */}
        <h1 style={{
          fontSize: 'clamp(2rem, 8vw, 3.2rem)',
          fontWeight: 900,
          letterSpacing: 8,
          textTransform: 'uppercase',
          color: '#d4b5ff',
          textShadow: '4px 0 #6a1f9a, -3px 0 #0088ff, 0 0 30px #b77aff',
          margin: '0 0 8px',
          lineHeight: 1.1,
          animation: 'titlePulse 2s infinite',
        }}>
          MEMORY<br />THIEF
        </h1>

        <p style={{ color: '#7a5fa0', fontSize: '0.9rem', marginBottom: 32, letterSpacing: 3 }}>
          ▸ A HORROR EXPERIENCE ◂
        </p>

        <button
          onClick={onStart}
          style={{
            background: '#231830',
            border: '3px solid #8b6bae',
            color: '#f5edff',
            fontSize: '1.4rem',
            fontWeight: 'bold',
            padding: '16px 40px',
            cursor: 'pointer',
            boxShadow: '0 8px 0 #2d1a42, 0 0 20px #8b5fcf',
            borderRadius: 60,
            fontFamily: 'inherit',
            width: '100%',
            textTransform: 'uppercase',
            letterSpacing: 4,
            marginBottom: 24,
            transition: 'transform 0.1s, box-shadow 0.1s',
          }}
          onMouseDown={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(4px)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 0 #2d1a42, 0 0 30px #b77aff';
          }}
          onMouseUp={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = '';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 0 #2d1a42, 0 0 20px #8b5fcf';
          }}
        >
          ▶ START
        </button>

        <p style={{ color: '#c9b3ff', fontSize: '1rem', margin: '0 0 8px' }}>
          🧠 Steal memories · Survive 🧠
        </p>
        <p style={{ color: '#6b52a0', fontSize: '0.85rem' }}>
          ⚠️ every memory steals a piece of you
        </p>

        <div style={{ marginTop: 28, borderTop: '1px solid #2a1f3a', paddingTop: 16 }}>
          <p style={{ color: '#4a3560', fontSize: '0.75rem', letterSpacing: 2 }}>
            WASD / ARROW KEYS · E or SPACE to interact
          </p>
          <p style={{ color: '#4a3560', fontSize: '0.75rem', letterSpacing: 2, marginTop: 4 }}>
            MOBILE: JOYSTICK + STEAL BUTTON
          </p>
        </div>
      </div>

      <style>{`
        @keyframes titlePulse {
          0%, 100% { text-shadow: 4px 0 #6a1f9a, -3px 0 #0088ff, 0 0 30px #b77aff; }
          50%       { text-shadow: 6px 0 #8a2fc9, -5px 0 #00aaff, 0 0 50px #d4b5ff; }
        }
      `}</style>
    </div>
  );
}
