
import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { TempoControls } from "@/components/TempoControls";
import { DrumSequencer } from "@/components/DrumSequencer";
import { FXRack } from "@/components/FXRack";
import { BassControls } from "@/components/BassControls";
import { ExportPanel } from "@/components/ExportPanel";
import { AudioVisualization } from "@/components/AudioVisualization";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square } from "lucide-react";

const Index = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [detectedBPM, setDetectedBPM] = useState(120);
  const [targetBPM, setTargetBPM] = useState(85);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black text-white">
      {/* Header */}
      <div className="border-b border-purple-500/30 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                PhonkMachine BR
              </div>
              <div className="text-sm text-purple-300">Brazilian Phonk Generator</div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayPause}
                className="border-purple-500 text-purple-300 hover:bg-purple-500/20"
                disabled={!audioFile}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStop}
                className="border-purple-500 text-purple-300 hover:bg-purple-500/20"
                disabled={!audioFile}
              >
                <Square className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-120px)]">
          {/* Left Panel - File Input & Analysis */}
          <div className="col-span-3 space-y-6">
            <FileUpload
              onFileSelect={setAudioFile}
              detectedBPM={detectedBPM}
              onBPMDetected={setDetectedBPM}
            />
            <TempoControls
              originalBPM={detectedBPM}
              targetBPM={targetBPM}
              onTargetBPMChange={setTargetBPM}
            />
            <AudioVisualization isPlaying={isPlaying} />
          </div>

          {/* Center Panel - Drum Sequencer */}
          <div className="col-span-6">
            <DrumSequencer />
          </div>

          {/* Right Panel - FX & Bass */}
          <div className="col-span-3 space-y-6">
            <BassControls />
            <FXRack />
          </div>
        </div>

        {/* Bottom Panel - Export */}
        <div className="mt-6">
          <ExportPanel audioFile={audioFile} />
        </div>
      </div>
    </div>
  );
};

export default Index;
