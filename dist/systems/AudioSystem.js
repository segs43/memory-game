// src/systems/AudioSystem.ts
// ─────────────────────────────────────────────────────────────
// Dynamic audio using Web Audio API.
// No external audio files — 100% procedural sound synthesis.
// Corruption-reactive: pitch, distortion and filter cutoff
// change based on the current corruption tier.
// ─────────────────────────────────────────────────────────────
import { bus } from '@core/EventBus.js';
import { getState } from '@core/GameState.js';
export class AudioSystem {
    ctx = null;
    masterGain = null;
    ambientNodes = [];
    _ready = false;
    init() {
        bus.on('audio:playSteal', () => this.playSteal());
        bus.on('audio:playGlitch', () => this.playGlitch());
        bus.on('audio:playAmbient', () => this.startAmbient());
    }
    /**
     * AudioContext must be created in response to a user gesture.
     * Call this on first interaction.
     */
    unlock() {
        if (this._ready)
            return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.6;
            this.masterGain.connect(this.ctx.destination);
            this._ready = true;
            this.startAmbient();
        }
        catch {
            // Audio not available — silent fallback
        }
    }
    destroy() {
        this.stopAmbient();
        this.ctx?.close();
        this._ready = false;
    }
    // ── Memory steal SFX ──────────────────────────────────────────
    playSteal() {
        if (!this._ready || !this.ctx || !this.masterGain)
            return;
        const ctx = this.ctx;
        const { memoriesStolen } = getState();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80 + memoriesStolen * 30, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4);
        filter.type = 'lowpass';
        filter.frequency.value = 1200 - memoriesStolen * 80;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
    }
    // ── Glitch SFX ────────────────────────────────────────────────
    playGlitch() {
        if (!this._ready || !this.ctx || !this.masterGain)
            return;
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 200 + Math.random() * 800;
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
    }
    // ── Ambient drone ──────────────────────────────────────────────
    startAmbient() {
        if (!this._ready || !this.ctx || !this.masterGain)
            return;
        if (this.ambientNodes.length > 0)
            return; // already running
        const ctx = this.ctx;
        const { memoriesStolen } = getState();
        // Two detuned oscillators for a beating drone effect
        const baseFreq = 55 + memoriesStolen * 4;
        const tones = [baseFreq, baseFreq * 1.001, baseFreq * 0.5];
        for (const freq of tones) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.value = 0.03;
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start();
            this.ambientNodes.push(osc);
        }
    }
    stopAmbient() {
        for (const node of this.ambientNodes) {
            try {
                node.stop();
            }
            catch { /* already stopped */ }
        }
        this.ambientNodes = [];
    }
    /**
     * Update ambient pitch based on current corruption level.
     * Call periodically from the game loop.
     */
    updateAmbient() {
        if (!this._ready || !this.ctx)
            return;
        const { memoriesStolen } = getState();
        const baseFreq = 55 + memoriesStolen * 4;
        this.ambientNodes.forEach((osc, i) => {
            const detune = [0, 0.001, -0.5][i] ?? 0;
            osc.frequency.setTargetAtTime(baseFreq + detune * baseFreq, this.ctx.currentTime, 1.0);
        });
    }
}
