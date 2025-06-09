
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Music, FileAudio } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  detectedBPM: number;
  onBPMDetected: (bpm: number) => void;
}

export const FileUpload = ({ onFileSelect, detectedBPM, onBPMDetected }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an audio file (MP3, WAV, etc.)",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setAnalyzing(true);
    onFileSelect(file);

    // Simulate BPM detection
    setTimeout(() => {
      const randomBPM = Math.floor(Math.random() * 60) + 120; // 120-180 BPM
      onBPMDetected(randomBPM);
      setAnalyzing(false);
      toast({
        title: "Audio analyzed",
        description: `Detected BPM: ${randomBPM}`,
      });
    }, 2000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Card className="border-purple-500/30 bg-black/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Music className="h-5 w-5" />
          Audio Input
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="border-2 border-dashed border-purple-500/50 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
          
          {selectedFile ? (
            <div className="space-y-2">
              <FileAudio className="h-8 w-8 mx-auto text-purple-400" />
              <p className="text-sm text-purple-300">{selectedFile.name}</p>
              <p className="text-xs text-gray-400">
                Size: {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-purple-400" />
              <p className="text-purple-300">Drop audio file here</p>
              <p className="text-xs text-gray-400">or click to browse</p>
            </div>
          )}
        </div>

        {analyzing && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2 text-purple-300">
              <div className="animate-spin h-4 w-4 border-2 border-purple-400 border-t-transparent rounded-full"></div>
              <span className="text-sm">Analyzing audio...</span>
            </div>
          </div>
        )}

        {selectedFile && !analyzing && (
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Detected BPM:</span>
              <span className="text-purple-300 font-mono">{detectedBPM}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Key:</span>
              <span className="text-purple-300 font-mono">F# Minor</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
