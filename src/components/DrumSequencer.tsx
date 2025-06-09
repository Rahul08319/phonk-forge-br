
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shuffle, RotateCcw } from "lucide-react";

export const DrumSequencer = () => {
  const [pattern, setPattern] = useState({
    cowbell: Array(16).fill(false).map((_, i) => i % 4 === 0),
    kick: Array(16).fill(false).map((_, i) => i === 0 || i === 8),
    snare: Array(16).fill(false).map((_, i) => i === 4 || i === 12),
    hihat: Array(16).fill(false).map((_, i) => i % 2 === 1),
  });

  const [currentStep, setCurrentStep] = useState(0);

  const drumNames = {
    cowbell: "Cowbell",
    kick: "Kick",
    snare: "Snare/Clap",
    hihat: "Hi-Hat",
  };

  const toggleStep = (drum: keyof typeof pattern, step: number) => {
    setPattern(prev => ({
      ...prev,
      [drum]: prev[drum].map((active, i) => i === step ? !active : active)
    }));
  };

  const randomizePattern = (drum: keyof typeof pattern) => {
    setPattern(prev => ({
      ...prev,
      [drum]: Array(16).fill(false).map(() => Math.random() > 0.7)
    }));
  };

  const clearPattern = (drum: keyof typeof pattern) => {
    setPattern(prev => ({
      ...prev,
      [drum]: Array(16).fill(false)
    }));
  };

  return (
    <Card className="border-purple-500/30 bg-black/40 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            🥁 Drum Sequencer
          </span>
          <div className="text-sm font-normal text-gray-400">
            16 Steps - Brazilian Phonk
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {(Object.keys(pattern) as Array<keyof typeof pattern>).map((drum) => (
          <div key={drum} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-300">
                {drumNames[drum]}
              </span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => randomizePattern(drum)}
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 h-6 px-2"
                >
                  <Shuffle className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => clearPattern(drum)}
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 h-6 px-2"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-16 gap-1">
              {pattern[drum].map((active, step) => (
                <button
                  key={step}
                  onClick={() => toggleStep(drum, step)}
                  className={`
                    aspect-square rounded-sm border transition-all duration-150
                    ${active 
                      ? 'bg-purple-500 border-purple-400 shadow-purple-500/50 shadow-sm' 
                      : 'bg-gray-800 border-gray-600 hover:border-purple-500/50'
                    }
                    ${step === currentStep ? 'ring-2 ring-pink-400' : ''}
                    ${step % 4 === 0 ? 'border-l-2 border-l-purple-300' : ''}
                  `}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-purple-500/30">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Pattern Length: 16 steps</span>
            <span className="text-purple-300">Current: Step {currentStep + 1}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
