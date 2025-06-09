
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Waves, Radio } from "lucide-react";

export const FXRack = () => {
  const [effects, setEffects] = useState({
    vinylCrackle: { enabled: true, amount: 35 },
    saturation: { enabled: true, amount: 60 },
    reverb: { enabled: true, amount: 40 },
    phaser: { enabled: false, amount: 25 },
    radioVocal: { enabled: false, amount: 50 },
    stutter: { enabled: false, amount: 30 },
  });

  const updateEffect = (effect: keyof typeof effects, property: 'enabled' | 'amount', value: boolean | number) => {
    setEffects(prev => ({
      ...prev,
      [effect]: {
        ...prev[effect],
        [property]: value
      }
    }));
  };

  const presets = [
    { name: "Classic Lo-Fi", id: "lofi" },
    { name: "Aggressive", id: "aggressive" },
    { name: "Dreamy", id: "dreamy" },
    { name: "Clean", id: "clean" },
  ];

  return (
    <Card className="border-purple-500/30 bg-black/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Waves className="h-5 w-5" />
          FX Chain
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          {presets.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              size="sm"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 text-xs"
            >
              {preset.name}
            </Button>
          ))}
        </div>

        <div className="space-y-4">
          {Object.entries(effects).map(([effectKey, effect]) => (
            <div key={effectKey} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-300 capitalize">
                  {effectKey.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <Switch
                  checked={effect.enabled}
                  onCheckedChange={(checked) => updateEffect(effectKey as keyof typeof effects, 'enabled', checked)}
                />
              </div>
              {effect.enabled && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Amount</span>
                    <span className="text-purple-300">{effect.amount}%</span>
                  </div>
                  <Slider
                    value={[effect.amount]}
                    onValueChange={(value) => updateEffect(effectKey as keyof typeof effects, 'amount', value[0])}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-purple-500/30">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
          >
            <Radio className="h-4 w-4 mr-2" />
            Add Vocal Effect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
