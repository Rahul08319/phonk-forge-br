import { useState, useEffect, useCallback } from "react";
import { FileUpload } from "@/components/FileUpload";
import { TempoControls } from "@/components/TempoControls";
import { DrumSequencer } from "@/components/DrumSequencer";
import { FXRack } from "@/components/FXRack";
import { BassControls } from "@/components/BassControls";
import { ExportPanel } from "@/components/ExportPanel";
import { AudioVisualization } from "@/components/AudioVisualization";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, Volume2, VolumeX, Sparkles, Github, Radio, Sliders } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAudioEngine, FXSettings } from "@/hooks/useAudioEngine";

const Index = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [detectedBPM, setDetectedBPM] = useState(128);
  const [targetBPM, setTargetBPM] = useState(85);
  const [masterVolume, setMasterVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();

  const {
    initAudioContext,
    loadAudioFile,
    generatePhonkDemoBuffer,
    playAudio,
    stopAudio,
    triggerTapeStop,
    createDrumSound,
    create808Bass,
    setMasterVolume: setEngineVolume,
    updateFX,
    getAudioData,
    isInitialized
  } = useAudioEngine();

  // Master volume sync
  useEffect(() => {
    setEngineVolume(masterVolume, isMuted);
  }, [masterVolume, isMuted, setEngineVolume]);

  // Unlock audio context on initial click anywhere
  useEffect(() => {
    const handleFirstClick = async () => {
      if (!isInitialized) {
        await initAudioContext();
        toast({
          title: "Audio Engine Calibrated",
          description: "Web Audio DSP & 808 synthesizers ready.",
        });
      }
    };

    document.addEventListener("click", handleFirstClick, { once: true });
    return () => document.removeEventListener("click", handleFirstClick);
  }, [initAudioContext, isInitialized, toast]);

  // Load user file
  const handleFileSelect = async (file: File) => {
    setAudioFile(file);
    try {
      await initAudioContext();
      await loadAudioFile(file);
      toast({
        title: "Audio Track Loaded",
        description: `${file.name} ready for remixing`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error loading audio file",
        description: "Please try another audio format",
        variant: "destructive",
      });
    }
  };

  // Load procedural Brazilian Phonk Demo
  const handleLoadDemo = useCallback(async () => {
    await initAudioContext();
    await generatePhonkDemoBuffer(targetBPM);
    toast({
      title: "Brazilian Phonk Demo Loaded",
      description: `Procedural 85 BPM Automotivo groove loaded into buffer.`,
    });
  }, [initAudioContext, generatePhonkDemoBuffer, targetBPM, toast]);

  // Play / Pause Master
  const handlePlayPause = async () => {
    await initAudioContext();

    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
      toast({
        title: "Playback Paused",
        description: "Master audio stopped.",
      });
    } else {
      const playbackRate = targetBPM / 85;
      await playAudio(playbackRate);
      setIsPlaying(true);
      toast({
        title: "Master Playback Active",
        description: `Streaming at ${targetBPM} BPM with live DSP chain.`,
      });
    }
  };

  // Stop Master
  const handleStop = () => {
    stopAudio();
    setIsPlaying(false);
    toast({
      title: "Playback Reset",
      description: "Audio returned to start.",
    });
  };

  // Toggle Volume Mute
  const handleVolumeToggle = () => {
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? "Audio Unmuted" : "Audio Muted",
      description: isMuted ? `Volume: ${masterVolume}%` : "Muted",
    });
  };

  // Handle Drum Hit
  const handleDrumHit = async (type: 'kick' | 'snare' | 'hihat' | 'cowbell') => {
    await createDrumSound(type);
  };

  // Handle Bass Hit
  const handleBassHit = async (note?: number, glideTime?: number) => {
    await create808Bass(note, glideTime);
  };

  // Handle FX Rack Change
  const handleFXChange = (settings: Partial<FXSettings>) => {
    updateFX(settings);
  };

  // Handle Tape Stop Trigger
  const handleTapeStop = () => {
    triggerTapeStop(0.85);
    setIsPlaying(false);
    toast({
      title: "Tape Stop Triggered",
      description: "Analog inertia slowdown executed.",
    });
  };

  return (
    <div className="min-h-screen text-white flex flex-col justify-between selection:bg-purple-500 selection:text-white">
      {/* Top Ambient Glow Highlights */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[850px] h-[280px] bg-purple-600/15 blur-[120px] pointer-events-none rounded-full" />
      <div className="fixed top-40 right-10 w-[450px] h-[350px] bg-cyan-500/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Apple Liquid Glass Header */}
      <header className="sticky top-0 z-50 apple-glass border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-8 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Branding & Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 p-0.5 shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center">
                  <div className="h-full w-full bg-black/60 rounded-[10px] flex items-center justify-center">
                    <Radio className="h-4 w-4 text-purple-300" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold tracking-tight text-gradient-phonk">
                      Phonk Forge BR
                    </h1>
                    <span className="text-[10px] bg-white/10 text-zinc-300 font-mono px-2 py-0.5 rounded-full border border-white/10">
                      v2.6
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium">
                    Brazilian Phonk & Lo-Fi DAW • Apple Liquid Glass
                  </p>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-white/10">
                <Badge variant="outline" className="apple-glass-pill text-[10px] text-emerald-400 border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>DSP ENGINE 44.1kHz</span>
                </Badge>
                <Badge variant="outline" className="apple-glass-pill text-[10px] text-purple-300 border-purple-500/30">
                  🇧🇷 BAILE ACOUSTICS
                </Badge>
              </div>
            </div>

            {/* Master Transport & Controls */}
            <div className="flex items-center gap-3">
              {/* Volume Slider */}
              <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleVolumeToggle}
                  className="h-6 w-6 p-0 text-zinc-300 hover:text-white"
                >
                  {isMuted ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5" />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : masterVolume}
                  onChange={(e) => {
                    setIsMuted(false);
                    setMasterVolume(Number(e.target.value));
                  }}
                  className="w-16 sm:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <span className="text-[11px] font-mono text-zinc-400 w-7 text-right">
                  {isMuted ? '0%' : `${masterVolume}%`}
                </span>
              </div>

              {/* Transport Buttons */}
              <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
                <Button
                  size="sm"
                  onClick={handlePlayPause}
                  className={`apple-spring-btn h-8 px-4 rounded-lg font-semibold text-xs shadow-md ${
                    isPlaying
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-900/50'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/50'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 mr-1 fill-current" /> Play Master
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStop}
                  className="apple-spring-btn h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg"
                >
                  <Square className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* GitHub Repo Link */}
              <a
                href="https://github.com/Rahul08319/phonk-forge-br"
                target="_blank"
                rel="noreferrer"
                className="apple-spring-btn apple-glass-pill h-8 px-3 rounded-xl flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white hover:border-white/25 transition-colors"
              >
                <Github className="h-3.5 w-3.5" />
                <span className="hidden md:inline font-mono text-[11px]">GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Studio Workstation Bento Grid */}
      <main className="container mx-auto px-4 sm:px-8 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Input, Tempo & Live Visualizer */}
          <div className="lg:col-span-3 space-y-6">
            <FileUpload
              onFileSelect={handleFileSelect}
              onLoadDemo={handleLoadDemo}
              detectedBPM={detectedBPM}
              onBPMDetected={setDetectedBPM}
            />
            <TempoControls
              originalBPM={detectedBPM}
              targetBPM={targetBPM}
              onTargetBPMChange={setTargetBPM}
            />
            <AudioVisualization
              isPlaying={isPlaying}
              audioFile={audioFile}
              getAudioData={getAudioData}
            />
          </div>

          {/* Center Column: 16-Step Drum & Cowbell Sequencer */}
          <div className="lg:col-span-6 min-h-[600px] flex flex-col">
            <DrumSequencer
              onDrumHit={handleDrumHit}
              bpm={targetBPM}
            />
          </div>

          {/* Right Column: 808 Bass Synthesizer & Master FX Rack */}
          <div className="lg:col-span-3 space-y-6">
            <BassControls
              onBassHit={handleBassHit}
            />
            <FXRack
              onFXChange={handleFXChange}
              onTapeStop={handleTapeStop}
            />
          </div>
        </div>

        {/* Bottom Panel: Master Export & Audio Bounce */}
        <section className="mt-8">
          <ExportPanel audioFile={audioFile} />
        </section>
      </main>

      {/* Studio Footer with Dynamic Year & Auto-Update Logic */}
      <footer className="border-t border-white/10 apple-glass py-6 mt-12 text-zinc-400 text-xs">
        <div className="container mx-auto px-4 sm:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-200">Phonk Forge BR</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">
                © 2024–{currentYear} Rahul Kumar
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-emerald-400 font-mono text-[11px]">
                Auto-Calibrated for {currentYear}–{currentYear + 1}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              High-Precision Roland TR-808 Phonk Cowbell • Analog 808 Glide • 24-Bit WAV Mastering • TypeSafe System One
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-zinc-500">BUILD: RELEASE-{currentYear}.4</span>
            <a
              href="https://github.com/Rahul08319/phonk-forge-br"
              target="_blank"
              rel="noreferrer"
              className="text-purple-400 hover:text-purple-300 underline underline-offset-4"
            >
              github.com/Rahul08319/phonk-forge-br
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
