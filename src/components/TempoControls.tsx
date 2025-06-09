
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Clock, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TempoControlsProps {
  originalBPM: number;
  targetBPM: number;
  onTargetBPMChange: (bpm: number) => void;
}

export const TempoControls = ({ originalBPM, targetBPM, onTargetBPMChange }: TempoControlsProps) => {
  const { toast } = useToast();

  const presets = [
    { name: "Classic Morro", bpm: 80 },
    { name: "Rio Bounce", bpm: 85 },
    { name: "São Paulo", bpm: 90 },
    { name: "Aggressive", bpm: 95 },
  ];

  const handlePresetClick = (preset: { name: string; bpm: number }) => {
    onTargetBPMChange(preset.bpm);
    toast({
      title: `${preset.name} preset applied!`,
      description: `Tempo set to ${preset.bpm} BPM`,
    });
  };

  const pitchShiftPercent = ((targetBPM / originalBPM - 1) * 100);
  const timeStretchRatio = (originalBPM / targetBPM);

  return (
    <Card className="border-purple-500/30 bg-black/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Tempo Engine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Target BPM</span>
            <span className="text-purple-300 font-mono text-lg">{targetBPM}</span>
          </div>
          <Slider
            value={[targetBPM]}
            onValueChange={(value) => {
              onTargetBPMChange(value[0]);
              toast({
                title: "Tempo changed",
                description: `BPM set to ${value[0]}`,
                duration: 1000,
              });
            }}
            min={60}
            max={120}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>60</span>
            <span>90</span>
            <span>120</span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm text-gray-400">Phonk Presets</span>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick(preset)}
                className={`border-purple-500/50 hover:bg-purple-500/20 text-xs transition-all ${
                  targetBPM === preset.bpm 
                    ? 'bg-purple-500/30 text-purple-200 border-purple-400' 
                    : 'text-purple-300'
                }`}
              >
                {preset.name}
                <br />
                <span className="text-xs opacity-75">{preset.bpm} BPM</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-purple-500/30 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Pitch Shift:</span>
            <span className={`font-mono ${pitchShiftPercent < 0 ? 'text-blue-400' : 'text-red-400'}`}>
              {pitchShiftPercent > 0 ? '+' : ''}{pitchShiftPercent.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Time Stretch:</span>
            <span className="text-purple-300 font-mono">{timeStretchRatio.toFixed(2)}x</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Quality:</span>
            <span className="text-green-400">Professional</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
