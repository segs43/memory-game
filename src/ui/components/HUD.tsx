import { useGameStore } from '@state/gameStore';
import { CORRUPTION_LABELS } from '@engine/systems/CorruptionSystem';

export function HUD() {
  const memoriesStolen = useGameStore(s => s.memoriesStolen);
  const totalNPCs      = useGameStore(s => s.totalNPCs);
  const tier           = useGameStore(s => s.corruption.tier);
  const level          = useGameStore(s => s.corruption.level);
  const invertControls = useGameStore(s => s.corruption.invertControls);

  const tierColors: Record<string, string> = {
    stable:      '#7cffb2',
    compromised: '#ffdd57',
    unstable:    '#ff9a3c',
    severe:      '#ff4466',
    void:        '#dd00ff',
  };
  const color = tierColors[tier] ?? '#e8d5ff';

  return (
    <>
      {/* Top HUD bar */}
      <div style={{
        position: 'absolute',
        top: 16, left: 16, right: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 20,
        fontFamily: '"Courier New", monospace',
        gap: 12,
      }}>
        {/* Memory counter */}
        <div style={hudPill}>
          <span style={{ fontSize: '1.1rem' }}>🧠</span>
          <span style={{ color: '#e8d5ff', fontWeight: 'bold', marginLeft: 7, letterSpacing: 1 }}>
            {memoriesStolen} <span style={{ opacity: 0.5 }}>/</span> {totalNPCs}
          </span>
        </div>

        {/* Corruption status */}
        <div style={{ ...hudPill, flexDirection: 'column', gap: 5, minWidth: 130, alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color, fontSize: '0.78rem', fontWeight: 'bold', letterSpacing: 2 }}>
              {CORRUPTION_LABELS[tier]}
            </span>
            <span style={{ color, fontSize: '0.78rem', opacity: 0.8 }}>
              {Math.round(level * 100)}%
            </span>
          </div>
          {/* Segmented bar */}
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: totalNPCs }).map((_, i) => (
              <div key={i} style={{
                flex: 1,
                height: 5,
                borderRadius: 2,
                background: i < memoriesStolen
                  ? `linear-gradient(90deg, #7a4fa0, ${color})`
                  : 'rgba(255,255,255,0.08)',
                boxShadow: i < memoriesStolen ? `0 0 6px ${color}88` : 'none',
                transition: 'background 0.4s ease',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Inverted controls warning */}
      {invertControls && (
        <div style={{
          position: 'absolute',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(180,0,60,0.88)',
          border: '2px solid #ff2255',
          borderRadius: 30,
          padding: '6px 20px',
          color: '#ffdddd',
          fontSize: '0.78rem',
          fontFamily: '"Courier New", monospace',
          fontWeight: 'bold',
          letterSpacing: 3,
          pointerEvents: 'none',
          zIndex: 25,
          whiteSpace: 'nowrap',
          animation: 'invertPulse 0.4s ease-in-out infinite alternate',
        }}>
          ⚠ CONTROLS INVERTED ⚠
        </div>
      )}

      <style>{`
        @keyframes invertPulse {
          from { opacity: 0.8; }
          to   { opacity: 1;   }
        }
      `}</style>
    </>
  );
}

const hudPill: React.CSSProperties = {
  background: 'rgba(10,6,20,0.88)',
  padding: '9px 18px',
  borderRadius: 50,
  border: '1.5px solid rgba(122,79,160,0.7)',
  boxShadow: '0 4px 0 rgba(20,8,40,0.8), 0 0 16px rgba(90,50,140,0.2)',
  backdropFilter: 'blur(12px)',
  display: 'flex',
  alignItems: 'center',
  color: '#e8d5ff',
  fontSize: '1rem',
  fontWeight: 'bold',
};
