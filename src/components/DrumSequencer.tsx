import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, RotateCcw } from "lucide-react";

interface DrumSequencerProps {
  onDrumHit: (type: 'kick' | 'snare' | 'hihat' | 'cowbell') => void;
}

export const DrumSequencer = ({ onDrumHit }: DrumSequencerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(85);
  const [pattern, setPattern] = useState({
    kick: Array(16).fill(false),
    snare: Array(16).fill(false),
    hihat: Array(16).fill(false),
    cowbell: Array(16).fill(false),
  });

  const drumTypes = [
    { key: 'kick', name: 'Kick', color: 'bg-red-500' },
    { key: 'snare', name: 'Snare', color: 'bg-blue-500' },
    { key: 'hihat', name: 'Hi-Hat', color: 'bg-yellow-500' },
    { key: 'cowbell', name: 'Cowbell', color: 'bg-green-500' },
  ] as const;

  const presets = [
    { name: "Classic Phonk", pattern: { kick: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], snare: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0], hihat: [1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1], cowbell: [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1] } },
    { name: "Aggressive", pattern: { kick: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], snare: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0], hihat: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], cowbell: [0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1] } },
    { name: "Minimal", pattern: { kick: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hihat: [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1], cowbell: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0] } },
  ];

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPlaying) {
      intervalId = setInterval(() => {
        setCurrentStep((prevStep) => (prevStep + 1) % 16);
      }, 60000 / bpm / 4); //BPM to milliseconds conversion
    } else {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [isPlaying, bpm]);

  const toggleStep = (drumKey: keyof typeof pattern, stepIndex: number) => {
    setPattern((prevPattern) => ({
      ...prevPattern,
      [drumKey]: prevPattern[drumKey].map((value, index) =>
        index === stepIndex ? !value : value
      ),
    }));
  };

  const clearPattern = () => {
    setPattern({
      kick: Array(16).fill(false),
      snare: Array(16).fill(false),
      hihat: Array(16).fill(false),
      cowbell: Array(16).fill(false),
    });
  };

  const loadPreset = (preset: { name: string; pattern: { kick: number[]; snare: number[]; hihat: number[]; cowbell: number[]; }; }) => {
    setPattern({
      kick: preset.pattern.kick.map(x => !!x),
      snare: preset.pattern.snare.map(x => !!x),
      hihat: preset.pattern.hihat.map(x => !!x),
      cowbell: preset.pattern.cowbell.map(x => !!x),
    });
  };

  const playDrumSound = (type: 'kick' | 'snare' | 'hihat' | 'cowbell') => {
    onDrumHit(type);
  };

  useEffect(() => {
    if (isPlaying) {
      Object.entries(pattern).forEach(([drumKey, steps]) => {
        if (steps[currentStep]) {
          playDrumSound(drumKey as 'kick' | 'snare' | 'hihat' | 'cowbell');
        }
      });
    }
  }, [currentStep, isPlaying, pattern, onDrumHit]);

  return (
    <Card className="border-purple-500/30 bg-black/40 backdrop-blur-sm h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-purple-300 text-xl">16-Step Sequencer</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="border-purple-500/50 text-purple-300">
              BPM: {bpm}
            </Badge>
            <Badge variant="outline" className="border-purple-500/50 text-purple-300">
              Step: {currentStep + 1}/16
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Transport Controls */}
        <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-purple-500/20">
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              size="sm"
              className={`${isPlaying ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'} text-white`}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              onClick={() => { setIsPlaying(false); setCurrentStep(0); }}
              variant="outline"
              size="sm"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              onClick={clearPattern}
              variant="outline"
              size="sm"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center space-x-2">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                onClick={() => loadPreset(preset)}
                variant="outline"
                size="sm"
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 text-xs"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Sequencer Grid */}
        <div className="space-y-4">
          {drumTypes.map((drumType) => (
            <div key={drumType.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${drumType.color}`} />
                  <span className="text-purple-300 font-medium text-sm">{drumType.name}</span>
                  <Button
                    onClick={() => playDrumSound(drumType.key)}
                    variant="outline"
                    size="sm"
                    className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 h-6 px-2 text-xs"
                  >
                    Test
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-16 gap-1">
                {pattern[drumType.key].map((active, index) => (
                  <Button
                    key={index}
                    onClick={() => toggleStep(drumType.key, index)}
                    className={`
                      h-8 w-full p-0 text-xs font-mono transition-all duration-150
                      ${active 
                        ? `${drumType.color} hover:opacity-80 text-white shadow-lg` 
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-600'
                      }
                      ${currentStep === index ? 'ring-2 ring-yellow-400 ring-opacity-75' : ''}
                    `}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pattern Info */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-purple-500/30">
          <span>Pattern Length: 16 steps</span>
          <span>Time Signature: 4/4</span>
          <span>{isPlaying ? '▶️ Playing' : '⏸️ Stopped'}</span>
        </div>
      </CardContent>
    </Card>
  );
};
