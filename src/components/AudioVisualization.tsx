
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface AudioVisualizationProps {
  isPlaying: boolean;
  audioFile?: File | null;
}

export const AudioVisualization = ({ isPlaying, audioFile }: AudioVisualizationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Generate fake waveform data when audio file is loaded
  useEffect(() => {
    if (audioFile) {
      const fakeWaveform = Array.from({ length: 200 }, () => Math.random() * 0.8 + 0.2);
      setWaveformData(fakeWaveform);
    }
  }, [audioFile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; // Dark blue background
      ctx.fillRect(0, 0, width, height);

      if (audioFile && waveformData.length > 0) {
        // Draw waveform
        const barWidth = width / waveformData.length;
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(0.5, '#a855f7');
        gradient.addColorStop(1, '#ec4899');
        
        ctx.fillStyle = gradient;

        waveformData.forEach((amplitude, i) => {
          const barHeight = amplitude * height * 0.8;
          const x = i * barWidth;
          const y = height - barHeight;
          
          // Add slight animation when playing
          const animatedHeight = isPlaying 
            ? barHeight * (0.8 + Math.sin(Date.now() * 0.01 + i * 0.1) * 0.2)
            : barHeight;
          
          ctx.fillRect(x, height - animatedHeight, barWidth - 0.5, animatedHeight);
        });

        // Draw playhead when playing
        if (isPlaying) {
          const playheadX = (Date.now() * 0.1) % width;
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(playheadX, 0);
          ctx.lineTo(playheadX, height);
          ctx.stroke();
        }
      } else {
        // Draw placeholder bars when no file
        const barWidth = width / 32;
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#374151');
        gradient.addColorStop(1, '#6b7280');
        
        ctx.fillStyle = gradient;

        for (let i = 0; i < 32; i++) {
          const barHeight = isPlaying 
            ? (Math.sin(Date.now() * 0.005 + i * 0.2) * 0.3 + 0.5) * height * 0.6
            : Math.random() * height * 0.3;
          const x = i * barWidth;
          const y = height - barHeight;
          
          ctx.fillRect(x, y, barWidth - 1, barHeight);
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, audioFile, waveformData]);

  return (
    <Card className="border-purple-500/30 bg-black/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Audio Visualization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <canvas
          ref={canvasRef}
          width={300}
          height={120}
          className="w-full h-24 bg-slate-900/80 rounded border border-purple-500/30"
        />
        <div className="mt-2 text-xs text-center">
          {audioFile ? (
            <span className="text-purple-300">
              {isPlaying ? "🎵 Playing..." : "⏸️ Ready to play"} - {audioFile.name}
            </span>
          ) : (
            <span className="text-gray-400">Upload an audio file to see waveform</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
