import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "tl", label: "Tagalog" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

interface LanguageContextType {
  language: LangCode;
  setLanguage: (lang: LangCode) => void;
  t: (text: string) => string;
  translateText: (text: string) => Promise<string>;
}

const cache = new Map<string, string>();

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LangCode>(() => {
    return (localStorage.getItem("eva-lang") as LangCode) || "en";
  });

  const setLanguage = useCallback((lang: LangCode) => {
    localStorage.setItem("eva-lang", lang);
    setLanguageState(lang);
    // Clear cache on language change
    cache.clear();
    // Reload to apply everywhere
    window.location.reload();
  }, []);

  // Synchronous lookup (returns cached or original)
  const t = useCallback(
    (text: string) => {
      if (language === "en") return text;
      const key = `${language}:${text}`;
      return cache.get(key) || text;
    },
    [language],
  );

  // Async translation using free Google Translate API
  const translateText = useCallback(
    async (text: string): Promise<string> => {
      if (language === "en" || !text.trim()) return text;
      const key = `${language}:${text}`;
      if (cache.has(key)) return cache.get(key)!;
      try {
        const res = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${language}&dt=t&q=${encodeURIComponent(text)}`,
        );
        const json = await res.json();
        const translated = json[0]?.map((s: any) => s[0]).join("") || text;
        cache.set(key, translated);
        return translated;
      } catch {
        return text;
      }
    },
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateText }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be inside LanguageProvider");
  return ctx;
}
