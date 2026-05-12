"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/types";
import { LOCALES } from "@/lib/i18n/types";
import { useI18n } from "@/lib/i18n/context";

const labels: Record<Locale, string> = {
  zh: "中文",
  zhTw: "繁中",
  en: "EN",
  ja: "JA",
};

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-medium text-slate-300 transition hover:border-teal-400/25 hover:bg-white/[0.07] hover:text-white sm:px-3"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="hidden text-slate-500 sm:inline">{t("lang.switch")}</span>
        <span className="tabular-nums text-teal-200/90">{labels[locale]}</span>
        <span className="text-slate-500">▾</span>
      </button>
      {open ? (
        <ul
          className="absolute right-0 z-[60] mt-2 min-w-[9.5rem] rounded-xl border border-white/10 bg-nove-graphite/95 py-1 shadow-xl backdrop-blur-xl"
          role="listbox"
        >
          {LOCALES.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={locale === l}
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs ${
                  locale === l ? "bg-teal-500/15 text-teal-100" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{t(`lang.${l}`)}</span>
                {locale === l ? <span className="text-teal-400">✓</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
