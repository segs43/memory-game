import { useGameStore } from '@state/gameStore';
import { CORRUPTION_LABELS } from '@engine/systems/CorruptionSystem';

export function HUD() {
  const memoriesStolen = useGameStore(s => s.memoriesStolen);
  const totalNPCs = useGameStore(s => s.totalNPCs);
  const tier = useGameStore(s => s.corruption.tier);
  const level = useGameStore(s => s.corruption.level);

  const tierColors: Record<string, string> = {
    stable:      '#7cffb2',
    compromised: '#ffdd57',
    unstable:    '#ff9a3c',
    severe:      '#ff4466',
    void:        '#cc00ff',
  };

  const color = tierColors[tier] ?? '#e8d5ff';

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      left: 16,
      right: 16,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      pointerEvents: 'none',
      zIndex: 20,
      fontFamily: '"Courier New", monospace',
    }}>
      {/* Memory counter */}
      <div style={hudItem}>
        <span style={{ fontSize: '1.1rem' }}>🧠</span>
        <span style={{ color: '#e8d5ff', fontWeight: 'bold', marginLeft: 6 }}>
          {memoriesStolen} / {totalNPCs}
        </span>
      </div>

      {/* Corruption bar */}
      <div style={{ ...hudItem, flexDirection: 'column', gap: 4, minWidth: 120 }}>
        <span style={{ color, fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: 2 }}>
          {CORRUPTION_LABELS[tier]}
        </span>
        <div style={{
          width: '100%',
          height: 4,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${level * 100}%`,
            height: '100%',
            background: `linear-gradient(90deg, #7a4fa0, ${color})`,
            transition: 'width 0.4s ease',
            boxShadow: `0 0 6px ${color}`,
          }} />
        </div>
      </div>
    </div>
  );
}

const hudItem: React.CSSProperties = {
  background: 'rgba(14,8,24,0.85)',
  padding: '8px 16px',
  borderRadius: 50,
  border: '2px solid #7a4fa0',
  boxShadow: '0 4px 0 #2a1540',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  color: '#e8d5ff',
  fontSize: '1rem',
  fontWeight: 'bold',
};
