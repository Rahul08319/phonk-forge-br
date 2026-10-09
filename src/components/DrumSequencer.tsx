import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Music } from "lucide-react";
import { phonkEngine } from "@/lib/phonkAudioEngine";

interface DrumSequencerProps {
  onDrumHit?: (type: 'kick' | 'snare' | 'clap' | 'hihat' | 'openhat' | 'cowbell') => void;
  targetBpm?: number;
  onBpmChange?: (bpm: number) => void;
}

type TrackKey = 'kick' | 'snare' | 'clap' | 'hihat' | 'openhat' | 'cowbell';

export const DrumSequencer = ({ onDrumHit, targetBpm = 130, onBpmChange }: DrumSequencerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(targetBpm);
  const [swing, setSwing] = useState(15);
  const [mutedTracks, setMutedTracks] = useState<Record<TrackKey, boolean>>({
    kick: false,
    snare: false,
    clap: false,
    hihat: false,
    openhat: false,
    cowbell: false,
  });

  const [pattern, setPattern] = useState<Record<TrackKey, boolean[]>>({
    kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
    openhat: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
    cowbell: [true, false, true, false, false, true, false, true, true, false, true, false, false, true, true, false],
  });

  // Cowbell Pitch Melody per step (-12 to +12 semitones)
  const [cowbellMelody, setCowbellMelody] = useState<number[]>([
    0, 0, 3, 0, 5, 5, 0, 7, 0, 0, 3, 0, 5, 8, 7, 0
  ]);

  const drumTracks: { key: TrackKey; name: string; tag: string; color: string; activeColor: string }[] = [
    { key: 'kick', name: '808 Kick', tag: 'SUB', color: 'text-rose-400', activeColor: 'bg-rose-500 shadow-[0_0_15px_#f43f5e]' },
    { key: 'snare', name: 'Drift Snare', tag: 'CRACK', color: 'text-sky-400', activeColor: 'bg-sky-500 shadow-[0_0_15px_#0ea5e9]' },
    { key: 'clap', name: 'Memphis Clap', tag: 'SNAP', color: 'text-amber-400', activeColor: 'bg-amber-500 shadow-[0_0_15px_#f59e0b]' },
    { key: 'hihat', name: '16th Sizzle Hat', tag: 'ROLL', color: 'text-emerald-400', activeColor: 'bg-emerald-500 shadow-[0_0_15px_#10b981]' },
    { key: 'openhat', name: 'Open Hi-Hat', tag: 'AIR', color: 'text-yellow-400', activeColor: 'bg-yellow-500 shadow-[0_0_15px_#eab308]' },
    { key: 'cowbell', name: 'TR-808 Cowbell', tag: 'LEAD', color: 'text-purple-400', activeColor: 'bg-purple-500 shadow-[0_0_15px_#a855f7]' },
  ];

  const presets = [
    {
      name: "Montagem Diamante",
      bpm: 160,
      pattern: {
        kick: [true, false, false, true, false, false, true, false, true, false, false, true, false, false, true, false],
        snare: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
        clap: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
        hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        openhat: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        cowbell: [true, false, true, false, true, false, true, false, true, true, false, true, false, true, false, true],
      }
    },
    {
      name: "Tokyo Drift Hard",
      bpm: 140,
      pattern: {
        kick: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        openhat: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
        cowbell: [true, false, false, true, false, true, false, false, true, false, false, true, false, true, true, false],
      }
    },
    {
      name: "Favela Automotivo",
      bpm: 130,
      pattern: {
        kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        snare: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
        clap: [false, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false],
        hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
        openhat: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        cowbell: [false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false],
      }
    },
    {
      name: "Slowed + Reverb 85",
      bpm: 85,
      pattern: {
        kick: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hihat: [true, true, false, true, true, true, false, true, true, true, false, true, true, true, false, true],
        openhat: [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, true],
        cowbell: [true, false, false, false, false, false, false, true, false, false, true, false, false, false, true, false],
      }
    }
  ];

  // Sync external targetBPM
  useEffect(() => {
    if (targetBpm && targetBpm !== bpm) {
      setBpm(targetBpm);
    }
  }, [targetBpm]);

  // Audio Playback Sequencer Loop
  useEffect(() => {
    let timerId: NodeJS.Timeout;

    if (isPlaying) {
      const baseInterval = (60000 / bpm / 4);
      
      const runStep = () => {
        setCurrentStep((prev) => {
          const nextStep = (prev + 1) % 16;

          // Trigger sounds for this step
          (Object.keys(pattern) as TrackKey[]).forEach((key) => {
            if (pattern[key][nextStep] && !mutedTracks[key]) {
              triggerSound(key, nextStep);
            }
          });

          return nextStep;
        });

        // Compute swing delay on odd 16th steps
        const isOdd = currentStep % 2 === 1;
        const swingDelay = isOdd ? (swing / 100) * (baseInterval * 0.3) : -(swing / 100) * (baseInterval * 0.3);
        const delay = Math.max(10, baseInterval + swingDelay);

        timerId = setTimeout(runStep, delay);
      };

      timerId = setTimeout(runStep, baseInterval);
    }

    return () => clearTimeout(timerId);
  }, [isPlaying, bpm, pattern, mutedTracks, swing]);

  const triggerSound = (key: TrackKey, stepIndex?: number) => {
    phonkEngine.init();

    if (key === 'kick') phonkEngine.playKick();
    else if (key === 'snare') phonkEngine.playSnare();
    else if (key === 'clap') phonkEngine.playClap();
    else if (key === 'hihat') phonkEngine.playHiHat(true);
    else if (key === 'openhat') phonkEngine.playHiHat(false);
    else if (key === 'cowbell') {
      const semitone = stepIndex !== undefined ? cowbellMelody[stepIndex] : 0;
      phonkEngine.playCowbell(semitone);
    }

    if (onDrumHit) onDrumHit(key);
  };

  const toggleStep = (track: TrackKey, index: number) => {
    setPattern((prev) => ({
      ...prev,
      [track]: prev[track].map((val, i) => (i === index ? !val : val)),
    }));
    // Audition sound on pad toggle
    if (!pattern[track][index]) {
      triggerSound(track, index);
    }
  };

  const toggleMute = (track: TrackKey) => {
    setMutedTracks((prev) => ({ ...prev, [track]: !prev[track] }));
  };

  const clearPattern = () => {
    const empty = Array(16).fill(false);
    setPattern({
      kick: [...empty],
      snare: [...empty],
      clap: [...empty],
      hihat: [...empty],
      openhat: [...empty],
      cowbell: [...empty],
    });
  };

  const applyPreset = (preset: typeof presets[0]) => {
    setPattern(preset.pattern);
    setBpm(preset.bpm);
    if (onBpmChange) onBpmChange(preset.bpm);
  };

  return (
    <Card className="apple-glass-card rounded-2xl border-white/10 text-white shadow-2xl overflow-hidden">
      <CardHeader className="pb-3 pt-5 px-6 border-b border-white/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Music className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                16-Step Brazilian Phonk Grid
              </CardTitle>
              <p className="text-xs text-zinc-400">Authentic Roland TR-808 synthesis & groove timing</p>
            </div>
          </div>

          {/* Quick Transport Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                phonkEngine.init();
                setIsPlaying(!isPlaying);
              }}
              className={`apple-spring-btn h-9 px-4 rounded-xl font-medium text-xs flex items-center gap-1.5 ${
                isPlaying
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
              }`}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
              {isPlaying ? 'PAUSE' : 'PLAY LOOP'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(0);
              }}
              className="apple-spring-btn h-9 w-9 p-0 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={clearPattern}
              className="apple-spring-btn h-9 px-3 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-xs text-zinc-400"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Presets Bar */}
        <div className="flex items-center gap-2 pt-3 overflow-x-auto no-scrollbar">
          <span className="text-[11px] text-zinc-400 font-medium whitespace-nowrap flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-purple-400" /> Presets:
          </span>
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="apple-spring-btn px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 hover:bg-purple-500/20 hover:border-purple-500/40 border border-white/10 text-zinc-300 hover:text-white transition-all whitespace-nowrap"
            >
              {preset.name} ({preset.bpm})
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Step Numbers & Playhead Indicator */}
        <div className="grid grid-cols-16 gap-1 ml-32">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className={`text-center text-[10px] font-mono py-1 rounded transition-colors ${
                i === currentStep && isPlaying
                  ? 'text-white font-bold bg-purple-500/40 shadow-[0_0_8px_#a855f7]'
                  : i % 4 === 0
                  ? 'text-zinc-300 bg-white/5'
                  : 'text-zinc-500'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* 6 Drum Track Rows */}
        <div className="space-y-2.5">
          {drumTracks.map((track) => (
            <div key={track.key} className="flex items-center gap-3 group">
              {/* Track Header / Name & Mute */}
              <div className="w-28 flex items-center justify-between">
                <button
                  onClick={() => triggerSound(track.key)}
                  className={`text-xs font-semibold ${track.color} hover:underline text-left truncate flex items-center gap-1`}
                  title="Click to preview hit"
                >
                  <span className="truncate">{track.name}</span>
                </button>
                <button
                  onClick={() => toggleMute(track.key)}
                  className={`p-1 rounded hover:bg-white/10 transition-colors ${
                    mutedTracks[track.key] ? 'text-rose-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title={mutedTracks[track.key] ? 'Unmute' : 'Mute track'}
                >
                  {mutedTracks[track.key] ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                </button>
              </div>

              {/* 16 Step Buttons */}
              <div className="flex-1 grid grid-cols-16 gap-1">
                {pattern[track.key].map((active, stepIdx) => {
                  const isCurrent = isPlaying && currentStep === stepIdx;
                  const isBeatStart = stepIdx % 4 === 0;

                  return (
                    <button
                      key={stepIdx}
                      onClick={() => toggleStep(track.key, stepIdx)}
                      className={`h-9 rounded-lg transition-all apple-spring-btn relative overflow-hidden flex items-center justify-center ${
                        active
                          ? track.activeColor
                          : isBeatStart
                          ? 'bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/10'
                          : 'bg-zinc-900/90 hover:bg-zinc-800/80 border border-white/5'
                      } ${isCurrent ? 'ring-2 ring-white ring-offset-1 ring-offset-black scale-105 z-10' : ''}`}
                    >
                      {/* Step Indicator Dot */}
                      {active && (
                        <div className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
                      )}
                      {/* Quarter Beat Bar Marker */}
                      {isBeatStart && !active && (
                        <div className="h-1 w-1 rounded-full bg-zinc-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Cowbell Melody Keyboard / Scale Shifter */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-purple-300">Phonk Swing Groove:</span>
            <span className="font-mono text-zinc-200">{swing}%</span>
          </div>
          <div className="w-48">
            <Slider
              value={[swing]}
              min={0}
              max={60}
              step={1}
              onValueChange={([val]) => setSwing(val)}
              className="accent-purple-500"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'}`} />
            <span className="font-mono text-[11px] text-zinc-300">
              STEP {currentStep + 1} / 16
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
