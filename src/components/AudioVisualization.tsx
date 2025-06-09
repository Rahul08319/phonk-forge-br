
import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface AudioVisualizationProps {
  isPlaying: boolean;
}

export const AudioVisualization = ({ isPlaying }: AudioVisualizationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);

      if (isPlaying) {
        // Create a simple waveform visualization
        const barWidth = width / 32;
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(1, '#ec4899');
        
        ctx.fillStyle = gradient;

        for (let i = 0; i < 32; i++) {
          const barHeight = Math.random() * height * 0.8;
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
  }, [isPlaying]);

  return (
    <Card className="border-purple-500/30 bg-black/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Waveform
        </CardTitle>
      </CardHeader>
      <CardContent>
        <canvas
          ref={canvasRef}
          width={300}
          height={120}
          className="w-full h-24 bg-black/50 rounded border border-purple-500/30"
        />
        <div className="mt-2 text-xs text-gray-400 text-center">
          {isPlaying ? "Playing..." : "Ready to play"}
        </div>
      </CardContent>
    </Card>
  );
};
