import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, Zap, Sliders, Music2 } from "lucide-react";
import { phonkEngine } from "@/lib/phonkAudioEngine";

interface BassControlsProps {
  onBassHit?: (note?: number) => void;
}

export const BassControls = ({ onBassHit }: BassControlsProps) => {
  const [bass, setBass] = useState({
    distortion: 65,
    glide: 35,
    decay: 80,
    subBoost: 75,
    cutoff: 420,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeNote, setActiveNote] = useState<number | null>(null);

  // 8 Brazilian Phonk Scale Notes (A minor with tritone blues note)
  const bassNotes = [
    { note: 21, name: "A0", tag: "SUB" },
    { note: 24, name: "C1", tag: "ROOT" },
    { note: 26, name: "D1", tag: "4TH" },
    { note: 27, name: "D#1", tag: "PHONK" },
    { note: 28, name: "E1", tag: "5TH" },
    { note: 29, name: "F1", tag: "MIN6" },
    { note: 31, name: "G1", tag: "MIN7" },
    { note: 33, name: "A1", tag: "OCT" },
  ];

  const presets = [
    { name: "Sub-Zero 808", settings: { distortion: 85, glide: 45, decay: 90, subBoost: 80, cutoff: 550 } },
    { name: "Tokyo Drift", settings: { distortion: 70, glide: 25, decay: 75, subBoost: 70, cutoff: 420 } },
    { name: "Favela Punch", settings: { distortion: 55, glide: 15, decay: 60, subBoost: 85, cutoff: 360 } },
    { name: "Clean Rumble", settings: { distortion: 20, glide: 35, decay: 85, subBoost: 95, cutoff: 280 } },
  ];

  // Draw simulated 808 sub waveform in canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const renderWave = () => {
      phase += 0.05;
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = 'rgba(8, 8, 12, 0.4)';
      ctx.fillRect(0, 0, w, h);

      ctx.beginPath();
      const points = 80;
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * w;
        // Sub-bass shape: sine distorted by saturation
        const rawSine = Math.sin((i / points) * Math.PI * 4 + phase);
        const distFactor = bass.distortion / 100;
        const distorted = Math.tanh(rawSine * (1 + distFactor * 3));
        const y = h / 2 + distorted * (h * 0.38);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(renderWave);
    };

    renderWave();
    return () => cancelAnimationFrame(animId);
  }, [bass.distortion]);

  const playBassNote = (note: number) => {
    phonkEngine.init();
    setActiveNote(note);
    phonkEngine.setDistortionAmount(bass.distortion);
    phonkEngine.play808Bass(note, (bass.decay / 100) * 1.2);

    if (onBassHit) onBassHit(note);

    setTimeout(() => {
      setActiveNote(null);
    }, 300);
  };

  const updateParam = (key: keyof typeof bass, value: number) => {
    setBass((prev) => ({ ...prev, [key]: value }));
    if (key === 'distortion') {
      phonkEngine.setDistortionAmount(value);
    }
  };

  return (
    <Card className="apple-glass-card rounded-2xl border-white/10 text-white shadow-2xl overflow-hidden">
      <CardHeader className="pb-3 pt-5 px-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                808 Sub-Bass Synth
              </CardTitle>
              <p className="text-[11px] text-zinc-400">Brazilian Drift sub glide & saturation</p>
            </div>
          </div>
          <Badge variant="outline" className="border-rose-500/30 text-rose-400 text-[10px] bg-rose-500/10">
            ANALOG SAT
          </Badge>
        </div>

        {/* 808 Sub Waveform Mini Screen */}
        <div className="mt-3 relative rounded-xl overflow-hidden border border-white/10 bg-black/60 shadow-inner">
          <canvas ref={canvasRef} width={280} height={55} className="w-full h-[55px] block" />
          <div className="absolute bottom-1 right-2 text-[9px] font-mono text-zinc-400">
            SAT: {bass.distortion}% | GLIDE: {bass.glide}ms
          </div>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-2 gap-1.5 pt-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setBass(preset.settings)}
              className="apple-spring-btn px-2 py-1 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/40 border border-white/10 text-zinc-300 hover:text-white transition-all text-left truncate"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Playable 8-Key Phonk Note Board */}
        <div>
          <div className="text-xs font-semibold text-zinc-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Music2 className="h-3.5 w-3.5 text-rose-400" /> Phonk Bass Scale
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">TAP TO TRIGGER</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {bassNotes.map((item) => (
              <button
                key={item.note}
                onClick={() => playBassNote(item.note)}
                className={`apple-spring-btn py-2.5 px-1 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  activeNote === item.note
                    ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_#f43f5e] scale-95'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-200 hover:border-rose-500/30'
                }`}
              >
                <span className="font-bold text-xs">{item.name}</span>
                <span className="text-[9px] text-zinc-400 font-mono">{item.tag}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Parameter Sliders */}
        <div className="space-y-3 pt-2 border-t border-white/5">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400 font-medium">Overdrive Saturation</span>
              <span className="font-mono text-rose-400 font-bold">{bass.distortion}%</span>
            </div>
            <Slider
              value={[bass.distortion]}
              min={0}
              max={100}
              onValueChange={([v]) => updateParam('distortion', v)}
              className="accent-rose-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400 font-medium">Pitch Glide (Portamento)</span>
              <span className="font-mono text-zinc-300">{bass.glide} ms</span>
            </div>
            <Slider
              value={[bass.glide]}
              min={0}
              max={100}
              onValueChange={([v]) => updateParam('glide', v)}
              className="accent-rose-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400 font-medium">Sub Decay Length</span>
              <span className="font-mono text-zinc-300">{bass.decay}%</span>
            </div>
            <Slider
              value={[bass.decay]}
              min={20}
              max={100}
              onValueChange={([v]) => updateParam('decay', v)}
              className="accent-rose-500"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
