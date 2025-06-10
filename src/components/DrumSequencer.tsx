import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shuffle, RotateCcw, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DrumSequencerProps {
  onDrumHit?: (type: 'kick' | 'snare' | 'hihat' | 'cowbell') => void;
}

export const DrumSequencer = ({ onDrumHit }: DrumSequencerProps) => {
  const [pattern, setPattern] = useState({
    cowbell: Array(16).fill(false).map((_, i) => i % 4 === 0),
    kick: Array(16).fill(false).map((_, i) => i === 0 || i === 8),
    snare: Array(16).fill(false).map((_, i) => i === 4 || i === 12),
    hihat: Array(16).fill(false).map((_, i) => i % 2 === 1),
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const drumNames = {
    cowbell: "🔔 Cowbell",
    kick: "🥁 Kick",
    snare: "👏 Snare/Clap",
    hihat: "🎩 Hi-Hat",
  };

  const drumColors = {
    cowbell: "bg-yellow-500",
    kick: "bg-red-500",
    snare: "bg-blue-500",
    hihat: "bg-green-500",
  };

  // Enhanced sequencer playback with audio
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const nextStep = (prev + 1) % 16;
        
        // Check which drums should play on this step
        Object.keys(pattern).forEach((drum) => {
          const drumKey = drum as keyof typeof pattern;
          if (pattern[drumKey][nextStep] && onDrumHit) {
            onDrumHit(drumKey);
          }
        });
        
        return nextStep;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, pattern, onDrumHit]);

  const toggleStep = (drum: keyof typeof pattern, step: number) => {
    setPattern(prev => ({
      ...prev,
      [drum]: prev[drum].map((active, i) => i === step ? !active : active)
    }));
    
    // Play drum sound immediately when toggled on
    if (!pattern[drum][step] && onDrumHit) {
      onDrumHit(drum);
    }
    
    if (!pattern[drum][step]) {
      toast({
        title: `${drumNames[drum]} hit!`,
        description: `Step ${step + 1} activated`,
        duration: 1000,
      });
    }
  };

  const randomizePattern = (drum: keyof typeof pattern) => {
    const newPattern = Array(16).fill(false).map(() => Math.random() > 0.65);
    setPattern(prev => ({
      ...prev,
      [drum]: newPattern
    }));
    
    toast({
      title: "Pattern randomized!",
      description: `${drumNames[drum]} pattern generated`,
    });
  };

  const clearPattern = (drum: keyof typeof pattern) => {
    setPattern(prev => ({
      ...prev,
      [drum]: Array(16).fill(false)
    }));
    
    toast({
      title: "Pattern cleared",
      description: `${drumNames[drum]} pattern reset`,
    });
  };

  const applyPreset = (presetName: string) => {
    const presets = {
      "Classic Morro": {
        cowbell: [true, false, false, true, true, false, false, true, true, false, false, true, false, false, true, false],
        kick: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hihat: [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true],
      },
      "Rio Bounce": {
        cowbell: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
        kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        snare: [false, false, false, false, true, false, false, true, false, false, false, false, true, false, false, true],
        hihat: [false, true, true, false, false, true, true, false, false, true, true, false, false, true, true, false],
      }
    };

    if (presets[presetName as keyof typeof presets]) {
      setPattern(presets[presetName as keyof typeof presets]);
      toast({
        title: "Preset loaded!",
        description: `Applied ${presetName} drum pattern`,
      });
    }
  };

  return (
    <Card className="border-purple-500/30 bg-black/40 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            🥁 Drum Sequencer
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPlaying(!isPlaying)}
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="text-sm font-normal text-gray-400">
              {isPlaying ? `Step ${currentStep + 1}/16` : "16 Steps"}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyPreset("Classic Morro")}
            className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 text-xs"
          >
            Classic Morro
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyPreset("Rio Bounce")}
            className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 text-xs"
          >
            Rio Bounce
          </Button>
        </div>

        {(Object.keys(pattern) as Array<keyof typeof pattern>).map((drum) => (
          <div key={drum} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-300">
                {drumNames[drum]}
              </span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => randomizePattern(drum)}
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 h-6 px-2"
                >
                  <Shuffle className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => clearPattern(drum)}
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 h-6 px-2"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-16 gap-1">
              {pattern[drum].map((active, step) => (
                <button
                  key={step}
                  onClick={() => toggleStep(drum, step)}
                  className={`
                    aspect-square rounded-sm border transition-all duration-150 transform hover:scale-110
                    ${active 
                      ? `${drumColors[drum]} border-white/50 shadow-lg` 
                      : 'bg-gray-800 border-gray-600 hover:border-purple-500/50'
                    }
                    ${step === currentStep && isPlaying ? 'ring-2 ring-pink-400 ring-opacity-75 animate-pulse' : ''}
                    ${step % 4 === 0 ? 'border-l-2 border-l-purple-300' : ''}
                  `}
                  title={`${drumNames[drum]} - Step ${step + 1}`}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-purple-500/30">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">BPM: 85 | Pattern: 16 steps</span>
            <span className="text-purple-300">
              {isPlaying ? '▶️ Playing' : '⏸️ Stopped'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
