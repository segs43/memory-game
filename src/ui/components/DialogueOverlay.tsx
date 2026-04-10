import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@state/gameStore';

const CORRUPT_CHARS = '█▓▒░▄▀■□●◆⣿⢿';

function randomCorruptChar(): string {
  return CORRUPT_CHARS[Math.floor(Math.random() * CORRUPT_CHARS.length)];
}

export function DialogueOverlay() {
  const activeDialogue = useGameStore(s => s.activeDialogue);
  const closeDialogue  = useGameStore(s => s.closeDialogue);
  const [displayed, setDisplayed]   = useState('');
  const [done, setDone]             = useState(false);
  const [flickerIdx, setFlickerIdx] = useState(-1);

  useEffect(() => {
    if (!activeDialogue) { setDisplayed(''); setDone(false); return; }

    setDisplayed('');
    setDone(false);
    const text  = activeDialogue.text;
    const speed = activeDialogue.corrupted ? 40 : 26;
    let i = 0;

    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setDone(true); }
    }, speed);
    return () => clearInterval(interval);
  }, [activeDialogue]);

  // Flicker effect on corrupted text after done
  useEffect(() => {
    if (!done || !activeDialogue?.corrupted) return;
    const flicker = setInterval(() => {
      setFlickerIdx(Math.floor(Math.random() * (activeDialogue?.text.length ?? 0)));
      setTimeout(() => setFlickerIdx(-1), 60);
    }, 300);
    return () => clearInterval(flicker);
  }, [done, activeDialogue]);

  const handleClose = useCallback(() => {
    if (!done) {
      setDisplayed(activeDialogue?.text ?? '');
      setDone(true);
      return;
    }
    closeDialogue();
  }, [done, activeDialogue, closeDialogue]);

  if (!activeDialogue) return null;

  const borderColor  = activeDialogue.corrupted ? '#cc00ff' : '#8b5fcf';
  const glowColor    = activeDialogue.corrupted ? 'rgba(180,0,255,0.25)' : 'transparent';
  const textColor    = activeDialogue.corrupted ? '#ff99ff' : '#f0e4ff';

  // Render text with possible flicker char
  const renderText = () => {
    if (flickerIdx < 0 || !activeDialogue.corrupted) return displayed;
    return displayed.split('').map((c, idx) =>
      idx === flickerIdx ? randomCorruptChar() : c
    ).join('');
  };

  return (
    <div
      onClick={handleClose}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClose()}
      style={{
        position: 'absolute',
        bottom: 130,
        left: 20,
        right: 20,
        background: 'rgba(8,4,16,0.95)',
        border: `2px solid ${borderColor}`,
        borderRadius: 18,
        padding: '18px 22px 14px',
        zIndex: 30,
        cursor: 'pointer',
        backdropFilter: 'blur(20px)',
        boxShadow: `0 12px 0 rgba(10,4,20,0.9), 0 0 50px rgba(0,0,0,0.7), 0 0 40px ${glowColor}`,
        fontFamily: '"Courier New", monospace',
        animation: 'dialogueSlideIn 0.18s ease-out',
        outline: 'none',
      }}
    >
      {/* Speaker tag */}
      <div style={{
        fontSize: '0.72rem',
        color: borderColor,
        letterSpacing: 3,
        marginBottom: 8,
        opacity: 0.9,
        textTransform: 'uppercase',
      }}>
        {activeDialogue.speaker} — MEMORY FRAGMENT
      </div>

      {/* Main text */}
      <div style={{
        color: textColor,
        fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
        lineHeight: 1.7,
        minHeight: 28,
        letterSpacing: activeDialogue.corrupted ? 0.5 : 0,
        textShadow: activeDialogue.corrupted ? `0 0 10px ${borderColor}` : 'none',
        wordBreak: 'break-word',
      }}>
        {renderText()}
        {!done && (
          <span style={{ opacity: 0.5, animation: 'blink 0.5s step-end infinite' }}>▌</span>
        )}
      </div>

      {/* Continue hint */}
      <div style={{
        fontSize: '0.72rem',
        color: '#6a5280',
        textAlign: 'right',
        marginTop: 10,
        opacity: done ? 1 : 0.3,
        transition: 'opacity 0.4s',
        letterSpacing: 2,
      }}>
        {done ? 'TAP / CLICK TO CONTINUE ▸' : 'TAP TO SKIP ▸'}
      </div>

      <style>{`
        @keyframes dialogueSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
