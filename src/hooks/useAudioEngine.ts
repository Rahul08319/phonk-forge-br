import { useRef, useCallback, useEffect, useState } from 'react';

export interface FXSettings {
  distortion: number; // 0 - 100
  filterFreq: number; // 200 - 20000 Hz
  filterType: 'lowpass' | 'highpass';
  reverbAmount: number; // 0 - 100
  vinylCrackle: boolean;
  vinylAmount: number; // 0 - 100
}

export const useAudioEngine = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const distortionNodeRef = useRef<WaveShaperNode | null>(null);
  const reverbGainRef = useRef<GainNode | null>(null);
  const vinylSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const vinylGainRef = useRef<GainNode | null>(null);
  const lastBassNoteRef = useRef<number>(33); // A1 default
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Helper to make distortion curve (Sigmoid soft clipping)
  const makeDistortionCurve = (amount: number = 20) => {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  };

  // Helper to generate simple algorithmic reverb impulse
  const createReverbImpulse = (ctx: AudioContext, duration: number = 2.2, decay: number = 2.5) => {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = length - i;
      left[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
      right[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
    }
    return impulse;
  };

  // Helper to generate procedural vinyl crackle buffer
  const createVinylCrackleBuffer = (ctx: AudioContext) => {
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Pink noise + sparse clicks
      const white = Math.random() * 2 - 1;
      const click = Math.random() < 0.0008 ? (Math.random() * 0.8 + 0.2) : 0;
      output[i] = white * 0.015 + click;
    }
    return buffer;
  };

  const initAudioContext = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      setIsInitialized(true);
      return audioContextRef.current;
    }

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;

      // 1. Analyser Node
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      analyserRef.current = analyser;

      // 2. Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.75, ctx.currentTime);
      gainNodeRef.current = masterGain;

      // 3. Distortion / Saturation
      const distortion = ctx.createWaveShaper();
      distortion.curve = makeDistortionCurve(15);
      distortion.oversample = '4x';
      distortionNodeRef.current = distortion;

      // 4. Master Filter (DJ Sweep)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(20000, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);
      filterNodeRef.current = filter;

      // 5. Reverb Convolver
      const convolver = ctx.createConvolver();
      convolver.buffer = createReverbImpulse(ctx);
      const reverbGain = ctx.createGain();
      reverbGain.gain.setValueAtTime(0.2, ctx.currentTime);
      reverbGainRef.current = reverbGain;

      // Vinyl noise gain
      const vinylGain = ctx.createGain();
      vinylGain.gain.setValueAtTime(0, ctx.currentTime);
      vinylGainRef.current = vinylGain;

      // Routing: Source/Instruments -> Filter -> Distortion -> MasterGain -> Analyser -> Destination
      filter.connect(distortion);
      distortion.connect(masterGain);
      
      // Parallel Reverb send
      filter.connect(convolver);
      convolver.connect(reverbGain);
      reverbGain.connect(masterGain);

      masterGain.connect(analyser);
      analyser.connect(ctx.destination);

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      setIsInitialized(true);
      return ctx;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      return null;
    }
  }, []);

  // Update Vinyl Crackle effect
  const setVinylCrackle = useCallback((enabled: boolean, amount: number = 30) => {
    if (!audioContextRef.current || !vinylGainRef.current) return;
    const ctx = audioContextRef.current;
    
    if (enabled) {
      if (!vinylSourceRef.current) {
        const source = ctx.createBufferSource();
        source.buffer = createVinylCrackleBuffer(ctx);
        source.loop = true;
        source.connect(vinylGainRef.current);
        vinylGainRef.current.connect(gainNodeRef.current || ctx.destination);
        source.start();
        vinylSourceRef.current = source;
      }
      vinylGainRef.current.gain.setTargetAtTime((amount / 100) * 0.4, ctx.currentTime, 0.05);
    } else {
      if (vinylGainRef.current) {
        vinylGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      }
    }
  }, []);

  // Set Master Volume
  const setMasterVolume = useCallback((volume: number, isMuted: boolean = false) => {
    if (gainNodeRef.current && audioContextRef.current) {
      const actualVolume = isMuted ? 0 : Math.max(0, Math.min(1, volume / 100));
      gainNodeRef.current.gain.setTargetAtTime(actualVolume, audioContextRef.current.currentTime, 0.02);
    }
  }, []);

  // Set FX Rack parameters
  const updateFX = useCallback((settings: Partial<FXSettings>) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;

    if (settings.distortion !== undefined && distortionNodeRef.current) {
      distortionNodeRef.current.curve = makeDistortionCurve(settings.distortion);
    }

    if (settings.filterFreq !== undefined && filterNodeRef.current) {
      filterNodeRef.current.frequency.setTargetAtTime(settings.filterFreq, ctx.currentTime, 0.04);
    }

    if (settings.filterType !== undefined && filterNodeRef.current) {
      filterNodeRef.current.type = settings.filterType;
    }

    if (settings.reverbAmount !== undefined && reverbGainRef.current) {
      reverbGainRef.current.gain.setTargetAtTime((settings.reverbAmount / 100) * 0.8, ctx.currentTime, 0.04);
    }

    if (settings.vinylCrackle !== undefined || settings.vinylAmount !== undefined) {
      setVinylCrackle(settings.vinylCrackle ?? false, settings.vinylAmount ?? 30);
    }
  }, [setVinylCrackle]);

  // Load User Audio File
  const loadAudioFile = useCallback(async (file: File) => {
    const ctx = await initAudioContext();
    if (!ctx) return null;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      audioBufferRef.current = audioBuffer;
      return audioBuffer;
    } catch (error) {
      console.error('Failed to load audio file:', error);
      return null;
    }
  }, [initAudioContext]);

  // Generate an authentic procedural Brazilian Phonk Loop buffer
  const generatePhonkDemoBuffer = useCallback(async (bpm: number = 85) => {
    const ctx = await initAudioContext();
    if (!ctx) return null;

    const sampleRate = ctx.sampleRate;
    const barDuration = (60 / bpm) * 4; // 1 bar (4 beats)
    const totalBars = 2;
    const duration = barDuration * totalBars;
    const buffer = ctx.createBuffer(2, sampleRate * duration, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const stepTime = barDuration / 16;
    const totalSteps = 16 * totalBars;

    // Phonk Cowbell tuned frequencies
    const cowbellFrequencies = [587.33, 659.25, 783.99, 880.00, 587.33];

    for (let step = 0; step < totalSteps; step++) {
      const startTime = step * stepTime;
      const startSample = Math.floor(startTime * sampleRate);

      // Kick on 1, 5, 9, 13 (four on the floor / phonk bounce)
      if (step % 4 === 0 || step % 16 === 10) {
        const kickLen = Math.floor(0.25 * sampleRate);
        for (let i = 0; i < kickLen && startSample + i < left.length; i++) {
          const t = i / sampleRate;
          const freq = 140 * Math.exp(-t * 28) + 38;
          const amp = Math.exp(-t * 12) * 0.7;
          const val = Math.sin(2 * Math.PI * freq * t) * amp;
          left[startSample + i] += val;
          right[startSample + i] += val;
        }
      }

      // Snare on beat 3 and 7 (every 8th step offset)
      if (step % 8 === 4) {
        const snareLen = Math.floor(0.2 * sampleRate);
        for (let i = 0; i < snareLen && startSample + i < left.length; i++) {
          const t = i / sampleRate;
          const tone = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 18) * 0.4;
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 14) * 0.35;
          const val = tone + noise;
          left[startSample + i] += val;
          right[startSample + i] += val;
        }
      }

      // Hi-Hat on odd steps
      if (step % 2 === 1) {
        const hatLen = Math.floor(0.06 * sampleRate);
        for (let i = 0; i < hatLen && startSample + i < left.length; i++) {
          const t = i / sampleRate;
          const val = (Math.random() * 2 - 1) * Math.exp(-t * 50) * 0.18;
          left[startSample + i] += val * 0.8;
          right[startSample + i] += val * 1.1; // stereo spread
        }
      }

      // Iconic Brazilian Phonk Cowbell syncopated riff
      if ([2, 5, 8, 11, 14].includes(step % 16)) {
        const cowbellFreq = cowbellFrequencies[(step / 2) % cowbellFrequencies.length] || 587.33;
        const cowbellLen = Math.floor(0.28 * sampleRate);
        for (let i = 0; i < cowbellLen && startSample + i < left.length; i++) {
          const t = i / sampleRate;
          // Dual square waves with metallic ring
          const sq1 = Math.sin(2 * Math.PI * cowbellFreq * t) > 0 ? 1 : -1;
          const sq2 = Math.sin(2 * Math.PI * (cowbellFreq * 1.48) * t) > 0 ? 1 : -1;
          const env = Math.exp(-t * 16) * 0.32;
          const val = (sq1 * 0.5 + sq2 * 0.5) * env;
          left[startSample + i] += val;
          right[startSample + i] += val;
        }
      }

      // Deep 808 Sub Bass note on bar 1 and bar 2
      if (step % 16 === 0 || step % 16 === 6) {
        const bassLen = Math.floor(0.8 * sampleRate);
        const bassFreq = step < 16 ? 43.65 : 38.89; // F1 down to Eb1
        for (let i = 0; i < bassLen && startSample + i < left.length; i++) {
          const t = i / sampleRate;
          const env = Math.exp(-t * 3.5) * 0.55;
          // Soft saturation on bass
          let raw = Math.sin(2 * Math.PI * bassFreq * t);
          raw = Math.tanh(raw * 2.5); // distortion
          const val = raw * env;
          left[startSample + i] += val;
          right[startSample + i] += val;
        }
      }
    }

    // Normalize buffer to prevent clipping
    let maxAmp = 0.01;
    for (let i = 0; i < left.length; i++) {
      if (Math.abs(left[i]) > maxAmp) maxAmp = Math.abs(left[i]);
      if (Math.abs(right[i]) > maxAmp) maxAmp = Math.abs(right[i]);
    }
    const norm = 0.88 / maxAmp;
    for (let i = 0; i < left.length; i++) {
      left[i] *= norm;
      right[i] *= norm;
    }

    audioBufferRef.current = buffer;
    return buffer;
  }, [initAudioContext]);

  // Play audio buffer (uploaded or demo)
  const playAudio = useCallback(async (playbackRate: number = 1.0) => {
    const ctx = await initAudioContext();
    if (!ctx) return;

    if (!audioBufferRef.current) {
      await generatePhonkDemoBuffer();
    }

    if (!audioBufferRef.current) return;

    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    try {
      const source = ctx.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.playbackRate.setValueAtTime(playbackRate, ctx.currentTime);
      source.loop = true;

      if (filterNodeRef.current) {
        source.connect(filterNodeRef.current);
      } else if (gainNodeRef.current) {
        source.connect(gainNodeRef.current);
      } else {
        source.connect(ctx.destination);
      }

      source.start();
      sourceRef.current = source;
      setIsPlaying(true);
    } catch (error) {
      console.error('Error starting audio playback:', error);
    }
  }, [initAudioContext, generatePhonkDemoBuffer]);

  // Stop playback
  const stopAudio = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
        sourceRef.current = null;
      } catch (e) {
        // ignore
      }
    }
    setIsPlaying(false);
  }, []);

  // Tape Stop effect: exponentially ramps down playback rate to 0
  const triggerTapeStop = useCallback((duration: number = 0.8) => {
    if (sourceRef.current && audioContextRef.current) {
      const ctx = audioContextRef.current;
      sourceRef.current.playbackRate.cancelScheduledValues(ctx.currentTime);
      sourceRef.current.playbackRate.setValueAtTime(sourceRef.current.playbackRate.value, ctx.currentTime);
      sourceRef.current.playbackRate.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      setTimeout(() => {
        stopAudio();
      }, duration * 1000);
    }
  }, [stopAudio]);

  // Drum Synthesizer: Kick, Snare, Hi-Hat, Roland TR-808 Phonk Cowbell
  const createDrumSound = useCallback(async (type: 'kick' | 'snare' | 'hihat' | 'cowbell') => {
    const ctx = await initAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const dest = filterNodeRef.current || gainNodeRef.current || ctx.destination;

    try {
      if (type === 'kick') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(dest);

        // Fast pitch punch from 160Hz to 36Hz
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(36, now + 0.12);

        gain.gain.setValueAtTime(1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.36);
      } else if (type === 'snare') {
        // Body tone
        const toneOsc = ctx.createOscillator();
        const toneGain = ctx.createGain();
        toneOsc.frequency.setValueAtTime(200, now);
        toneOsc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
        toneGain.gain.setValueAtTime(0.6, now);
        toneGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        toneOsc.connect(toneGain);
        toneGain.connect(dest);

        // Noise snap
        const noiseBufferSize = ctx.sampleRate * 0.2;
        const noiseBuffer = ctx.createBuffer(1, noiseBufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1200, now);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.65, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(dest);

        toneOsc.start(now);
        toneOsc.stop(now + 0.16);
        noise.start(now);
      } else if (type === 'hihat') {
        // Metallic high passed noise
        const hatBufferSize = ctx.sampleRate * 0.08;
        const hatBuffer = ctx.createBuffer(1, hatBufferSize, ctx.sampleRate);
        const data = hatBuffer.getChannelData(0);
        for (let i = 0; i < hatBufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const hat = ctx.createBufferSource();
        hat.buffer = hatBuffer;
        const hatFilter = ctx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(7500, now);
        const hatGain = ctx.createGain();
        hatGain.gain.setValueAtTime(0.45, now);
        hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        hat.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(dest);

        hat.start(now);
      } else if (type === 'cowbell') {
        // Authentic Roland TR-808 Phonk Cowbell dual-square oscillator
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'square';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(540, now);
        osc2.frequency.setValueAtTime(800, now);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(840, now);
        filter.Q.setValueAtTime(3.5, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.85, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.46);
        osc2.stop(now + 0.46);
      }
    } catch (error) {
      console.error('Error in drum hit:', error);
    }
  }, [initAudioContext]);

  // 808 Sub-Bass Synth with pitch glide
  const create808Bass = useCallback(async (note: number = 33, glideTime: number = 0.12) => {
    const ctx = await initAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const dest = filterNodeRef.current || gainNodeRef.current || ctx.destination;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const waveshaper = ctx.createWaveShaper();
      waveshaper.curve = makeDistortionCurve(35); // Fat Phonk 808 saturation

      // Note frequency conversion
      const prevFreq = 440 * Math.pow(2, (lastBassNoteRef.current - 69) / 12);
      const targetFreq = 440 * Math.pow(2, (note - 69) / 12);
      lastBassNoteRef.current = note;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(prevFreq, now);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, now + glideTime);

      gain.gain.setValueAtTime(0.95, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

      osc.connect(waveshaper);
      waveshaper.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 1.15);
    } catch (error) {
      console.error('Error playing 808 bass:', error);
    }
  }, [initAudioContext]);

  // Get live visualizer frequency & waveform data
  const getAudioData = useCallback(() => {
    if (!analyserRef.current) {
      return { frequencyData: new Uint8Array(0), waveformData: new Uint8Array(0) };
    }
    const freq = new Uint8Array(analyserRef.current.frequencyBinCount);
    const wave = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(freq);
    analyserRef.current.getByteTimeDomainData(wave);
    return { frequencyData: freq, waveformData: wave };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch (e) {}
      }
      if (vinylSourceRef.current) {
        try { vinylSourceRef.current.stop(); } catch (e) {}
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    initAudioContext,
    loadAudioFile,
    generatePhonkDemoBuffer,
    playAudio,
    stopAudio,
    triggerTapeStop,
    createDrumSound,
    create808Bass,
    setMasterVolume,
    updateFX,
    setVinylCrackle,
    getAudioData,
    isInitialized,
    isPlaying,
    audioBuffer: audioBufferRef.current,
    audioContext: audioContextRef.current,
  };
};
