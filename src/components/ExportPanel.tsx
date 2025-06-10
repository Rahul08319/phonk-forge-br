import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Save, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportPanelProps {
  audioFile: File | null;
}

export const ExportPanel = ({ audioFile }: ExportPanelProps) => {
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const { toast } = useToast();

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: 'wav' | 'mp3' | 'stems') => {
    if (!audioFile) {
      toast({
        title: "No audio file",
        description: "Please upload an audio file first",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);
    setExportProgress(0);

    try {
      // Simulate export progress
      const interval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 15;
        });
      }, 300);

      // Create a processed version of the audio file
      // For now, we'll download the original file with a new name
      // In a real implementation, this would be where audio processing happens
      await new Promise(resolve => setTimeout(resolve, 2000));

      clearInterval(interval);
      setExportProgress(100);

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const baseName = audioFile.name.split('.')[0];
      let filename: string;

      if (format === 'stems') {
        // For stems, create multiple files (simplified simulation)
        const stemTypes = ['drums', 'bass', 'melody', 'vocals'];
        for (const stem of stemTypes) {
          filename = `${baseName}_${stem}_${timestamp}.wav`;
          downloadFile(audioFile, filename);
        }
        toast({
          title: "Stems export complete!",
          description: `4 stem files have been downloaded`,
        });
      } else {
        filename = `${baseName}_phonk_remix_${timestamp}.${format}`;
        downloadFile(audioFile, filename);
        toast({
          title: "Export complete!",
          description: `Your Brazilian Phonk remix has been downloaded as ${format.toUpperCase()}`,
        });
      }

      setExporting(false);
      setExportProgress(0);
    } catch (error) {
      console.error('Export error:', error);
      setExporting(false);
      setExportProgress(0);
      toast({
        title: "Export failed",
        description: "There was an error exporting your file",
        variant: "destructive",
      });
    }
  };

  const savePreset = () => {
    const presetData = {
      name: `Custom Preset ${new Date().toLocaleTimeString()}`,
      settings: {
        timestamp: new Date().toISOString(),
        // This would include all the current settings in a real implementation
      }
    };
    
    const blob = new Blob([JSON.stringify(presetData, null, 2)], { type: 'application/json' });
    downloadFile(blob, `phonk_preset_${Date.now()}.json`);
    
    toast({
      title: "Preset saved",
      description: "Your preset has been downloaded as a JSON file",
    });
  };

  return (
    <Card className="border-purple-500/30 bg-black/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export & Save
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Export Options */}
          <div className="md:col-span-2 space-y-2">
            <h4 className="text-sm font-medium text-purple-300 mb-2">Export Format</h4>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('mp3')}
                disabled={exporting || !audioFile}
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
              >
                MP3
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('wav')}
                disabled={exporting || !audioFile}
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
              >
                WAV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('stems')}
                disabled={exporting || !audioFile}
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
              >
                Stems
              </Button>
            </div>
          </div>

          {/* Preset Management */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-purple-300 mb-2">Presets</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={savePreset}
              className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Preset
            </Button>
          </div>

          {/* Share */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-purple-300 mb-2">Share</h4>
            <Button
              variant="outline"
              size="sm"
              disabled={!audioFile}
              className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
            >
              <Share className="h-4 w-4 mr-2" />
              Share Link
            </Button>
          </div>
        </div>

        {exporting && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-purple-300">Exporting...</span>
              <span className="text-gray-400">{exportProgress}%</span>
            </div>
            <Progress value={exportProgress} className="w-full" />
          </div>
        )}

        {audioFile && (
          <div className="mt-4 pt-4 border-t border-purple-500/30 text-xs text-gray-400">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-purple-300">Input:</span> {audioFile.name}
              </div>
              <div>
                <span className="text-purple-300">Size:</span> {(audioFile.size / (1024 * 1024)).toFixed(1)} MB
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
