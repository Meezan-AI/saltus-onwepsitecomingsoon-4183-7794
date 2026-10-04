import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en } from "./en";
import { ar } from "./ar";
import type { Content } from "./types";

export type Lang = "en" | "ar";

const DICTIONARIES: Record<Lang, Content> = { en, ar };
const STORAGE_KEY = "saltus-lang";

type LangContextValue = {
  lang: Lang;
  dir: "ltr" | "rtl";
  t: Content;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
};

const LangContext = createContext<LangContextValue | null>(null);

function readInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "ar" || stored === "en") return stored;
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = dir;
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang, dir]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);
  const toggleLang = useCallback(() => setLangState((prev) => (prev === "en" ? "ar" : "en")), []);

  const value = useMemo<LangContextValue>(
    () => ({ lang, dir, t: DICTIONARIES[lang], setLang, toggleLang }),
    [lang, dir, setLang, toggleLang]
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}
