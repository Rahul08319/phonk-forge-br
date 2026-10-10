import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { phonkEngine } from "@/lib/phonkAudioEngine";
import { Activity, Radio, BarChart3, Waves } from "lucide-react";

interface AudioVisualizationProps {
  isPlaying: boolean;
  audioFile?: File | null;
  getAudioData?: () => Uint8Array | null;
}

type VisualMode = 'liquid' | 'spectrum' | 'scope';

export const AudioVisualization = ({ isPlaying, audioFile, getAudioData }: AudioVisualizationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [mode, setMode] = useState<VisualMode>('spectrum');
  const [peakDb, setPeakDb] = useState<number>(-36);
  const [isClipping, setIsClipping] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localPhase = 0;
    const peakHoldBars: number[] = new Array(32).fill(0);

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      localPhase += 0.04;

      // Deep Apple OLED canvas background
      ctx.fillStyle = 'rgba(10, 10, 16, 0.45)';
      ctx.fillRect(0, 0, width, height);

      // Check if real WebAudio analyser is available
      const analyser = phonkEngine.getAnalyser();
      let freqData: Uint8Array | null = null;
      let timeData: Uint8Array | null = null;

      if (analyser && isPlaying) {
        freqData = new Uint8Array(analyser.frequencyBinCount);
        timeData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);

        // Calculate peak dB
        let maxVal = 0;
        for (let i = 0; i < freqData.length; i++) {
          if (freqData[i] > maxVal) maxVal = freqData[i];
        }
        const calculatedDb = Math.round((maxVal / 255) * 48 - 48);
        setPeakDb(calculatedDb);
        setIsClipping(maxVal > 245);
      } else {
        setPeakDb(isPlaying ? -12 : -48);
        setIsClipping(false);
      }

      // Grid Lines (Studio Oscilloscope Look)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (mode === 'spectrum') {
        // --- 32-BAND NEON SPECTRUM WITH PEAK-HOLD ---
        const barCount = 32;
        const totalSpacing = 3;
        const barWidth = (width - (barCount - 1) * totalSpacing) / barCount;

        for (let i = 0; i < barCount; i++) {
          let amplitude = 0;

          if (freqData && isPlaying) {
            const index = Math.floor((i / barCount) * (freqData.length * 0.65));
            amplitude = freqData[index] / 255;
          } else if (isPlaying) {
            // Simulated bounce if audio is running without explicit mic/file input
            amplitude = 0.35 + 0.45 * Math.sin(localPhase * 2.2 + i * 0.35) * Math.cos(localPhase * 1.5 + i * 0.2);
            amplitude = Math.max(0.08, amplitude);
          } else {
            amplitude = 0.06 + 0.03 * Math.sin(localPhase + i * 0.3);
          }

          const barHeight = Math.max(4, amplitude * (height * 0.78));
          const x = i * (barWidth + totalSpacing);
          const y = height - barHeight - 4;

          // Apple Brazilian Phonk Gradient (Electric Violet -> Hot Pink -> Cyan)
          const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
          grad.addColorStop(0, '#8b5cf6'); // Purple
          grad.addColorStop(0.5, '#ec4899'); // Pink
          grad.addColorStop(1, '#06b6d4'); // Cyan

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]) : ctx.fillRect(x, y, barWidth, barHeight);
          ctx.fill();

          // Peak hold cap with smooth gravity decay
          if (barHeight > peakHoldBars[i]) {
            peakHoldBars[i] = barHeight;
          } else {
            peakHoldBars[i] = Math.max(0, peakHoldBars[i] - 1.2);
          }

          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(x, height - peakHoldBars[i] - 7, barWidth, 2);
        }
      } else if (mode === 'liquid') {
        // --- LIQUID WAVEFORM RIBBON ---
        ctx.beginPath();
        const points = 120;
        const step = width / points;

        for (let i = 0; i <= points; i++) {
          let amp = 0;
          if (timeData && isPlaying) {
            const idx = Math.floor((i / points) * timeData.length);
            amp = (timeData[idx] - 128) / 128;
          } else if (isPlaying) {
            amp = Math.sin(i * 0.15 + localPhase * 3) * 0.45 + Math.sin(i * 0.08 - localPhase * 2) * 0.25;
          } else {
            amp = Math.sin(i * 0.1 + localPhase) * 0.08;
          }

          const x = i * step;
          const y = height / 2 + amp * (height * 0.4);

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Reflection under ribbon
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        const fillGrad = ctx.createLinearGradient(0, height / 2, 0, height);
        fillGrad.addColorStop(0, 'rgba(168, 85, 247, 0.25)');
        fillGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = fillGrad;
        ctx.fill();
      } else if (mode === 'scope') {
        // --- PHOSPHOR RADIAL OSCILLOSCOPE ---
        const cx = width / 2;
        const cy = height / 2;
        const baseRadius = Math.min(cx, cy) * 0.65;

        ctx.beginPath();
        const numSamples = 72;
        for (let i = 0; i <= numSamples; i++) {
          const angle = (i / numSamples) * Math.PI * 2;
          let amp = 0;
          if (freqData && isPlaying) {
            amp = (freqData[i % freqData.length] / 255) * 28;
          } else if (isPlaying) {
            amp = Math.sin(angle * 5 + localPhase * 4) * 14 + Math.cos(angle * 3 - localPhase * 2) * 8;
          } else {
            amp = Math.sin(angle * 4 + localPhase) * 3;
          }

          const r = baseRadius + amp;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Center Pulsing Core
        ctx.beginPath();
        const coreR = Math.max(3, 8 + (isPlaying ? Math.sin(localPhase * 4) * 4 : 0));
        ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
        ctx.fillStyle = '#ec4899';
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, mode]);

  return (
    <Card className="apple-glass-card rounded-2xl border-white/10 text-white overflow-hidden shadow-2xl">
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2 text-zinc-100">
            <Activity className="h-4 w-4 text-purple-400" />
            Live Oscilloscope & FFT
          </CardTitle>

          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setMode('spectrum')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                mode === 'spectrum' ? 'bg-purple-600/80 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Bars
            </button>
            <button
              onClick={() => setMode('liquid')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                mode === 'liquid' ? 'bg-purple-600/80 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Wave
            </button>
            <button
              onClick={() => setMode('scope')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                mode === 'scope' ? 'bg-purple-600/80 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Radial
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5 pt-0 space-y-3">
        {/* Canvas Display */}
        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/60 shadow-inner">
          <canvas
            ref={canvasRef}
            width={380}
            height={130}
            className="w-full h-[130px] block"
          />

          {/* Audio Status Overlay */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] text-zinc-300">
            <div className={`h-1.5 w-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
            <span>{isPlaying ? 'ACTIVE DSP' : 'STANDBY'}</span>
          </div>

          {/* Master dB Meter */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono">
            <span className={isClipping ? 'text-rose-400 font-bold' : 'text-zinc-300'}>
              {peakDb > -45 ? `${peakDb} dB` : '-INF'}
            </span>
            <div className={`h-1.5 w-1.5 rounded-full ${isClipping ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
          </div>
        </div>

        {/* Audio File Indicator */}
        {audioFile && (
          <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 text-zinc-300">
            <span className="truncate max-w-[200px]">🎵 {audioFile.name}</span>
            <span className="text-[10px] text-purple-400 font-mono">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
