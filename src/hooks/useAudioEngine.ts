
import { useRef, useCallback, useEffect, useState } from 'react';

export const useAudioEngine = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initAudioContext = useCallback(async () => {
    if (audioContextRef.current) return;
    
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }, []);

  const loadAudioFile = useCallback(async (file: File) => {
    if (!audioContextRef.current) await initAudioContext();
    if (!audioContextRef.current) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      audioBufferRef.current = audioBuffer;
      return audioBuffer;
    } catch (error) {
      console.error('Failed to load audio file:', error);
      return null;
    }
  }, [initAudioContext]);

  const playAudio = useCallback(() => {
    if (!audioContextRef.current || !audioBufferRef.current) return;

    // Stop previous playback
    if (sourceRef.current) {
      sourceRef.current.stop();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(audioContextRef.current.destination);
    source.start();
    sourceRef.current = source;
  }, []);

  const stopAudio = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
  }, []);

  const createDrumSound = useCallback((type: 'kick' | 'snare' | 'hihat' | 'cowbell') => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filterNode = ctx.createBiquadFilter();

    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    switch (type) {
      case 'kick':
        oscillator.frequency.setValueAtTime(60, now);
        oscillator.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        gainNode.gain.setValueAtTime(0.8, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        filterNode.frequency.setValueAtTime(100, now);
        break;
      case 'snare':
        oscillator.frequency.setValueAtTime(200, now);
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        filterNode.frequency.setValueAtTime(1000, now);
        break;
      case 'hihat':
        oscillator.frequency.setValueAtTime(8000, now);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        filterNode.frequency.setValueAtTime(10000, now);
        break;
      case 'cowbell':
        oscillator.frequency.setValueAtTime(800, now);
        gainNode.gain.setValueAtTime(0.6, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        filterNode.frequency.setValueAtTime(2000, now);
        break;
    }

    oscillator.start(now);
    oscillator.stop(now + 0.5);
  }, []);

  const create808Bass = useCallback((note: number = 40) => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filterNode = ctx.createBiquadFilter();

    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    const frequency = 440 * Math.pow(2, (note - 69) / 12);
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, now + 0.8);
    
    gainNode.gain.setValueAtTime(0.7, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    
    filterNode.frequency.setValueAtTime(200, now);
    oscillator.type = 'sine';

    oscillator.start(now);
    oscillator.stop(now + 0.8);
  }, []);

  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        sourceRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    initAudioContext,
    loadAudioFile,
    playAudio,
    stopAudio,
    createDrumSound,
    create808Bass,
    isInitialized,
    audioContext: audioContextRef.current
  };
};
