/**
 * OVERCLOCKED: KERNEL SLAYER - Industrial Acoustic Engine
 * Procedural Web Audio Foley & Interactive Dynamic Industrial Synth
 * Designed by Enes Öztürk
 */

class IndustrialAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Music sequencer state
  private isPlayingMusic: boolean = false;
  private step: number = 0;
  private timerId: number | null = null;
  private baseBpm: number = 130;
  private currentBpm: number = 130;
  private duckingGain: GainNode | null = null;

  // Drone / server room background
  private serverHumOsc: OscillatorNode | null = null;
  private serverHumGain: GainNode | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.duckingGain = this.ctx.createGain();
      this.duckingGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.duckingGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      this.musicGain.connect(this.duckingGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.startServerHum();
      this.startMusicLoop();
    } catch (e) {
      console.warn('Web Audio not allowed or supported yet', e);
    }
  }

  public ensureContext() {
    if (!this.ctx) {
      this.init();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  private startServerHum() {
    if (!this.ctx || !this.masterGain) return;
    try {
      this.serverHumOsc = this.ctx.createOscillator();
      this.serverHumOsc.type = 'sawtooth';
      this.serverHumOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, this.ctx.currentTime);

      this.serverHumGain = this.ctx.createGain();
      this.serverHumGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.serverHumOsc.connect(filter);
      filter.connect(this.serverHumGain);
      this.serverHumGain.connect(this.masterGain);
      this.serverHumOsc.start();
    } catch (e) {
      console.error(e);
    }
  }

  public updateBattleIntensity(combo: number, isOverclocked: boolean, heatPercent: number) {
    if (!this.ctx) return;
    // Dynamic tempo calculation
    const extraBpm = Math.min(combo * 2.5, 35) + (isOverclocked ? 25 : 0);
    this.currentBpm = this.baseBpm + extraBpm;

    if (this.serverHumGain) {
      const humVol = 0.08 + (heatPercent * 0.12);
      this.serverHumGain.gain.setTargetAtTime(humVol, this.ctx.currentTime, 0.1);
    }
  }

  private startMusicLoop() {
    if (this.isPlayingMusic) return;
    this.isPlayingMusic = true;

    const scheduleNext = () => {
      if (!this.isPlayingMusic) return;
      this.playSequencerStep();
      const intervalMs = (60 / this.currentBpm / 4) * 1000; // 16th notes
      this.timerId = window.setTimeout(scheduleNext, intervalMs);
    };

    scheduleNext();
  }

  private playSequencerStep() {
    if (!this.ctx || !this.musicGain || this.isMuted) {
      this.step = (this.step + 1) % 16;
      return;
    }

    const t = this.ctx.currentTime;
    const step = this.step;

    // 4-on-the-floor heavy industrial kick on beats 0, 4, 8, 12
    if (step % 4 === 0) {
      this.synthIndustrialKick(t);
    }

    // Heavy metallic snare / press impact on beats 4 and 12
    if (step === 4 || step === 12) {
      this.synthMetallicSnare(t);
    }

    // Hi-hat / cyber clock ticking on every offbeat
    if (step % 2 === 1) {
      this.synthCyberHat(t, step % 4 === 1 ? 0.08 : 0.04);
    }

    // Heavy distorted bass riff (E minor cyber bass: E1, G1, A1, D1)
    if (step % 2 === 0) {
      const bassNotes = [41.2, 41.2, 49.0, 41.2, 55.0, 41.2, 36.7, 41.2];
      const freq = bassNotes[(step / 2) % bassNotes.length];
      this.synthIndustrialBass(t, freq);
    }

    this.step = (this.step + 1) % 16;
  }

  private synthIndustrialKick(time: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.23);
  }

  private synthMetallicSnare(time: number) {
    if (!this.ctx || !this.musicGain) return;
    // Anvil noise + tone
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.03));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.16);

    // Metal anvil resonance
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(680, time);
    const metalGain = this.ctx.createGain();
    metalGain.gain.setValueAtTime(0.3, time);
    metalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    osc.connect(metalGain);
    metalGain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.19);
  }

  private synthCyberHat(time: number, volume: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(4500, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.045);
  }

  private synthIndustrialBass(time: number, freq: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.exponentialRampToValueAtTime(140, time + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.17);
  }

  // Foley SFX

  /** Blade swing sound with high-frequency plasma whine */
  public playSwordSwing(charge: number = 0) {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260 + charge * 200, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.Q.setValueAtTime(4.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4 + charge * 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.21);
  }

  /** Hit-Stop: milisaniye silence + massive sub-bass impact + metal tear */
  public playMeshSliceImpact() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // 1. Hit-stop audio ducking for 45ms
    if (this.duckingGain) {
      this.duckingGain.gain.cancelScheduledValues(t);
      this.duckingGain.gain.setValueAtTime(0.05, t);
      this.duckingGain.gain.setValueAtTime(0.05, t + 0.045);
      this.duckingGain.gain.exponentialRampToValueAtTime(1.0, t + 0.14);
    }

    // 2. Sub-bass tectonic boom (40Hz)
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(110, t + 0.04);
    subOsc.frequency.exponentialRampToValueAtTime(35, t + 0.3);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.85, t + 0.04);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t + 0.04);
    subOsc.stop(t + 0.36);

    // 3. Clashing Titanium & Metal Shred
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const metalFilter = this.ctx.createBiquadFilter();
    metalFilter.type = 'bandpass';
    metalFilter.frequency.setValueAtTime(2400, t + 0.04);
    metalFilter.Q.setValueAtTime(6.0, t + 0.04);

    const metalGain = this.ctx.createGain();
    metalGain.gain.setValueAtTime(0.7, t + 0.04);
    metalGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    noise.connect(metalFilter);
    metalFilter.connect(metalGain);
    metalGain.connect(this.sfxGain);
    noise.start(t + 0.04);
    noise.stop(t + 0.23);
  }

  /** The Compiler Cannon shot: High-density digital packet blast */
  public playCompilerCannonShot(isNullPointer: boolean = false) {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = isNullPointer ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isNullPointer ? 900 : 450, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isNullPointer ? 0.75 : 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  /** Pointer Teleportation (*ptr = &Enes) sound: Hyper-spatial blink */
  public playTeleport() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(1600, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.16);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  /** Overclock Mode voltage toggle */
  public playOverclockToggle(enabled: boolean) {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    if (enabled) {
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.25);
    } else {
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.2);
    }

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.32);
  }

  /** Coolant vent steam purge */
  public playCoolantPurge() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.12));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, t);
    filter.Q.setValueAtTime(2.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.42);
  }

  /** Thermal limit warning beep */
  public playThermalAlarm() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1800, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  /** Enes visor damage crack sound */
  public playVisorDamage() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(3200, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.17);
  }

  public dispose() {
    this.isPlayingMusic = false;
    if (this.timerId) clearTimeout(this.timerId);
    if (this.serverHumOsc) {
      try { this.serverHumOsc.stop(); } catch { /* ignore */ }
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const soundEngine = new IndustrialAudioEngine();
