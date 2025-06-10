
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

interface BassControlsProps {
  onBassHit?: (note?: number) => void;
}

export const BassControls = ({ onBassHit }: BassControlsProps) => {
  const [bass, setBass] = useState({
    volume: 75,
    distortion: 60,
    glide: 25,
    pitch: 0,
    tone: 50,
  });

  const updateBass = (property: keyof typeof bass, value: number) => {
    setBass(prev => ({
      ...prev,
      [property]: value
    }));
  };

  const bassPresets = [
    { name: "Deep 808", settings: { volume: 80, distortion: 70, glide: 30, pitch: -12, tone: 40 } },
    { name: "Punchy", settings: { volume: 75, distortion: 85, glide: 15, pitch: 0, tone: 60 } },
    { name: "Sub Bass", settings: { volume: 90, distortion: 45, glide: 40, pitch: -24, tone: 30 } },
  ];

  const bassNotes = [
    { note: 28, name: "A0" },
    { note: 33, name: "A1" },
    { note: 40, name: "E2" },
    { note: 45, name: "A2" },
  ];

  const playBassNote = (note: number) => {
    if (onBassHit) {
      onBassHit(note);
    }
  };

  return (
    <Card className="border-purple-500/30 bg-black/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          808 Bass Synth
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {bassPresets.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              size="sm"
              onClick={() => setBass(preset.settings)}
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 text-xs"
            >
              {preset.name}
            </Button>
          ))}
        </div>

        {/* Bass Note Triggers */}
        <div className="space-y-2">
          <div className="text-sm text-purple-300">Bass Notes</div>
          <div className="grid grid-cols-2 gap-2">
            {bassNotes.map((bass) => (
              <Button
                key={bass.note}
                variant="outline"
                size="sm"
                onClick={() => playBassNote(bass.note)}
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
              >
                {bass.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(bass).map(([property, value]) => (
            <div key={property} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-purple-300 capitalize">{property}</span>
                <span className="text-gray-400">
                  {property === 'pitch' ? `${value > 0 ? '+' : ''}${value}` : `${value}%`}
                </span>
              </div>
              <Slider
                value={[value]}
                onValueChange={(newValue) => updateBass(property as keyof typeof bass, newValue[0])}
                min={property === 'pitch' ? -24 : 0}
                max={property === 'pitch' ? 24 : 100}
                step={property === 'pitch' ? 1 : 1}
                className="w-full"
              />
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-purple-500/30 space-y-2">
          <div className="text-xs text-gray-400">
            Key: F# Minor (Auto-detected)
          </div>
          <div className="text-xs text-purple-300">
            Pattern follows chord progression
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
