import { createContext, useContext, useCallback, useState, ReactNode } from "react";
import { useLanguage } from "./useLanguage";

interface SpeechContextType {
  speed: number;
  setSpeed: (s: number) => void;
}

const SpeechContext = createContext<SpeechContextType | undefined>(undefined);

export function SpeechProvider({ children }: { children: ReactNode }) {
  const [speed, setSpeedState] = useState(() => {
    const saved = localStorage.getItem("eva-speech-speed");
    return saved ? parseFloat(saved) : 1;
  });

  const setSpeed = useCallback((s: number) => {
    setSpeedState(s);
    localStorage.setItem("eva-speech-speed", String(s));
  }, []);

  return (
    <SpeechContext.Provider value={{ speed, setSpeed }}>
      {children}
    </SpeechContext.Provider>
  );
}

export function useSpeechSettings() {
  const ctx = useContext(SpeechContext);
  if (!ctx) throw new Error("useSpeechSettings must be inside SpeechProvider");
  return ctx;
}

export function useSpeech() {
  const { language, translateText } = useLanguage();
  const { speed } = useSpeechSettings();
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback(
    async (text: string) => {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();

      // Translate text first if not English
      const textToSpeak = language === "en" ? text : await translateText(text);

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = language;
      utterance.rate = speed;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [language, speed, translateText],
  );

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking };
}
