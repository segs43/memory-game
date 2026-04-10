import { useEffect, useState } from 'react';
import { useGameStore } from '@state/gameStore';

export function DialogueOverlay() {
  const activeDialogue = useGameStore(s => s.activeDialogue);
  const closeDialogue = useGameStore(s => s.closeDialogue);
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  // Typewriter effect
  useEffect(() => {
    if (!activeDialogue) {
      setDisplayed('');
      setDone(false);
      return;
    }

    setDisplayed('');
    setDone(false);
    const text = activeDialogue.text;
    let i = 0;
    const speed = activeDialogue.corrupted ? 35 : 28;

    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [activeDialogue]);

  if (!activeDialogue) return null;

  const handleClose = () => {
    if (!done) {
      // Skip to end
      setDisplayed(activeDialogue.text);
      setDone(true);
      return;
    }
    closeDialogue();
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'absolute',
        bottom: 130,
        left: 20,
        right: 20,
        background: 'rgba(10,6,18,0.94)',
        border: `3px solid ${activeDialogue.corrupted ? '#cc00ff' : '#8b5fcf'}`,
        borderRadius: 20,
        padding: '20px 24px',
        zIndex: 30,
        cursor: 'pointer',
        backdropFilter: 'blur(16px)',
        boxShadow: `0 10px 0 #1a0a2a, 0 0 40px rgba(0,0,0,0.8), 0 0 30px ${activeDialogue.corrupted ? 'rgba(180,0,255,0.2)' : 'transparent'}`,
        fontFamily: '"Courier New", monospace',
        animation: 'dialogueIn 0.2s ease-out',
      }}
    >
      <div style={{
        color: activeDialogue.corrupted ? '#ff88ff' : '#f0e4ff',
        fontSize: '1.15rem',
        lineHeight: 1.6,
        minHeight: 32,
        letterSpacing: activeDialogue.corrupted ? 1 : 0,
        textShadow: activeDialogue.corrupted ? '0 0 8px #cc00ff' : 'none',
      }}>
        {displayed}
        {!done && <span style={{ opacity: 0.6, animation: 'blink 0.5s step-end infinite' }}>▌</span>}
      </div>

      <div style={{
        fontSize: '0.85rem',
        color: '#9b82c9',
        textAlign: 'center',
        marginTop: 12,
        opacity: done ? 1 : 0.4,
        transition: 'opacity 0.3s',
      }}>
        {done ? '👇 Tap to continue' : '👇 Tap to skip'}
      </div>

      <style>{`
        @keyframes dialogueIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
