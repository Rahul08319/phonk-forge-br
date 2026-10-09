/**
 * Brazilian Phonk & Lo-Fi Synthesis Engine
 * Complete WebAudio DSP synthesis for:
 * - Memphis & Brazilian Phonk Cowbell (Roland TR-808 Dual-Oscillator Circuit Emulation)
 * - Heavy Brazilian Sub 808 with Pitch Envelope & Soft Saturation
 * - Punchy Phonk Kick with click transient & sub drop
 * - Aggressive Phonk Snare & Multi-burst Memphis Clap
 * - Metallic High-Frequency Sizzle Hi-Hats
 * - Lo-Fi Vinyl Crackle & Tape Saturation
 * - Real Offline 16-bit 44.1kHz WAV Rendering & Export
 */

export interface DrumHitOptions {
  velocity?: number;
  pitchOffset?: number; // In semitones
  decayMultiplier?: number;
}

export interface SoundPreset {
  name: string;
  bpm: number;
  description: string;
  pattern: {
    kick: boolean[];
    snare: boolean[];
    clap: boolean[];
    hihat: boolean[];
    openhat: boolean[];
    cowbell: boolean[];
  };
  bassNotes: number[]; // Step indices where bass hits
}

export class PhonkAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private waveshaper: WaveShaperNode | null = null;
  private vinylGain: GainNode | null = null;
  private vinylSource: AudioBufferSourceNode | null = null;
  private isVinylPlaying = false;

  public isInitialized = false;

  constructor() {
    // Lazy initialization on user gesture
  }

  public async init(): Promise<boolean> {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      this.isInitialized = true;
      return true;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master Chain: Nodes -> WaveShaper (Saturation) -> Compressor -> Analyser -> MasterGain -> Destination
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4.5, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

      // Soft Clipper WaveShaper
      this.waveshaper = this.ctx.createWaveShaper();
      this.waveshaper.curve = this.generateSoftDistortionCurve(0.4);
      this.waveshaper.oversample = '4x';

      // Connect Master Chain
      this.waveshaper.connect(this.compressor);
      this.compressor.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.error('Failed to init Phonk audio context', err);
      return false;
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public setMasterVolume(volumePercent: number, isMuted = false): void {
    if (!this.masterGain || !this.ctx) return;
    const vol = isMuted ? 0 : Math.max(0, Math.min(1, volumePercent / 100));
    this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.02);
  }

  public setDistortionAmount(amountPercent: number): void {
    if (!this.waveshaper) return;
    const norm = Math.max(0, Math.min(1, amountPercent / 100));
    this.waveshaper.curve = this.generateSoftDistortionCurve(norm);
  }

  /**
   * Generates a warm tape / tube soft-saturation transfer curve
   */
  private generateSoftDistortionCurve(amount: number): Float32Array {
    const k = amount * 25 + 1;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;

    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      // Hyperbolic tangent soft saturation with harmonic warmth
      if (amount <= 0.05) {
        curve[i] = x;
      } else {
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
    }
    return curve;
  }

  /**
   * Authentic Brazilian Phonk Kick
   * Dual oscillator pitch sweep with sharp transient click
   */
  public playKick(opts: DrumHitOptions = {}): void {
    if (!this.ctx || !this.waveshaper) return;
    const now = this.ctx.currentTime;
    const vel = opts.velocity ?? 1;

    // Body Oscillator (Sub sweep)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.32);

    oscGain.gain.setValueAtTime(0.95 * vel, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(oscGain);
    oscGain.connect(this.waveshaper);

    osc.start(now);
    osc.stop(now + 0.36);

    // Click Transient (Beater punch)
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    const clickFilter = this.ctx.createBiquadFilter();

    click.type = 'triangle';
    click.frequency.setValueAtTime(320, now);
    click.frequency.exponentialRampToValueAtTime(80, now + 0.03);

    clickFilter.type = 'highpass';
    clickFilter.frequency.setValueAtTime(800, now);

    clickGain.gain.setValueAtTime(0.4 * vel, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    click.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(this.waveshaper);

    click.start(now);
    click.stop(now + 0.04);
  }

  /**
   * Phonk Drift Snare
   * Tuned body oscillator combined with highpass noise crack
   */
  public playSnare(opts: DrumHitOptions = {}): void {
    if (!this.ctx || !this.waveshaper) return;
    const now = this.ctx.currentTime;
    const vel = opts.velocity ?? 1;

    // Body
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.1);

    oscGain.gain.setValueAtTime(0.7 * vel, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

    osc.connect(oscGain);
    oscGain.connect(this.waveshaper);
    osc.start(now);
    osc.stop(now + 0.15);

    // Noise layer
    const bufferSize = this.ctx.sampleRate * 0.22;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1500, now);
    noiseFilter.Q.setValueAtTime(1.5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.75 * vel, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.waveshaper);

    noise.start(now);
    noise.stop(now + 0.23);
  }

  /**
   * Memphis Style Multi-Burst Clap
   */
  public playClap(opts: DrumHitOptions = {}): void {
    if (!this.ctx || !this.waveshaper) return;
    const now = this.ctx.currentTime;
    const vel = opts.velocity ?? 1;

    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1300, now);
    filter.Q.setValueAtTime(2.2, now);

    const gain = this.ctx.createGain();
    // 3 subtle pre-bursts (simulating multiple hands clapping)
    gain.gain.setValueAtTime(0, now);
    gain.gain.setValueAtTime(0.6 * vel, now + 0.008);
    gain.gain.setValueAtTime(0.1, now + 0.012);
    gain.gain.setValueAtTime(0.7 * vel, now + 0.02);
    gain.gain.setValueAtTime(0.15, now + 0.024);
    gain.gain.setValueAtTime(0.85 * vel, now + 0.032);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.waveshaper);

    noise.start(now);
    noise.stop(now + 0.29);
  }

  /**
   * Sizzle Hi-Hat (Closed or Open)
   */
  public playHiHat(closed = true, opts: DrumHitOptions = {}): void {
    if (!this.ctx || !this.waveshaper) return;
    const now = this.ctx.currentTime;
    const vel = opts.velocity ?? 1;
    const duration = closed ? 0.06 : 0.28;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(closed ? 8500 : 6500, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55 * vel, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.waveshaper);

    noise.start(now);
    noise.stop(now + duration + 0.01);
  }

  /**
   * Iconic Roland TR-808 Memphis & Brazilian Phonk Cowbell
   * Dual square waves (540Hz & 800Hz) through high-Q resonant bandpass
   */
  public playCowbell(semitone = 0, opts: DrumHitOptions = {}): void {
    if (!this.ctx || !this.waveshaper) return;
    const now = this.ctx.currentTime;
    const vel = opts.velocity ?? 1;
    const pitchMultiplier = Math.pow(2, semitone / 12);

    const f1 = 540 * pitchMultiplier;
    const f2 = 800 * pitchMultiplier;
    const filterCenter = 840 * pitchMultiplier;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'square';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(f1, now);
    osc2.frequency.setValueAtTime(f2, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterCenter, now);
    filter.Q.setValueAtTime(3.8, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7 * vel, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.waveshaper);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  }

  /**
   * Heavy 808 Sub Bass with Glide and Overdrive
   * @param midiNote standard MIDI note number (e.g. 33 = A1)
   */
  public play808Bass(midiNote = 33, duration = 0.85, glideToNote?: number): void {
    if (!this.ctx || !this.waveshaper) return;
    const now = this.ctx.currentTime;
    const baseFreq = 440 * Math.pow(2, (midiNote - 69) / 12);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';

    // Punchy pitch envelope at attack
    osc.frequency.setValueAtTime(baseFreq * 1.5, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.035);

    if (glideToNote !== undefined) {
      const targetFreq = 440 * Math.pow(2, (glideToNote - 69) / 12);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, now + duration * 0.7);
    }

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, now);
    filter.Q.setValueAtTime(1.2, now);

    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.waveshaper);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  /**
   * Vinyl Lo-Fi Crackle Generator
   */
  public toggleVinylCrackle(enable: boolean, volume = 0.35): void {
    if (!this.ctx || !this.masterGain) return;

    if (!enable) {
      if (this.vinylSource) {
        try {
          this.vinylSource.stop();
          this.vinylSource.disconnect();
        } catch (_) {}
        this.vinylSource = null;
      }
      this.isVinylPlaying = false;
      return;
    }

    if (this.isVinylPlaying) {
      if (this.vinylGain) {
        this.vinylGain.gain.setTargetAtTime(volume * 0.4, this.ctx.currentTime, 0.05);
      }
      return;
    }

    // Generate 5-second seamless vinyl loop with pops and surface noise
    const length = this.ctx.sampleRate * 5;
    const buffer = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        // Continuous gentle pinkish surface hiss
        let sample = (Math.random() * 2 - 1) * 0.08;
        // Random micro dust clicks / pops
        if (Math.random() < 0.0007) {
          sample += (Math.random() * 2 - 1) * 0.75;
        }
        data[i] = sample;
      }
    }

    this.vinylSource = this.ctx.createBufferSource();
    this.vinylSource.buffer = buffer;
    this.vinylSource.loop = true;

    this.vinylGain = this.ctx.createGain();
    this.vinylGain.gain.setValueAtTime(volume * 0.4, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    this.vinylSource.connect(filter);
    filter.connect(this.vinylGain);
    this.vinylGain.connect(this.masterGain);

    this.vinylSource.start();
    this.isVinylPlaying = true;
  }

  /**
   * Real Offline WAV Renderer
   * Renders the current sequence and returns a downloadable WAV Blob!
   */
  public async renderTrackToWav(
    bpm: number,
    pattern: {
      kick: boolean[];
      snare: boolean[];
      clap?: boolean[];
      hihat: boolean[];
      openhat?: boolean[];
      cowbell: boolean[];
    },
    cowbellMelody: number[], // Semitone offset per step
    bassNotes: { step: number; midiNote: number }[],
    bars = 2
  ): Promise<Blob> {
    const sampleRate = 44100;
    const totalSteps = 16 * bars;
    const stepDuration = 60 / bpm / 4;
    const totalSeconds = totalSteps * stepDuration + 1.5; // Include release tails

    const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * totalSeconds), sampleRate);

    // Build offline effects chain
    const comp = offlineCtx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-14, 0);
    comp.ratio.setValueAtTime(4, 0);
    comp.connect(offlineCtx.destination);

    const sat = offlineCtx.createWaveShaper();
    sat.curve = this.generateSoftDistortionCurve(0.35);
    sat.connect(comp);

    // Schedule all drum steps
    for (let bar = 0; bar < bars; bar++) {
      for (let s = 0; s < 16; s++) {
        const globalStep = bar * 16 + s;
        const time = globalStep * stepDuration;

        // Kick
        if (pattern.kick[s]) {
          const osc = offlineCtx.createOscillator();
          const g = offlineCtx.createGain();
          osc.frequency.setValueAtTime(160, time);
          osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
          g.gain.setValueAtTime(0.95, time);
          g.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
          osc.connect(g);
          g.connect(sat);
          osc.start(time);
          osc.stop(time + 0.36);
        }

        // Snare
        if (pattern.snare[s]) {
          const osc = offlineCtx.createOscillator();
          const g = offlineCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(220, time);
          osc.frequency.exponentialRampToValueAtTime(130, time + 0.1);
          g.gain.setValueAtTime(0.7, time);
          g.gain.exponentialRampToValueAtTime(0.01, time + 0.14);
          osc.connect(g);
          g.connect(sat);
          osc.start(time);
          osc.stop(time + 0.15);
        }

        // Hi-Hat
        if (pattern.hihat[s]) {
          const buf = offlineCtx.createBuffer(1, Math.floor(sampleRate * 0.05), sampleRate);
          const chData = buf.getChannelData(0);
          for (let i = 0; i < chData.length; i++) chData[i] = Math.random() * 2 - 1;
          const src = offlineCtx.createBufferSource();
          src.buffer = buf;
          const filt = offlineCtx.createBiquadFilter();
          filt.type = 'highpass';
          filt.frequency.setValueAtTime(8000, time);
          const g = offlineCtx.createGain();
          g.gain.setValueAtTime(0.5, time);
          g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
          src.connect(filt);
          filt.connect(g);
          g.connect(sat);
          src.start(time);
          src.stop(time + 0.06);
        }

        // Cowbell
        if (pattern.cowbell[s]) {
          const semi = cowbellMelody[s] ?? 0;
          const pMult = Math.pow(2, semi / 12);
          const o1 = offlineCtx.createOscillator();
          const o2 = offlineCtx.createOscillator();
          o1.type = 'square';
          o2.type = 'square';
          o1.frequency.setValueAtTime(540 * pMult, time);
          o2.frequency.setValueAtTime(800 * pMult, time);

          const filt = offlineCtx.createBiquadFilter();
          filt.type = 'bandpass';
          filt.frequency.setValueAtTime(840 * pMult, time);
          filt.Q.setValueAtTime(3.8, time);

          const g = offlineCtx.createGain();
          g.gain.setValueAtTime(0.7, time);
          g.gain.exponentialRampToValueAtTime(0.001, time + 0.38);

          o1.connect(filt);
          o2.connect(filt);
          filt.connect(g);
          g.connect(sat);

          o1.start(time);
          o2.start(time);
          o1.stop(time + 0.4);
          o2.stop(time + 0.4);
        }
      }
    }

    // Schedule 808 Bass Hits
    for (let bar = 0; bar < bars; bar++) {
      for (const b of bassNotes) {
        const time = (bar * 16 + b.step) * stepDuration;
        const baseFreq = 440 * Math.pow(2, (b.midiNote - 69) / 12);

        const osc = offlineCtx.createOscillator();
        const g = offlineCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * 1.5, time);
        osc.frequency.exponentialRampToValueAtTime(baseFreq, time + 0.035);

        g.gain.setValueAtTime(0.85, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.8);

        osc.connect(g);
        g.connect(sat);
        osc.start(time);
        osc.stop(time + 0.85);
      }
    }

    const renderedBuffer = await offlineCtx.startRendering();
    return this.audioBufferToWav(renderedBuffer);
  }

  /**
   * Encodes AudioBuffer into standard 16-bit PCM RIFF WAV format Blob
   */
  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataLength = buffer.length * blockAlign;
    const headerLength = 44;
    const totalLength = headerLength + dataLength;

    const arrayBuffer = new ArrayBuffer(totalLength);
    const view = new DataView(arrayBuffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Interleave channels & write samples
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = buffer.getChannelData(ch)[i];
        sample = Math.max(-1, Math.min(1, sample));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

// Global Singleton
export const phonkEngine = new PhonkAudioEngine();
