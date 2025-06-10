
import { useState, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { TempoControls } from "@/components/TempoControls";
import { DrumSequencer } from "@/components/DrumSequencer";
import { FXRack } from "@/components/FXRack";
import { BassControls } from "@/components/BassControls";
import { ExportPanel } from "@/components/ExportPanel";
import { AudioVisualization } from "@/components/AudioVisualization";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Volume2, VolumeX, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAudioEngine } from "@/hooks/useAudioEngine";

const Index = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [detectedBPM, setDetectedBPM] = useState(120);
  const [targetBPM, setTargetBPM] = useState(85);
  const [masterVolume, setMasterVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const { toast } = useToast();
  
  const {
    initAudioContext,
    loadAudioFile,
    playAudio,
    stopAudio,
    createDrumSound,
    create808Bass,
    setMasterVolume: setEngineVolume,
    isInitialized
  } = useAudioEngine();

  // Update master volume when volume or mute state changes
  useEffect(() => {
    setEngineVolume(masterVolume, isMuted);
  }, [masterVolume, isMuted, setEngineVolume]);

  // Initialize audio on first user interaction
  useEffect(() => {
    const handleFirstInteraction = async () => {
      if (!isInitialized) {
        console.log('First user interaction - initializing audio...');
        await initAudioContext();
        toast({
          title: "Audio engine ready",
          description: "You can now play sounds and music",
        });
      }
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    return () => document.removeEventListener('click', handleFirstInteraction);
  }, [initAudioContext, isInitialized, toast]);

  const handleFileSelect = async (file: File) => {
    console.log('File selected:', file.name);
    setAudioFile(file);
    
    try {
      await initAudioContext();
      await loadAudioFile(file);
      toast({
        title: "Audio file loaded",
        description: "Ready to play and remix",
      });
    } catch (error) {
      console.error('Error loading audio file:', error);
      toast({
        title: "Error loading file",
        description: "Please try a different audio file",
        variant: "destructive",
      });
    }
  };

  const handlePlayPause = async () => {
    if (!audioFile) {
      toast({
        title: "No audio file loaded",
        description: "Please upload an audio file first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (!isInitialized) {
        console.log('Initializing audio context...');
        await initAudioContext();
      }

      if (isPlaying) {
        stopAudio();
        setIsPlaying(false);
        toast({
          title: "Playback stopped",
          description: "Audio stopped",
        });
      } else {
        console.log('Starting audio playback...');
        await playAudio();
        setIsPlaying(true);
        toast({
          title: "Playback started",
          description: `Playing at ${targetBPM} BPM`,
        });
      }
    } catch (error) {
      console.error('Error during playback:', error);
      toast({
        title: "Playback error",
        description: "Please try again or reload the page",
        variant: "destructive",
      });
    }
  };

  const handleStop = () => {
    stopAudio();
    setIsPlaying(false);
    toast({
      title: "Playback stopped",
      description: "Audio reset to beginning",
    });
  };

  const handleVolumeToggle = () => {
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? "Audio unmuted" : "Audio muted",
      description: isMuted ? `Volume: ${masterVolume}%` : "Audio muted",
    });
  };

  const handleDrumHit = async (type: 'kick' | 'snare' | 'hihat' | 'cowbell') => {
    try {
      await createDrumSound(type);
    } catch (error) {
      console.error('Error playing drum sound:', error);
    }
  };

  const handleBassHit = async (note?: number) => {
    try {
      await create808Bass(note);
    } catch (error) {
      console.error('Error playing bass sound:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-purple-500/30 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                PhonkMachine BR
              </div>
              <div className="text-sm text-purple-300 font-medium">Brazilian Phonk Generator</div>
              {audioFile && (
                <div className="text-xs text-gray-400 bg-black/30 px-3 py-1.5 rounded-md">
                  🎵 {audioFile.name}
                </div>
              )}
              {!isInitialized && (
                <div className="flex items-center space-x-2 text-yellow-400 text-xs">
                  <AlertCircle className="h-4 w-4" />
                  <span>Click anywhere to enable audio</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-black/30 px-3 py-2 rounded-lg">
                <span className="text-xs text-gray-400">Volume:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(Number(e.target.value))}
                  className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-purple-300 w-8">{masterVolume}%</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleVolumeToggle}
                className="border-purple-500 text-purple-300 hover:bg-purple-500/20 h-10 w-10"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayPause}
                className={`border-purple-500 hover:bg-purple-500/20 h-10 w-16 ${
                  audioFile 
                    ? 'text-purple-300' 
                    : 'text-gray-500 cursor-not-allowed opacity-50'
                }`}
                disabled={!audioFile}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStop}
                className={`border-purple-500 hover:bg-purple-500/20 h-10 w-10 ${
                  audioFile 
                    ? 'text-purple-300' 
                    : 'text-gray-500 cursor-not-allowed opacity-50'
                }`}
                disabled={!audioFile}
              >
                <Square className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-8 min-h-[calc(100vh-200px)]">
          {/* Left Sidebar - Controls */}
          <aside className="col-span-3 space-y-6">
            <FileUpload
              onFileSelect={handleFileSelect}
              detectedBPM={detectedBPM}
              onBPMDetected={setDetectedBPM}
            />
            <TempoControls
              originalBPM={detectedBPM}
              targetBPM={targetBPM}
              onTargetBPMChange={setTargetBPM}
            />
            <AudioVisualization isPlaying={isPlaying} audioFile={audioFile} />
          </aside>

          {/* Center - Main Sequencer */}
          <section className="col-span-6">
            <DrumSequencer onDrumHit={handleDrumHit} />
          </section>

          {/* Right Sidebar - Synthesis & FX */}
          <aside className="col-span-3 space-y-6">
            <BassControls onBassHit={handleBassHit} />
            <FXRack />
          </aside>
        </div>

        {/* Bottom Panel - Export */}
        <footer className="mt-8 pt-8 border-t border-purple-500/30">
          <ExportPanel audioFile={audioFile} />
        </footer>
      </main>
    </div>
  );
};

export default Index;
