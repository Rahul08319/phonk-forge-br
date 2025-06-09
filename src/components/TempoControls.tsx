
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Clock, Zap } from "lucide-react";

interface TempoControlsProps {
  originalBPM: number;
  targetBPM: number;
  onTargetBPMChange: (bpm: number) => void;
}

export const TempoControls = ({ originalBPM, targetBPM, onTargetBPMChange }: TempoControlsProps) => {
  const presets = [
    { name: "Classic Morro", bpm: 80 },
    { name: "Rio Bounce", bpm: 85 },
    { name: "São Paulo", bpm: 90 },
    { name: "Aggressive", bpm: 95 },
  ];

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
            <span className="text-purple-300 font-mono">{targetBPM}</span>
          </div>
          <Slider
            value={[targetBPM]}
            onValueChange={(value) => onTargetBPMChange(value[0])}
            min={60}
            max={120}
            step={1}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <span className="text-sm text-gray-400">Presets</span>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => onTargetBPMChange(preset.bpm)}
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 text-xs"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-purple-500/30">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Pitch Shift: {((targetBPM / originalBPM - 1) * 100).toFixed(1)}%</span>
            <span>Ratio: {(originalBPM / targetBPM).toFixed(2)}x</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
