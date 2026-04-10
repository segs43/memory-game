export class AudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientNodes: OscillatorNode[] = [];
  private ambientGain: GainNode | null = null;
  private ready = false;

  init(): void {
    try {
      const AudioCtx = window.AudioContext ?? (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.025, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.ready = true;
      this.buildAmbient();
    } catch {
      this.ready = false;
    }
  }

  resume(): void {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  // ── Ambient drone ──────────────────────────────────────────────────────────

  private buildAmbient(): void {
    if (!this.ctx || !this.ambientGain) return;
    // Four-voice drone: root + fifth + octave + slight dissonance
    const freqs = [55, 82.5, 110, 111.5];
    freqs.forEach((freq, i) => {
      const osc  = this.ctx!.createOscillator();
      const lfo  = this.ctx!.createOscillator();
      const lfoG = this.ctx!.createGain();

      osc.type      = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);

      // Slow tremolo via LFO
      lfo.frequency.setValueAtTime(0.08 + i * 0.05, this.ctx!.currentTime);
      lfoG.gain.setValueAtTime(3, this.ctx!.currentTime);
      lfo.connect(lfoG);
      lfoG.connect(osc.frequency);

      osc.connect(this.ambientGain!);
      lfo.start();
      osc.start();
      this.ambientNodes.push(osc);
    });
  }

  setCorruptionLevel(level: number): void {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    // Volume swells with corruption
    this.ambientGain.gain.linearRampToValueAtTime(0.025 + level * 0.07, now + 0.8);
    // Detune drifts — each voice gets progressively more unstable
    this.ambientNodes.forEach((osc, i) => {
      const drift = level * (i + 1) * 18 * Math.sin(now * 0.1 + i);
      osc.detune.linearRampToValueAtTime(drift, now + 1.2);
    });
  }

  // ── Sound effects ──────────────────────────────────────────────────────────

  playGlitch(): void {
    if (!this.ready || !this.ctx || !this.masterGain) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const dist = this.ctx.createWaveShaper();

    // Harsh distortion curve
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 300) * x / (Math.PI + 300 * Math.abs(x));
    }
    dist.curve = curve;

    osc.type            = 'sawtooth';
    osc.frequency.value = 180 + Math.random() * 500;
    osc.frequency.exponentialRampToValueAtTime(80 + Math.random() * 200, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(dist).connect(gain).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playMemorySteal(): void {
    if (!this.ready || !this.ctx || !this.masterGain) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Descending horror sting
    const freqs = [1200, 900, 600, 350, 180];
    freqs.forEach((freq, i) => {
      const osc  = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t    = now + i * 0.07;

      osc.type            = i < 2 ? 'square' : 'sawtooth';
      osc.frequency.value = freq;
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, t + 0.3);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.09, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain).connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.4);
    });

    // Low impact thud
    const noise  = this.ctx.createOscillator();
    const nGain  = this.ctx.createGain();
    noise.type            = 'sine';
    noise.frequency.value = 60;
    noise.frequency.exponentialRampToValueAtTime(20, now + 0.3);
    nGain.gain.setValueAtTime(0.25, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    noise.connect(nGain).connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.4);
  }

  destroy(): void {
    this.ambientNodes.forEach(o => { try { o.stop(); } catch { /* already stopped */ } });
    this.ambientNodes = [];
    this.ctx?.close();
    this.ctx        = null;
    this.masterGain = null;
    this.ambientGain = null;
    this.ready      = false;
  }
}
