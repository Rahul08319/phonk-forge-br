import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Gauge, Clock, Zap, ArrowDownUp } from "lucide-react";

interface TempoControlsProps {
  originalBPM: number;
  targetBPM: number;
  onTargetBPMChange: (bpm: number) => void;
}

export const TempoControls = ({
  originalBPM,
  targetBPM,
  onTargetBPMChange,
}: TempoControlsProps) => {
  const tapTimesRef = useRef<number[]>([]);
  const [tapFlash, setTapFlash] = useState(false);
  const [beatPulse, setBeatPulse] = useState(false);

  // Metronome pulse indicator
  useEffect(() => {
    const intervalMs = (60 / targetBPM) * 1000;
    const interval = setInterval(() => {
      setBeatPulse(true);
      setTimeout(() => setBeatPulse(false), 90);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [targetBPM]);

  // Tap Tempo Logic
  const handleTapTempo = () => {
    const now = performance.now();
    setTapFlash(true);
    setTimeout(() => setTapFlash(false), 120);

    const times = tapTimesRef.current;
    // Reset if last tap was more than 2 seconds ago
    if (times.length > 0 && now - times[times.length - 1] > 2000) {
      tapTimesRef.current = [];
    }

    tapTimesRef.current.push(now);

    if (tapTimesRef.current.length > 4) {
      tapTimesRef.current.shift();
    }

    if (tapTimesRef.current.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 60 && calculatedBpm <= 200) {
        onTargetBPMChange(calculatedBpm);
      }
    }
  };

  const handleHalfTime = () => {
    const newBpm = Math.max(60, Math.round(targetBPM / 2));
    onTargetBPMChange(newBpm);
  };

  const handleDoubleTime = () => {
    const newBpm = Math.min(220, Math.round(targetBPM * 2));
    onTargetBPMChange(newBpm);
  };

  return (
    <Card className="apple-glass-card rounded-2xl border-white/10 text-white shadow-2xl overflow-hidden">
      <CardHeader className="pb-3 pt-5 px-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Gauge className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                Master Tempo & Time
              </CardTitle>
              <p className="text-[11px] text-zinc-400">Brazilian Drift & Memphis speed</p>
            </div>
          </div>

          {/* Realtime Beat Pulse Lamp */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
            <div
              className={`h-2 w-2 rounded-full transition-transform duration-75 ${
                beatPulse
                  ? 'bg-cyan-400 scale-125 shadow-[0_0_10px_#22d3ee]'
                  : 'bg-zinc-600 scale-100'
              }`}
            />
            <span className="font-mono text-[10px] text-zinc-300">PULSE</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Large Apple-grade BPM Display */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
          <div>
            <div className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400">Current Tempo</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight font-mono">{targetBPM}</span>
              <span className="text-xs font-semibold text-cyan-400">BPM</span>
            </div>
          </div>

          {/* Quick Increment Steppers */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onTargetBPMChange(Math.max(60, targetBPM - 5))}
              className="apple-spring-btn px-2 py-1 rounded-lg text-xs font-mono bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300"
            >
              -5
            </button>
            <button
              onClick={() => onTargetBPMChange(Math.max(60, targetBPM - 1))}
              className="apple-spring-btn px-2 py-1 rounded-lg text-xs font-mono bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300"
            >
              -1
            </button>
            <button
              onClick={() => onTargetBPMChange(Math.min(220, targetBPM + 1))}
              className="apple-spring-btn px-2 py-1 rounded-lg text-xs font-mono bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300"
            >
              +1
            </button>
            <button
              onClick={() => onTargetBPMChange(Math.min(220, targetBPM + 5))}
              className="apple-spring-btn px-2 py-1 rounded-lg text-xs font-mono bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300"
            >
              +5
            </button>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-1">
          <Slider
            value={[targetBPM]}
            min={60}
            max={200}
            step={1}
            onValueChange={([val]) => onTargetBPMChange(val)}
            className="accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>60 (Slowed)</span>
            <span>130 (Drift)</span>
            <span>160 (Favela)</span>
            <span>200 (Hardcore)</span>
          </div>
        </div>

        {/* Tap Tempo & Speed Modifiers */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <Button
            size="sm"
            onClick={handleTapTempo}
            className={`apple-spring-btn h-9 rounded-xl text-xs font-semibold border transition-all ${
              tapFlash
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_#06b6d4]'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-200'
            }`}
          >
            <Clock className="h-3 w-3 mr-1" />
            TAP TEMPO
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleHalfTime}
            className="apple-spring-btn h-9 rounded-xl text-xs border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300"
          >
            ½x Slowed
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDoubleTime}
            className="apple-spring-btn h-9 rounded-xl text-xs border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300"
          >
            2x Turbo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
