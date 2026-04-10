import { useGameStore } from '@state/gameStore';
import { ENDINGS } from '@data/endingData';

interface Props {
  onRestart: () => void;
}

export function EndingScreen({ onRestart }: Props) {
  const ending = useGameStore(s => s.ending);
  const memoriesStolen = useGameStore(s => s.memoriesStolen);
  const totalNPCs = useGameStore(s => s.totalNPCs);

  if (!ending) return null;

  const data = ENDINGS[ending];

  const accentColors = {
    dark:       '#cc0044',
    incomplete: '#9b6fd1',
    true:       '#00ddff',
  };
  const accent = accentColors[ending];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'radial-gradient(ellipse at center, #0f0820 0%, #050208 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: 20,
      fontFamily: '"Courier New", monospace',
      animation: 'fadeIn 0.8s ease-out',
    }}>
      <div style={{
        background: '#0a0712',
        border: `3px solid ${accent}`,
        boxShadow: `0 0 60px ${accent}44, inset 0 0 30px #0a0510`,
        padding: '40px 28px',
        maxWidth: 420,
        width: '100%',
        textAlign: 'center',
        color: '#e8ddff',
        borderRadius: 28,
      }}>
        <h2 style={{
          fontSize: 'clamp(1.5rem, 6vw, 2.2rem)',
          color: accent,
          textShadow: `0 0 30px ${accent}`,
          marginBottom: 20,
          letterSpacing: 3,
        }}>
          {data.title}
        </h2>

        <p style={{
          fontSize: '1.05rem',
          lineHeight: 1.8,
          color: '#d4c0ff',
          marginBottom: 24,
          padding: '0 8px',
        }}>
          {data.description}
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid #2a1f3a',
          borderRadius: 12,
          padding: '12px 20px',
          marginBottom: 28,
          color: '#9b82c9',
          fontSize: '1rem',
        }}>
          🧠 Memories stolen: <strong style={{ color: accent }}>{memoriesStolen}</strong> / {totalNPCs}
        </div>

        <button
          onClick={onRestart}
          style={{
            background: '#0f0b1a',
            border: `3px solid ${accent}`,
            color: '#f5edff',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            padding: '14px 40px',
            cursor: 'pointer',
            boxShadow: `0 6px 0 #0a0510, 0 0 20px ${accent}66`,
            borderRadius: 60,
            fontFamily: 'inherit',
            width: '100%',
            textTransform: 'uppercase',
            letterSpacing: 4,
            transition: 'transform 0.1s, box-shadow 0.1s',
          }}
          onMouseDown={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(4px)';
          }}
          onMouseUp={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = '';
          }}
        >
          ↻ PLAY AGAIN
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
