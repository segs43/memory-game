export class AudioSystem {
  private ctx: AudioContext | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  private ambientGain: GainNode | null = null;
  private ready = false;

  init(): void {
    try {
      this.ctx = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      this.ambientGain.connect(this.ctx.destination);
      this.ready = true;
      this.startAmbient();
    } catch {
      this.ready = false;
    }
  }

  resume(): void {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  private startAmbient(): void {
    if (!this.ctx || !this.ambientGain) return;
    const freqs = [55, 110, 165];
    freqs.forEach(freq => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(this.ambientGain!);
      osc.start();
      this.ambientOscillators.push(osc);
    });
  }

  setCorruptionLevel(level: number): void {
    if (!this.ctx || !this.ambientGain) return;
    // More distortion as corruption rises
    const vol = 0.02 + level * 0.06;
    this.ambientGain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.5);
    // Detune oscillators for eerie effect
    this.ambientOscillators.forEach((osc, i) => {
      osc.detune.linearRampToValueAtTime(level * (i + 1) * 30, this.ctx!.currentTime + 0.5);
    });
  }

  playGlitch(): void {
    if (!this.ctx || !this.ready) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 200 + Math.random() * 600;
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playMemorySteal(): void {
    if (!this.ctx || !this.ready) return;
    this.resume();
    const now = this.ctx.currentTime;
    const freqs = [880, 660, 440, 220];
    freqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.08, now + i * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);
      osc.connect(gain).connect(this.ctx!.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.3);
    });
  }

  destroy(): void {
    this.ambientOscillators.forEach(o => { try { o.stop(); } catch { /* already stopped */ } });
    this.ambientOscillators = [];
    this.ctx?.close();
  }
}
