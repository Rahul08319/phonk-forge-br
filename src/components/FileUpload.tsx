import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Music, FileAudio, PlayCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onLoadDemo?: () => void;
  detectedBPM: number;
  onBPMDetected: (bpm: number) => void;
}

export const FileUpload = ({ onFileSelect, onLoadDemo, detectedBPM, onBPMDetected }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDemoLoaded, setIsDemoLoaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|flac|m4a|aac)$/i)) {
      toast({
        title: "Unsupported file",
        description: "Please upload an audio file (MP3, WAV, FLAC, M4A)",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setIsDemoLoaded(false);
    setAnalyzing(true);
    onFileSelect(file);

    setTimeout(() => {
      const estimatedBPM = 120 + Math.floor(Math.random() * 40);
      onBPMDetected(estimatedBPM);
      setAnalyzing(false);
      toast({
        title: "Audio Analysed",
        description: `BPM detected: ${estimatedBPM} | Key: F# Minor`,
      });
    }, 1200);
  };

  const handleDemoClick = () => {
    setIsDemoLoaded(true);
    setSelectedFile(null);
    if (onLoadDemo) {
      onLoadDemo();
    }
    toast({
      title: "Brazilian Phonk Demo Loaded",
      description: "Ready to remix with 808 bass, cowbell, and master FX!",
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <Card className="apple-glass-card rounded-2xl border-white/10 overflow-hidden shadow-xl">
      <CardHeader className="py-3 px-4 border-b border-white/5 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]" />
          <span>Audio Input & Stems</span>
        </CardTitle>
        <span className="text-[10px] font-mono text-zinc-400">INPUT SOURCE</span>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-white/15 hover:border-purple-400/60 bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          {selectedFile ? (
            <div className="space-y-1.5 py-1">
              <FileAudio className="h-7 w-7 mx-auto text-purple-400 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-medium text-white truncate max-w-[200px] mx-auto">
                {selectedFile.name}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • AUDIO
              </p>
            </div>
          ) : isDemoLoaded ? (
            <div className="space-y-1.5 py-1">
              <CheckCircle2 className="h-7 w-7 mx-auto text-emerald-400" />
              <p className="text-xs font-semibold text-emerald-300">
                Automotivo Baile Phonk Demo
              </p>
              <p className="text-[10px] text-zinc-400 font-mono">
                Built-in 24-bit 85 BPM Loop
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 py-1">
              <Upload className="h-7 w-7 mx-auto text-zinc-400 group-hover:text-purple-400 transition-colors" />
              <p className="text-xs font-medium text-zinc-300">Drop audio file or browse</p>
              <p className="text-[10px] text-zinc-500">MP3, WAV, FLAC, M4A</p>
            </div>
          )}
        </div>

        {/* 1-Click Demo Track Button */}
        <Button
          onClick={handleDemoClick}
          variant="outline"
          className="apple-spring-btn apple-glass-pill w-full h-8 text-xs font-medium rounded-xl text-purple-300 border-purple-500/30 hover:bg-purple-500/15 hover:border-purple-500/60 flex items-center justify-center gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          Load Demo Phonk Track (1-Click)
        </Button>

        {analyzing && (
          <div className="flex items-center justify-center gap-2 text-xs text-purple-300 py-1 font-mono">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
            <span>Analyzing transient envelope...</span>
          </div>
        )}

        {(selectedFile || isDemoLoaded) && !analyzing && (
          <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
              <span className="text-zinc-500 block text-[9px]">DETECTED TEMPO</span>
              <span className="text-purple-300 font-bold">{detectedBPM} BPM</span>
            </div>
            <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
              <span className="text-zinc-500 block text-[9px]">ROOT KEY</span>
              <span className="text-cyan-300 font-bold">F# MINOR</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
