// src/main.ts
// ─────────────────────────────────────────────────────────────
// Application entry point.
// Bootstraps the World, UIManager, and wires them together.
// This is the only file that knows about both systems.
// ─────────────────────────────────────────────────────────────
import { World } from '@core/World.js';
import { UIManager } from '@ui/UIManager.js';
import { ApiClient } from '@utils/ApiClient.js';
import { generateSessionId } from '@entities/EntityFactory.js';
import { getState } from '@core/GameState.js';
import { bus } from '@core/EventBus.js';
async function bootstrap() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas)
        throw new Error('Canvas #gameCanvas not found');
    // Generate session ID for this run
    let sessionId = generateSessionId();
    // ── Init systems ───────────────────────────────────────────────
    const world = new World(canvas);
    const ui = new UIManager('ui-root');
    await world.init();
    // ── Wire UI callbacks ─────────────────────────────────────────
    ui.init(
    // onStart
    () => {
        sessionId = generateSessionId();
        world.startSession();
        // Report session start to backend (non-blocking)
        ApiClient.saveSession({
            sessionId,
            memoriesStolen: 0,
            ending: null,
            timeSurvived: 0,
            timestamp: Date.now(),
        });
    }, 
    // onSteal (STEAL button pressed)
    () => {
        world.handleStealAction();
    }, 
    // onDismiss (dialogue tap)
    () => {
        world.handleDialogueDismiss();
    });
    // ── Show main menu ─────────────────────────────────────────────
    ui.showMenu();
    // ── Persist session on ending ──────────────────────────────────
    let progressReportTimer = 0;
    // Periodic progress reporting (every 5s while playing)
    setInterval(() => {
        const state = getState();
        if (state.phase !== 'playing')
            return;
        progressReportTimer++;
        if (progressReportTimer % 5 === 0) {
            ApiClient.updateProgress(sessionId, state.memoriesStolen);
        }
    }, 1000);
    // Save on ending
    bus.on('ui:showEnding', ({ endingType, memoriesStolen, timeSurvived }) => {
        ApiClient.saveSession({
            sessionId,
            memoriesStolen,
            ending: endingType,
            timeSurvived,
            timestamp: Date.now(),
        });
    });
    // ── Handle page visibility ─────────────────────────────────────
    document.addEventListener('visibilitychange', () => {
        const state = getState();
        if (document.hidden && state.phase === 'playing') {
            world.loop.pause();
        }
        else if (!document.hidden && state.phase === 'playing') {
            world.loop.resume();
        }
    });
    console.log('%c🧠 Memory Thief v2.0 — by TawsiN', 'color:#b77aff;font-size:14px;font-weight:bold;');
    console.log('%cBuilt with PixiJS · TypeScript · Vite', 'color:#6a4090;font-size:11px;');
}
bootstrap().catch((err) => {
    console.error('[Memory Thief] Fatal init error:', err);
});
