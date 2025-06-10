
import { useRef, useCallback, useEffect, useState } from 'react';

export const useAudioEngine = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initAudioContext = useCallback(async () => {
    if (audioContextRef.current) {
      console.log('Audio context already initialized');
      return;
    }
    
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master gain node for volume control
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.setValueAtTime(0.75, audioContextRef.current.currentTime);
      
      // Resume audio context if it's suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      setIsInitialized(true);
      console.log('Audio context initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }, []);

  const loadAudioFile = useCallback(async (file: File) => {
    if (!audioContextRef.current) await initAudioContext();
    if (!audioContextRef.current) {
      console.error('Audio context not available');
      return;
    }

    try {
      console.log('Loading audio file:', file.name);
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      audioBufferRef.current = audioBuffer;
      console.log('Audio file loaded successfully, duration:', audioBuffer.duration, 'seconds');
      return audioBuffer;
    } catch (error) {
      console.error('Failed to load audio file:', error);
      return null;
    }
  }, [initAudioContext]);

  const setMasterVolume = useCallback((volume: number, isMuted: boolean = false) => {
    if (gainNodeRef.current) {
      const actualVolume = isMuted ? 0 : volume / 100;
      gainNodeRef.current.gain.setValueAtTime(actualVolume, audioContextRef.current?.currentTime || 0);
      console.log('Master volume set to:', actualVolume);
    }
  }, []);

  const playAudio = useCallback(() => {
    if (!audioContextRef.current || !audioBufferRef.current) {
      console.error('Audio context or buffer not available');
      return;
    }

    // Stop previous playback
    if (sourceRef.current) {
      sourceRef.current.stop();
    }

    try {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      
      if (gainNodeRef.current) {
        source.connect(gainNodeRef.current);
      } else {
        source.connect(audioContextRef.current.destination);
      }
      
      source.start();
      sourceRef.current = source;
      console.log('Audio playback started');
    } catch (error) {
      console.error('Failed to start audio playback:', error);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
        sourceRef.current = null;
        console.log('Audio playback stopped');
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
    }
  }, []);

  const createDrumSound = useCallback((type: 'kick' | 'snare' | 'hihat' | 'cowbell') => {
    if (!audioContextRef.current) {
      console.error('Audio context not available for drum sound');
      return;
    }

    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filterNode = ctx.createBiquadFilter();

      oscillator.connect(filterNode);
      filterNode.connect(gainNode);
      
      if (gainNodeRef.current) {
        gainNode.connect(gainNodeRef.current);
      } else {
        gainNode.connect(ctx.destination);
      }

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
      console.log('Drum sound played:', type);
    } catch (error) {
      console.error('Error creating drum sound:', error);
    }
  }, []);

  const create808Bass = useCallback((note: number = 40) => {
    if (!audioContextRef.current) {
      console.error('Audio context not available for bass sound');
      return;
    }

    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filterNode = ctx.createBiquadFilter();

      oscillator.connect(filterNode);
      filterNode.connect(gainNode);
      
      if (gainNodeRef.current) {
        gainNode.connect(gainNodeRef.current);
      } else {
        gainNode.connect(ctx.destination);
      }

      const frequency = 440 * Math.pow(2, (note - 69) / 12);
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, now + 0.8);
      
      gainNode.gain.setValueAtTime(0.7, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      
      filterNode.frequency.setValueAtTime(200, now);
      oscillator.type = 'sine';

      oscillator.start(now);
      oscillator.stop(now + 0.8);
      console.log('808 bass played, note:', note, 'frequency:', frequency);
    } catch (error) {
      console.error('Error creating 808 bass sound:', error);
    }
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
    setMasterVolume,
    isInitialized,
    audioContext: audioContextRef.current
  };
};
