import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Auto-translating text component.
 * Usage: <T>Hello world</T>
 * Will display translated text when language is not English.
 */
export function T({ children }: { children: string }) {
  const { language, translateText } = useLanguage();
  const [text, setText] = useState(children);

  useEffect(() => {
    let cancelled = false;
    if (language === "en") {
      setText(children);
      return;
    }
    translateText(children).then((t) => {
      if (!cancelled) setText(t);
    });
    return () => { cancelled = true; };
  }, [children, language, translateText]);

  return <>{text}</>;
}

/**
 * Hook version for when you need translated text as a string (e.g. placeholders, titles).
 */
export function useTranslated(text: string): string {
  const { language, translateText } = useLanguage();
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    let cancelled = false;
    if (language === "en") {
      setTranslated(text);
      return;
    }
    translateText(text).then((t) => {
      if (!cancelled) setTranslated(t);
    });
    return () => { cancelled = true; };
  }, [text, language, translateText]);

  return translated;
}
