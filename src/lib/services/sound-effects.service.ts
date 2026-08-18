"use client";

/**
 * SoundEffectsService — Synthesizes soft, realistic firecracker crackles, party popper pops,
 * and harmonious celebratory audio using the Web Audio API.
 * Completely client-side, zero external assets, soft on the ears with volume normalization.
 */
class SoundEffectsService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled = true;

  constructor() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("quizzer_sound_enabled");
      this.soundEnabled = stored !== null ? stored === "true" : true;
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Check if sound is enabled
   */
  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Toggle sound enabled/disabled with localStorage persistence
   */
  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (typeof window !== "undefined") {
      localStorage.setItem("quizzer_sound_enabled", String(enabled));
    }
  }

  /**
   * Helper: create a soft, organic mini firecracker / popper pop
   */
  private triggerMicroPop(ctx: AudioContext, time: number, pitch = 2200, volume = 0.08): void {
    try {
      // 1. Noise burst for the crackle snap
      const bufferSize = Math.floor(ctx.sampleRate * 0.025); // 25ms
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Exponential decay envelope on noise
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      // Bandpass filter to shape the pop frequency
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(pitch, time);
      filter.Q.setValueAtTime(3.0, time);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(volume, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.025);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(time);
      noise.stop(time + 0.025);

      // 2. Subtle low body thump for realism
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(pitch * 0.25, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + 0.03);

      oscGain.gain.setValueAtTime(volume * 0.4, time);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.03);
    } catch {
      // Fallback
    }
  }

  /**
   * Play soft Telegram-like firecracker burst with gentle multi-pop crackle + warm chime
   */
  public playCorrectSound(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Soft warm chime in background (E5 -> A5 harmonious uplifting tone)
    const osc = ctx.createOscillator();
    const chimeGain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5

    chimeGain.gain.setValueAtTime(0.0001, now);
    chimeGain.gain.linearRampToValueAtTime(0.09, now + 0.02);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc.connect(chimeGain);
    chimeGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);

    // 2. Realistic multi-crackle firecracker burst (4-5 micro pops staggered across 160ms)
    const cracklePops = [
      { delay: 0.00, pitch: 2400, vol: 0.09 },
      { delay: 0.03, pitch: 3100, vol: 0.07 },
      { delay: 0.065, pitch: 1900, vol: 0.08 },
      { delay: 0.11, pitch: 2700, vol: 0.06 },
      { delay: 0.15, pitch: 3400, vol: 0.05 },
    ];

    cracklePops.forEach(({ delay, pitch, vol }) => {
      this.triggerMicroPop(ctx, now + delay, pitch, vol);
    });
  }

  /**
   * Play soft celebration fanfare chime for 3, 5, 10 streaks
   */
  public playStreakCelebrationSound(streak: number): void {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Soft warm marimba / kalimba-like chime notes
    const notes =
      streak >= 5
        ? [523.25, 659.25, 783.99, 1046.5, 1318.51] // C5, E5, G5, C6, E6
        : [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.065;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.08, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });

    // Festive celebratory firecracker sparkle cluster after the chime
    const clusterStart = now + notes.length * 0.065;
    for (let i = 0; i < 6; i++) {
      const popDelay = clusterStart + i * 0.025 + Math.random() * 0.015;
      const pitch = 2200 + Math.random() * 1200;
      this.triggerMicroPop(ctx, popDelay, pitch, 0.06);
    }
  }

  /**
   * Play soft subtle wrong answer feedback (gentle low woodblock click)
   */
  public playWrongSound(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.14);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Play crisp, satisfying modern UI pop/chime when floating action bar appears or item selected
   */
  public playPopSound(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonic double-bubble chime (F5 -> C6 ~ 698Hz -> 1046Hz)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(698.46, now);
    osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.08);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);

    // Subtle crisp micro-click at start for tactile haptic feedback feel
    this.triggerMicroPop(ctx, now, 3200, 0.04);
  }

  /**
   * Play soft swoosh/dismiss sound when action bar is cleared
   */
  public playClearSound(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.09);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }
}

export const soundEffects = new SoundEffectsService();
