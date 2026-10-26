// Tiny WebAudio synth — no assets, no dependencies.
export class SoundFX {
  private ctx: AudioContext | null = null;
  private muted = false;

  setMuted(m: boolean): void {
    this.muted = m;
  }

  isMuted(): boolean {
    return this.muted;
  }

  unlock(): void {
    if (this.muted) return;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended' || (this.ctx.state as string) === 'interrupted') {
        void this.ctx.resume();
      }
      // Play a short silent buffer to prime audio on iOS Safari
      const buffer = this.ctx.createBuffer(1, 1, 22050);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(0);
    } catch {
      // Audio not supported or blocked
    }
  }

  private ensure(): AudioContext | null {
    if (this.muted) return null;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended' || (this.ctx.state as string) === 'interrupted') {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private blip(freqA: number, freqB: number, dur: number, type: OscillatorType, gain: number): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqA, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqB), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  flap(): void {
    this.blip(420, 640, 0.09, 'square', 0.05);
  }

  score(): void {
    this.blip(880, 1320, 0.12, 'sine', 0.08);
  }

  hit(): void {
    this.blip(220, 70, 0.22, 'sawtooth', 0.09);
  }

  swoosh(): void {
    this.blip(300, 520, 0.1, 'triangle', 0.04);
  }
}
