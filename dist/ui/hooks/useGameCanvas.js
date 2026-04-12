import { useEffect, useRef, useCallback } from 'react';
import { GameController } from '@engine/core/GameController';
import { useGameStore } from '@state/gameStore';
export function useGameCanvas() {
    const canvasRef = useRef(null);
    const controllerRef = useRef(null);
    const phase = useGameStore(s => s.phase);
    // Resize handler
    const handleResize = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        canvas.width = canvas.offsetWidth * window.devicePixelRatio;
        canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    }, []);
    // Initialize controller once canvas is mounted
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        handleResize();
        window.addEventListener('resize', handleResize);
        const controller = new GameController(canvas);
        controllerRef.current = controller;
        return () => {
            window.removeEventListener('resize', handleResize);
            controller.stop();
            controllerRef.current = null;
        };
    }, [handleResize]);
    // React to phase changes
    useEffect(() => {
        const controller = controllerRef.current;
        if (!controller)
            return;
        if (phase === 'playing') {
            controller.start();
        }
    }, [phase]);
    const startGame = useCallback(() => {
        const controller = controllerRef.current;
        if (!controller)
            return;
        useGameStore.getState().resetProgression();
        useGameStore.getState().setPhase('playing');
        controller.reset();
        controller.start();
    }, []);
    const getInputSystem = useCallback(() => {
        return controllerRef.current?.getInputSystem() ?? null;
    }, []);
    return { canvasRef, startGame, getInputSystem };
}
