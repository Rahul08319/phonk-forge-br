import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Waves, Disc3, Flame, Radio, Sparkles, SlidersHorizontal } from "lucide-react";
import { phonkEngine } from "@/lib/phonkAudioEngine";

interface FXRackProps {
  onFXChange?: (settings: Record<string, unknown>) => void;
  onTapeStop?: () => void;
}

export const FXRack = ({ onFXChange, onTapeStop }: FXRackProps = {}) => {
  const [effects, setEffects] = useState({
    vinylCrackle: { enabled: true, amount: 40, label: "Vinyl Lo-Fi Surface", icon: Disc3, color: "text-amber-400" },
    saturation: { enabled: true, amount: 65, label: "Tape Harmonic Saturation", icon: Flame, color: "text-rose-400" },
    reverb: { enabled: true, amount: 45, label: "Studio Hall Reverb", icon: Waves, color: "text-purple-400" },
    djFilter: { enabled: false, amount: 50, label: "DJ Dual Filter Cutoff", icon: SlidersHorizontal, color: "text-cyan-400" },
    stereoWidth: { enabled: true, amount: 70, label: "Stereo Dimension Widener", icon: Radio, color: "text-emerald-400" },
  });

  const presets = [
    { name: "Memphis Lo-Fi Tape", id: "lofi", values: { vinyl: true, sat: 55, rev: 60, width: 60 } },
    { name: "Tokyo Aggressive", id: "aggressive", values: { vinyl: false, sat: 85, rev: 35, width: 85 } },
    { name: "Favela Drift 160", id: "drift", values: { vinyl: true, sat: 70, rev: 40, width: 75 } },
    { name: "Clean Studio", id: "clean", values: { vinyl: false, sat: 20, rev: 25, width: 50 } },
  ];

  const updateEffect = (effectKey: keyof typeof effects, prop: 'enabled' | 'amount', val: boolean | number) => {
    setEffects((prev) => {
      const updated = {
        ...prev,
        [effectKey]: {
          ...prev[effectKey],
          [prop]: val,
        },
      };

      // Realtime DSP adjustments
      if (effectKey === 'vinylCrackle') {
        const en = prop === 'enabled' ? (val as boolean) : updated.vinylCrackle.enabled;
        const amt = prop === 'amount' ? (val as number) : updated.vinylCrackle.amount;
        phonkEngine.toggleVinylCrackle(en, amt / 100);
      } else if (effectKey === 'saturation') {
        const en = prop === 'enabled' ? (val as boolean) : updated.saturation.enabled;
        const amt = prop === 'amount' ? (val as number) : updated.saturation.amount;
        phonkEngine.setDistortionAmount(en ? amt : 0);
      }

      return updated;
    });
  };

  const applyPreset = (preset: typeof presets[0]) => {
    setEffects((prev) => ({
      ...prev,
      vinylCrackle: { ...prev.vinylCrackle, enabled: preset.values.vinyl },
      saturation: { ...prev.saturation, amount: preset.values.sat, enabled: true },
      reverb: { ...prev.reverb, amount: preset.values.rev, enabled: true },
      stereoWidth: { ...prev.stereoWidth, amount: preset.values.width, enabled: true },
    }));

    phonkEngine.toggleVinylCrackle(preset.values.vinyl, 0.4);
    phonkEngine.setDistortionAmount(preset.values.sat);
  };

  return (
    <Card className="apple-glass-card rounded-2xl border-white/10 text-white shadow-2xl overflow-hidden">
      <CardHeader className="pb-3 pt-5 px-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Waves className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                Master FX Rack
              </CardTitle>
              <p className="text-[11px] text-zinc-400">Analog processing & lo-fi texture</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onTapeStop && (
              <button
                onClick={onTapeStop}
                className="apple-spring-btn px-2.5 py-0.5 rounded-full border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[10px] font-mono flex items-center gap-1 shadow-sm transition-all"
                title="Trigger Analog Tape Stop Slowdown"
              >
                <span>📼 TAPE STOP</span>
              </button>
            )}
            <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-[10px] bg-purple-500/10">
              DSP ACTIVE
            </Badge>
          </div>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-2 gap-1.5 pt-3">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="apple-spring-btn px-2 py-1 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-purple-500/20 hover:border-purple-500/40 border border-white/10 text-zinc-300 hover:text-white transition-all text-left truncate"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {(Object.entries(effects) as [keyof typeof effects, typeof effects.vinylCrackle][]).map(([key, fx]) => {
          const Icon = fx.icon;

          return (
            <div key={key} className="space-y-2 p-3 rounded-xl bg-white/[0.03] border border-white/5 transition-colors hover:border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded-lg ${fx.enabled ? 'bg-white/10' : 'bg-transparent'}`}>
                    <Icon className={`h-3.5 w-3.5 ${fx.enabled ? fx.color : 'text-zinc-500'}`} />
                  </div>
                  <span className={`text-xs font-semibold ${fx.enabled ? 'text-zinc-200' : 'text-zinc-500'}`}>
                    {fx.label}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[11px] text-zinc-400">
                    {fx.enabled ? `${fx.amount}%` : 'BYPASS'}
                  </span>
                  <Switch
                    checked={fx.enabled}
                    onCheckedChange={(checked) => updateEffect(key, 'enabled', checked)}
                    className="data-[state=checked]:bg-purple-600 scale-85"
                  />
                </div>
              </div>

              {fx.enabled && (
                <div className="pt-1">
                  <Slider
                    value={[fx.amount]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([val]) => updateEffect(key, 'amount', val)}
                    className="accent-purple-500"
                  />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
