import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/hooks/useSpeech";

interface SpeakButtonProps {
  text: string;
  className?: string;
  size?: "default" | "sm" | "icon";
}

export function SpeakButton({ text, className, size = "icon" }: SpeakButtonProps) {
  const { speak, stop, speaking } = useSpeech();

  return (
    <Button
      variant="ghost"
      size={size}
      className={className}
      onClick={() => (speaking ? stop() : speak(text))}
      aria-label={speaking ? "Stop reading" : "Read aloud"}
      title={speaking ? "Stop reading" : "Read aloud"}
    >
      {speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </Button>
  );
}
