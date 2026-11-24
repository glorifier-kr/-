const SNOWBOARD_INTRO_SFX_URL =
  '/assets/aistudio/public_audio_sfx_snowboard-intro_1ad4c1f0.mp3';
const SNOWBOARD_GLIDE_LOOP_SFX_URL =
  '/assets/aistudio/public_audio_sfx_snowboard-glide-loop_147ad8a8.mp3';

// Hybrid Web Audio API winter foley + real uploaded snowboard MP3 SFX engine
export class VillageAudio {
  private ctx: AudioContext | null = null;
  private muted = false;
  private musicTimer: number | null = null;
  private noteIdx = 0;

  // Real uploaded snowboard intro & looping glide audio elements
  private snowboardIntroEl: HTMLAudioElement | null = null;
  private snowboardGlideEl: HTMLAudioElement | null = null;
  private glideVolume = 0;
  private glidePlaying = false;

  constructor() {
    if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
      const intro = new Audio(SNOWBOARD_INTRO_SFX_URL);
      intro.preload = 'auto';
      intro.volume = 0.62;
      this.snowboardIntroEl = intro;

      const glide = new Audio(SNOWBOARD_GLIDE_LOOP_SFX_URL);
      glide.preload = 'auto';
      glide.loop = true;
      glide.volume = 0;
      this.snowboardGlideEl = glide;
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stopMusicBox();
      this.stopSnowboardGlide();
      if (this.snowboardIntroEl) {
        this.snowboardIntroEl.pause();
        this.snowboardIntroEl.currentTime = 0;
      }
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  // Plays the user-supplied snowboard intro MP3 when stepping onto snow
  public playSnowboardIntro(): void {
    if (this.muted || !this.snowboardIntroEl) return;
    try {
      this.snowboardIntroEl.currentTime = 0;
      this.snowboardIntroEl.volume = 0.62;
      void this.snowboardIntroEl.play().catch(() => {});
    } catch {
      // Ignore autoplay restriction prior to first user gesture
    }
  }

  // Smoothly modulates & loops the user-supplied snowboard glide MP3 while carving on snow
  public updateSnowboardGlide(active: boolean, speedRatio: number, dt: number): void {
    const el = this.snowboardGlideEl;
    if (!el) return;

    const shouldPlay = active && !this.muted;
    const clampedSpeed = Math.max(0, Math.min(1, speedRatio));
    const targetVol = shouldPlay ? 0.14 + clampedSpeed * 0.44 : 0;
    const fadeSpeed = shouldPlay ? 8.5 : 11.0;
    const k = 1 - Math.exp(-fadeSpeed * dt);
    this.glideVolume += (targetVol - this.glideVolume) * k;

    if (shouldPlay && !this.glidePlaying && this.glideVolume > 0.015) {
      this.glidePlaying = true;
      el.volume = Math.max(0, Math.min(1, this.glideVolume));
      void el.play().catch(() => {
        this.glidePlaying = false;
      });
    }

    if (this.glidePlaying) {
      if (this.glideVolume <= 0.008 && !shouldPlay) {
        this.glideVolume = 0;
        el.volume = 0;
        el.pause();
        this.glidePlaying = false;
      } else {
        el.volume = Math.max(0, Math.min(1, this.glideVolume));
        el.playbackRate = 0.92 + clampedSpeed * 0.24;
      }
    }
  }

  public stopSnowboardGlide(): void {
    this.glideVolume = 0;
    this.glidePlaying = false;
    if (this.snowboardGlideEl) {
      this.snowboardGlideEl.pause();
      this.snowboardGlideEl.volume = 0;
      try {
        this.snowboardGlideEl.currentTime = 0;
      } catch {
        // Ignore if metadata not loaded yet
      }
    }
  }

  public playFootstep(onBridge: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (onBridge) {
      // Soft wooden plank tap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const base = 155 + (Math.random() - 0.5) * 28;
      osc.frequency.setValueAtTime(base, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.075);
      return;
    }

    // Crisp snow/cobble crunch via short bandpass noise
    const bufLen = Math.floor(ctx.sampleRate * 0.055);
    const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.35));
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400 + (Math.random() - 0.5) * 350;
    filter.Q.value = 1.6;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.065, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(now);
  }

  public playHop(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const startFreq = 320 * (0.94 + Math.random() * 0.12);
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.75, now + 0.11);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playModeSwitch(toSnowboard: boolean): void {
    if (toSnowboard) {
      this.playSnowboardIntro();
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.08);
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playLiftBell(boarding: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = boarding ? [587.33, 880.0] : [659.25, 493.88];

    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t0 = now + idx * 0.09;
      osc.frequency.setValueAtTime(f, t0);
      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(0.11, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.48);
    });
  }

  public playStarCollect(allCollected: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = allCollected
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
      : [659.25, 880.0, 1174.66];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t0 = now + i * 0.075;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(0.12, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.48);
    });
  }

  public playAirTrick(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t0 = now + i * 0.055;
      osc.frequency.setValueAtTime(freq, t0);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.06, t0 + 0.16);
      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(0.095, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.24);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.26);
    });
  }

  public playNpcChime(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [587.33, 739.99, 880.0];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t0 = now + i * 0.065;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(0.085, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.34);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.36);
    });
  }

  // Gentle festive winter music-box loop while playing
  public startMusicBox(): void {
    if (this.muted || this.musicTimer !== null) return;
    const melody = [
      392.0, 493.88, 587.33, 783.99, 659.25, 587.33, 493.88, 440.0,
      392.0, 440.0, 493.88, 587.33, 523.25, 493.88, 440.0, 392.0,
    ];
    this.musicTimer = window.setInterval(() => {
      if (this.muted) return;
      const ctx = this.ctx;
      if (!ctx || ctx.state !== 'running') return;
      const now = ctx.currentTime;
      const freq = melody[this.noteIdx % melody.length];
      this.noteIdx++;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0005, now);
      gain.gain.linearRampToValueAtTime(0.022, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.65);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.68);
    }, 520);
  }

  public stopMusicBox(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public dispose(): void {
    this.stopMusicBox();
    this.stopSnowboardGlide();
    if (this.snowboardIntroEl) {
      this.snowboardIntroEl.pause();
      this.snowboardIntroEl = null;
    }
    this.snowboardGlideEl = null;
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
