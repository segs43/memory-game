// src/ui/UIManager.ts
// ─────────────────────────────────────────────────────────────
// Pure TypeScript UI layer — no framework dependency.
// Renders: main menu, HUD, dialogue box, mobile controls,
// ending screen. Communicates with World via callbacks.
// ─────────────────────────────────────────────────────────────
import { bus } from '@core/EventBus.js';
import { ENDING_DATA } from '@data/WorldData.js';
import { getState } from '@core/GameState.js';
export class UIManager {
    root;
    onSteal;
    onStart;
    onDismiss;
    // DOM refs
    mainMenu;
    gameHud;
    dialogueEl;
    dialogueText;
    endingScreen;
    mobileControls;
    memoryCounter;
    corruptionLabel;
    joystickVisual;
    joystickKnob;
    constructor(rootId) {
        const el = document.getElementById(rootId);
        if (!el)
            throw new Error(`UI root #${rootId} not found`);
        this.root = el;
    }
    init(onStart, onSteal, onDismiss) {
        this.onStart = onStart;
        this.onSteal = onSteal;
        this.onDismiss = onDismiss;
        this.render();
        this.bindBusEvents();
    }
    // ── Build all UI HTML ──────────────────────────────────────────
    render() {
        this.root.innerHTML = `
      <!-- MAIN MENU -->
      <div id="ui-main-menu" class="screen-overlay">
        <div class="menu-card">
          <div class="made-by">made by <span class="made-by-name">TawsiN</span></div>
          <h1 class="glitch-title" data-text="MEMORY THIEF">MEMORY<br>THIEF</h1>
          <p class="menu-tagline">Every stolen memory<br>steals a piece of you</p>
          <button id="ui-start-btn" class="menu-btn">▶ START</button>
          <div class="menu-hints">
            <span>WASD / D-PAD to move</span>
            <span>E / SPACE / STEAL to take memories</span>
            <span>⚠️ find the hidden NPC for the true ending</span>
          </div>
        </div>
      </div>

      <!-- HUD -->
      <div id="ui-hud" class="hud hidden">
        <div class="hud-item hud-memories">🧠 <span id="ui-memory-count">0</span></div>
        <div class="hud-item hud-corruption" id="ui-corruption-label">⚡ STABLE</div>
      </div>

      <!-- DIALOGUE -->
      <div id="ui-dialogue" class="dialogue-box hidden">
        <div id="ui-dialogue-text" class="dialogue-text">...</div>
        <div class="dialogue-hint">👇 Tap / Press E to continue</div>
      </div>

      <!-- NEARBY HINT -->
      <div id="ui-near-hint" class="near-hint hidden">STEAL MEMORY</div>

      <!-- ENDING SCREEN -->
      <div id="ui-ending" class="screen-overlay hidden">
        <div class="menu-card ending-card">
          <div class="made-by">made by <span class="made-by-name">TawsiN</span></div>
          <h2 id="ui-ending-title" class="ending-title">ENDING</h2>
          <p id="ui-ending-desc" class="ending-desc">...</p>
          <div id="ui-ending-stats" class="ending-stats">
            <div>🧠 memories stolen: <span id="ui-ending-count">0</span></div>
            <div>⏱ time survived: <span id="ui-ending-time">0s</span></div>
          </div>
          <button id="ui-restart-btn" class="menu-btn">↻ PLAY AGAIN</button>
        </div>
      </div>

      <!-- MOBILE CONTROLS -->
      <div id="ui-mobile-controls" class="mobile-controls hidden">
        <!-- Virtual joystick zone (left) -->
        <div class="joystick-zone" id="ui-joystick-zone">
          <div class="joystick-base" id="ui-joystick-base">
            <div class="joystick-knob" id="ui-joystick-knob"></div>
          </div>
          <div class="dpad-hint">move</div>
        </div>

        <!-- Action buttons (right) -->
        <div class="action-cluster">
          <button class="steal-btn" id="ui-steal-btn">
            <span class="steal-icon">🧠</span>
            <span class="steal-label">STEAL</span>
          </button>
        </div>
      </div>
    `;
        // Cache refs
        this.mainMenu = document.getElementById('ui-main-menu');
        this.gameHud = document.getElementById('ui-hud');
        this.dialogueEl = document.getElementById('ui-dialogue');
        this.dialogueText = document.getElementById('ui-dialogue-text');
        this.endingScreen = document.getElementById('ui-ending');
        this.mobileControls = document.getElementById('ui-mobile-controls');
        this.memoryCounter = document.getElementById('ui-memory-count');
        this.corruptionLabel = document.getElementById('ui-corruption-label');
        this.joystickVisual = document.getElementById('ui-joystick-base');
        this.joystickKnob = document.getElementById('ui-joystick-knob');
        this.injectStyles();
        this.bindDomEvents();
        this.setupMobileJoystick();
    }
    // ── DOM event bindings ─────────────────────────────────────────
    bindDomEvents() {
        document.getElementById('ui-start-btn')?.addEventListener('click', () => {
            this.showGame();
            this.onStart();
        });
        document.getElementById('ui-restart-btn')?.addEventListener('click', () => {
            this.showGame();
            this.onStart();
        });
        document.getElementById('ui-steal-btn')?.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.onSteal();
        });
        // Close dialogue on canvas tap (outside controls)
        document.getElementById('gameCanvas')?.addEventListener('pointerdown', () => {
            const state = getState();
            if (state.phase === 'dialogue') {
                this.onDismiss();
            }
        });
    }
    // ── EventBus bindings ──────────────────────────────────────────
    bindBusEvents() {
        bus.on('ui:showDialogue', ({ text }) => {
            this.dialogueText.textContent = text;
            this.dialogueEl.classList.remove('hidden');
            this.dialogueEl.classList.add('visible');
        });
        bus.on('ui:hideDialogue', () => {
            this.dialogueEl.classList.add('hidden');
            this.dialogueEl.classList.remove('visible');
        });
        bus.on('ui:updateHud', ({ memoriesStolen, tier }) => {
            this.memoryCounter.textContent = String(memoriesStolen);
            this.updateCorruptionLabel(tier);
        });
        bus.on('ui:showEnding', ({ endingType, memoriesStolen, timeSurvived }) => {
            this.showEnding(endingType, memoriesStolen, timeSurvived);
        });
        bus.on('player:nearNpc', () => {
            document.getElementById('ui-near-hint')?.classList.remove('hidden');
        });
        bus.on('player:leaveNpc', () => {
            document.getElementById('ui-near-hint')?.classList.add('hidden');
        });
    }
    // ── Screen transitions ─────────────────────────────────────────
    showMenu() {
        this.mainMenu.classList.remove('hidden');
        this.gameHud.classList.add('hidden');
        this.endingScreen.classList.add('hidden');
        this.mobileControls.classList.add('hidden');
    }
    showGame() {
        this.mainMenu.classList.add('hidden');
        this.endingScreen.classList.add('hidden');
        this.gameHud.classList.remove('hidden');
        document.getElementById('ui-near-hint')?.classList.add('hidden');
        if (this.isMobile()) {
            this.mobileControls.classList.remove('hidden');
        }
    }
    showEnding(type, count, time) {
        const data = ENDING_DATA[type];
        document.getElementById('ui-ending-title').textContent = data.title;
        document.getElementById('ui-ending-desc').textContent = data.description;
        document.getElementById('ui-ending-count').textContent = String(count);
        document.getElementById('ui-ending-time').textContent = `${Math.floor(time)}s`;
        this.gameHud.classList.add('hidden');
        this.mobileControls.classList.add('hidden');
        document.getElementById('ui-near-hint')?.classList.add('hidden');
        this.endingScreen.classList.remove('hidden');
        this.endingScreen.classList.add('visible');
    }
    updateCorruptionLabel(tier) {
        const labels = {
            stable: '⚡ STABLE',
            compromised: '⚠️ COMPROMISED',
            unstable: '🌀 UNSTABLE',
            severe: '💀 SEVERE',
            terminal: '☠️ TERMINAL',
        };
        this.corruptionLabel.textContent = labels[tier];
        this.corruptionLabel.className = `hud-item hud-corruption tier-${tier}`;
    }
    // ── Virtual joystick for mobile ────────────────────────────────
    joystickTouchId = -1;
    joystickOrigin = { x: 0, y: 0 };
    setupMobileJoystick() {
        if (!this.isMobile())
            return;
        const zone = document.getElementById('ui-joystick-zone');
        zone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            this.joystickTouchId = touch.identifier;
            this.joystickOrigin = { x: touch.clientX, y: touch.clientY };
            // Reposition base to touch origin
            const rect = zone.getBoundingClientRect();
            this.joystickVisual.style.left = `${touch.clientX - rect.left - 40}px`;
            this.joystickVisual.style.top = `${touch.clientY - rect.top - 40}px`;
            this.joystickVisual.style.opacity = '1';
        }, { passive: false });
        zone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier !== this.joystickTouchId)
                    continue;
                const dx = touch.clientX - this.joystickOrigin.x;
                const dy = touch.clientY - this.joystickOrigin.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const MAX = 40;
                const cx = (dx / Math.max(dist, MAX)) * Math.min(dist, MAX);
                const cy = (dy / Math.max(dist, MAX)) * Math.min(dist, MAX);
                this.joystickKnob.style.transform = `translate(${cx}px, ${cy}px)`;
                // Push normalized input to store via InputSystem
                const nx = dx / Math.max(dist, 0.001);
                const ny = dy / Math.max(dist, 0.001);
                const mag = Math.min(dist / MAX, 1);
                getState().setInput({ joystick: { x: nx * mag, y: ny * mag } });
            }
        }, { passive: false });
        const endJoystick = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.joystickTouchId) {
                    this.joystickTouchId = -1;
                    this.joystickKnob.style.transform = 'translate(0px, 0px)';
                    this.joystickVisual.style.opacity = '0.4';
                    getState().setInput({ joystick: { x: 0, y: 0 } });
                }
            }
        };
        zone.addEventListener('touchend', endJoystick);
        zone.addEventListener('touchcancel', endJoystick);
    }
    isMobile() {
        return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
            || window.innerWidth < 768;
    }
    // ── Inline styles ──────────────────────────────────────────────
    injectStyles() {
        if (document.getElementById('ui-styles'))
            return;
        const style = document.createElement('style');
        style.id = 'ui-styles';
        style.textContent = `
      /* ── Shared ── */
      .hidden { display: none !important; }

      /* ── Screen overlays ── */
      .screen-overlay {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        display: flex; align-items: center; justify-content: center;
        background: linear-gradient(135deg, #0a0612 0%, #130c1f 100%);
        z-index: 50; padding: 20px;
        animation: fadeIn 0.4s ease;
      }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

      .menu-card {
        background: #0f0b1aee;
        border: 2px solid #5a3d8c;
        box-shadow: 0 0 80px #3a256680, inset 0 0 30px #15103088;
        padding: 40px 30px;
        max-width: 480px;
        width: 100%;
        text-align: center;
        border-radius: 24px;
        backdrop-filter: blur(12px);
      }

      .made-by {
        font-family: var(--font-mono);
        font-size: 0.75rem;
        color: #6a5080;
        letter-spacing: 3px;
        text-transform: uppercase;
        margin-bottom: 16px;
      }
      .made-by-name {
        color: #9a70c0;
        letter-spacing: 4px;
      }

      /* ── Glitch title ── */
      .glitch-title {
        font-family: var(--font-display);
        font-size: clamp(2rem, 8vw, 3.5rem);
        font-weight: 900;
        letter-spacing: 8px;
        text-transform: uppercase;
        color: #d4b5ff;
        text-shadow: 3px 0 #6a1f9a, -3px 0 #0088ff, 0 0 40px #b77aff88;
        margin-bottom: 16px;
        line-height: 1.1;
        animation: titlePulse 3s infinite;
        position: relative;
      }
      .glitch-title::before, .glitch-title::after {
        content: attr(data-text);
        position: absolute; top: 0; left: 0; width: 100%;
        opacity: 0;
      }
      .glitch-title::before {
        animation: glitchA 4s infinite;
        color: #ff00cc; clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%);
        text-shadow: none;
      }
      .glitch-title::after {
        animation: glitchB 4s infinite;
        color: #00ffee; clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%);
        text-shadow: none;
      }
      @keyframes titlePulse {
        0%,100% { text-shadow: 3px 0 #6a1f9a, -3px 0 #0088ff, 0 0 40px #b77aff88; }
        50%     { text-shadow: 5px 0 #8a2fc9, -5px 0 #00aaff, 0 0 60px #d4b5ff99; }
      }
      @keyframes glitchA {
        0%,90%,100% { opacity: 0; transform: translateX(0); }
        92% { opacity: 0.7; transform: translateX(-4px); }
        94% { opacity: 0; }
        96% { opacity: 0.5; transform: translateX(4px); }
        98% { opacity: 0; }
      }
      @keyframes glitchB {
        0%,91%,100% { opacity: 0; transform: translateX(0); }
        93% { opacity: 0.6; transform: translateX(4px); }
        95% { opacity: 0; }
        97% { opacity: 0.4; transform: translateX(-3px); }
        99% { opacity: 0; }
      }

      .menu-tagline {
        font-family: var(--font-mono);
        font-size: 1rem;
        color: #9b82c9;
        margin: 0 0 28px;
        line-height: 1.6;
        letter-spacing: 1px;
      }

      .menu-btn {
        background: #1e1332;
        border: 2px solid #8b6bae;
        color: #f5edff;
        font-family: var(--font-display);
        font-size: 1.1rem;
        font-weight: 700;
        padding: 16px 40px;
        margin: 8px 0 24px;
        cursor: pointer;
        border-radius: 50px;
        letter-spacing: 4px;
        text-transform: uppercase;
        width: 100%;
        box-shadow: 0 6px 0 #1a0d2a, 0 0 30px #7a4fa088;
        transition: transform 0.08s, box-shadow 0.08s, background 0.15s;
      }
      .menu-btn:hover  { background: #2a1a44; box-shadow: 0 6px 0 #1a0d2a, 0 0 50px #9b6fd1; }
      .menu-btn:active { transform: translateY(5px); box-shadow: 0 1px 0 #1a0d2a, 0 0 40px #b77aff; }

      .menu-hints {
        display: flex; flex-direction: column; gap: 6px;
        font-family: var(--font-mono);
        font-size: 0.75rem;
        color: #604880;
        letter-spacing: 1px;
      }

      /* ── HUD ── */
      .hud {
        position: absolute; top: 16px; left: 16px; right: 16px;
        display: flex; justify-content: space-between; align-items: center;
        pointer-events: none; z-index: 20;
        font-family: var(--font-display);
      }
      .hud-item {
        background: #0d071888;
        border: 1px solid #6a4090;
        padding: 8px 18px;
        border-radius: 40px;
        font-size: 0.85rem;
        letter-spacing: 2px;
        backdrop-filter: blur(8px);
        color: #e8d5ff;
        box-shadow: 0 3px 0 #1a0d2a, 0 0 15px #5a3d8c44;
        transition: background 0.3s, color 0.3s, border-color 0.3s;
      }
      .hud-corruption.tier-compromised { color: #ffdd88; border-color: #aa8800; }
      .hud-corruption.tier-unstable    { color: #ff9944; border-color: #cc5500; }
      .hud-corruption.tier-severe      { color: #ff4466; border-color: #aa0033; animation: hudPulse 1s infinite; }
      .hud-corruption.tier-terminal    { color: #ff0033; border-color: #ff0033; animation: hudPulse 0.4s infinite; }
      @keyframes hudPulse {
        0%,100% { box-shadow: 0 3px 0 #1a0d2a, 0 0 15px currentColor; }
        50%     { box-shadow: 0 3px 0 #1a0d2a, 0 0 40px currentColor; }
      }

      /* ── Dialogue ── */
      .dialogue-box {
        position: absolute;
        bottom: 140px; left: 20px; right: 20px;
        background: #08040eee;
        border: 2px solid #8b5fcf;
        padding: 20px 24px;
        border-radius: 20px;
        backdrop-filter: blur(16px);
        box-shadow: 0 8px 0 #2d1a42, 0 0 60px #00000088;
        z-index: 30;
        text-align: center;
        animation: dialoguePop 0.2s cubic-bezier(0.34,1.56,0.64,1);
      }
      @keyframes dialoguePop {
        from { transform: translateY(10px) scale(0.97); opacity: 0; }
        to   { transform: none; opacity: 1; }
      }
      .dialogue-text {
        font-family: var(--font-mono);
        font-size: clamp(1rem, 3vw, 1.25rem);
        color: #f0e4ff;
        line-height: 1.6;
        letter-spacing: 0.5px;
        min-height: 2.4em;
      }
      .dialogue-hint {
        font-family: var(--font-mono);
        font-size: 0.8rem;
        color: #9080b8;
        margin-top: 12px;
        letter-spacing: 1px;
        animation: blink 1.5s infinite;
      }
      @keyframes blink { 0%,100% { opacity: 0.8; } 50% { opacity: 0.3; } }

      /* ── Nearby hint ── */
      .near-hint {
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -120px);
        font-family: var(--font-display);
        font-size: 0.75rem;
        letter-spacing: 3px;
        color: #d4b5ff;
        text-shadow: 0 0 20px #b77aff;
        pointer-events: none;
        z-index: 25;
        animation: float 1.5s ease-in-out infinite;
      }
      @keyframes float {
        0%,100% { transform: translate(-50%, -120px); }
        50%     { transform: translate(-50%, -130px); }
      }

      /* ── Ending ── */
      .ending-card { max-width: 520px; }
      .ending-title {
        font-family: var(--font-display);
        font-size: clamp(1.4rem, 5vw, 2rem);
        font-weight: 900;
        letter-spacing: 4px;
        color: #d4b5ff;
        text-shadow: 0 0 40px #b77aff;
        margin-bottom: 16px;
        text-transform: uppercase;
      }
      .ending-desc {
        font-family: var(--font-mono);
        font-size: 1rem;
        color: #c9b3ff;
        line-height: 1.7;
        white-space: pre-line;
        margin: 0 0 20px;
      }
      .ending-stats {
        font-family: var(--font-mono);
        font-size: 0.9rem;
        color: #9b82c9;
        display: flex; flex-direction: column; gap: 4px;
        margin-bottom: 24px;
        letter-spacing: 1px;
      }

      /* ── Mobile controls ── */
      .mobile-controls {
        position: absolute;
        bottom: 20px; left: 0; right: 0;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        padding: 0 24px;
        pointer-events: none;
        z-index: 40;
      }
      .joystick-zone {
        width: 160px; height: 160px;
        pointer-events: auto;
        position: relative;
        display: flex; align-items: center; justify-content: center;
      }
      .joystick-base {
        width: 80px; height: 80px;
        border-radius: 50%;
        background: #12093088;
        border: 2px solid #6a4090;
        position: absolute;
        display: flex; align-items: center; justify-content: center;
        opacity: 0.4;
        transition: opacity 0.2s;
        box-shadow: 0 0 20px #5a3d8c44;
      }
      .joystick-knob {
        width: 36px; height: 36px;
        border-radius: 50%;
        background: #9b6fd1;
        border: 2px solid #d4b5ff;
        box-shadow: 0 0 15px #b77aff88;
        transition: transform 0.05s;
      }
      .dpad-hint {
        position: absolute; bottom: 0; left: 50%;
        transform: translateX(-50%);
        font-family: var(--font-mono); font-size: 0.65rem;
        color: #5a4070; letter-spacing: 2px; text-transform: uppercase;
        pointer-events: none;
      }
      .action-cluster {
        pointer-events: auto;
        display: flex; flex-direction: column; align-items: center; gap: 12px;
      }
      .steal-btn {
        width: 90px; height: 90px;
        background: #2a1540cc;
        border: 2px solid #b77aff;
        border-radius: 24px;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center; gap: 4px;
        color: #f0e4ff;
        cursor: pointer;
        box-shadow: 0 6px 0 #1a0d2a, 0 0 30px #9b6fd188;
        transition: transform 0.08s, box-shadow 0.08s;
        touch-action: none;
      }
      .steal-btn:active {
        transform: translateY(5px);
        box-shadow: 0 1px 0 #1a0d2a, 0 0 50px #d4b5ff;
      }
      .steal-icon { font-size: 1.8rem; }
      .steal-label {
        font-family: var(--font-display); font-size: 0.55rem;
        letter-spacing: 2px; color: #d4b5ff;
      }

      /* ── Responsive ── */
      @media (max-width: 480px) {
        .menu-card { padding: 28px 18px; }
        .glitch-title { font-size: 2.2rem; letter-spacing: 4px; }
        .dialogue-box { bottom: 170px; }
      }
      @media (pointer: coarse) {
        .hud-item { padding: 10px 16px; }
      }
    `;
        document.head.appendChild(style);
    }
}
