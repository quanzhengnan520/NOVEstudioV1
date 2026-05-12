"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "./types";
import { htmlLang, isLocale } from "./types";
import {
  LOCALE_STORAGE_KEY,
  detectLocaleFromNavigator,
  persistLocale,
  readLocaleCookie,
} from "./storage";
import { translate } from "./translations";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<Ctx | null>(null);

function HtmlLangEffect({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = htmlLang(locale);
  }, [locale]);
  return null;
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale | null;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (initialLocale) return initialLocale;
    return "zh";
  });

  useEffect(() => {
    try {
      const ls = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isLocale(ls)) {
        setLocaleState(ls);
        return;
      }
    } catch {
      /* ignore */
    }
    const ck = readLocaleCookie();
    if (ck) {
      setLocaleState(ck);
      return;
    }
    if (initialLocale) {
      setLocaleState(initialLocale);
      return;
    }
    const d = detectLocaleFromNavigator();
    setLocaleState(d);
    persistLocale(d);
  }, [initialLocale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    persistLocale(l);
    document.documentElement.lang = htmlLang(l);
  }, []);

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return (
    <I18nContext.Provider value={value}>
      <HtmlLangEffect locale={locale} />
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
