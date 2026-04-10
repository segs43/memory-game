import { useCallback } from 'react';
import { useGameStore } from '@state/gameStore';
import { useGameCanvas } from '@ui/hooks/useGameCanvas';
import { MainMenu } from '@ui/components/MainMenu';
import { EndingScreen } from '@ui/components/EndingScreen';
import { HUD } from '@ui/components/HUD';
import { DialogueOverlay } from '@ui/components/DialogueOverlay';
import { MobileControls } from '@ui/components/MobileControls';

export default function App() {
  const phase = useGameStore(s => s.phase);
  const { canvasRef, startGame, getInputSystem } = useGameCanvas();

  const handleRestart = useCallback(() => {
    startGame();
  }, [startGame]);

  const isPlaying = phase === 'playing' || phase === 'dialogue';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0a0a0f',
      overflow: 'hidden',
      fontFamily: '"Courier New", monospace',
      touchAction: 'none',
    }}>
      {/* Game canvas - always mounted, hidden behind menus */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
          touchAction: 'none',
        }}
      />

      {/* Game UI - only visible while playing */}
      {isPlaying && (
        <>
          <HUD />
          <DialogueOverlay />
          <MobileControls inputSystem={getInputSystem()} />
        </>
      )}

      {/* Menu screens */}
      {phase === 'menu' && <MainMenu onStart={startGame} />}
      {phase === 'ending' && <EndingScreen onRestart={handleRestart} />}
    </div>
  );
}
