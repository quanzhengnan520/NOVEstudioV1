"use client";

import { useI18n } from "@/lib/i18n/context";

/** Decorative “AI preview” collage — no live data */
export function HeroFloatingStage() {
  const { t } = useI18n();

  return (
    <div className="relative mx-auto mt-4 w-full max-w-5xl px-0 sm:mt-6">
      <div className="pointer-events-none absolute -inset-x-6 -bottom-8 top-1/3 rounded-[2rem] bg-gradient-to-t from-teal-500/10 via-transparent to-violet-500/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-black/50 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_40px_120px_-48px_rgba(94,234,212,0.2)] backdrop-blur-2xl sm:p-5 md:rounded-[2rem] md:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,255,255,0.08),transparent_55%)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        {/* subtle scan line */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[28%] animate-hero-scan bg-gradient-to-b from-teal-300/[0.04] via-transparent to-transparent opacity-60"
          aria-hidden
        />
        <p className="relative text-center nove-eyebrow">{t("landing.heroStageEyebrow")}</p>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-[1.15fr_0.85fr] sm:gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-black/45 shadow-inner-glow">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-violet-900/25 to-black" />
            {/* slow rotating glow */}
            <div
              className="pointer-events-none absolute -inset-8 scale-110 opacity-[0.26] blur-2xl animate-glow-rotate"
              style={{
                background:
                  "conic-gradient(from 120deg, transparent, rgba(94,234,212,0.22), transparent, rgba(139,92,246,0.16), transparent)",
              }}
              aria-hidden
            />
            <div className="relative flex aspect-video flex-col justify-between p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full border border-white/10 bg-black/50 px-2 py-0.5 text-[10px] font-medium text-teal-100/90">
                  {t("landing.heroStageClip")}
                </span>
                <span className="animate-pulse-glow-slow rounded-full border border-teal-400/30 bg-teal-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-100">
                  {t("landing.heroStageBadge")}
                </span>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 shadow-[0_0_36px_-6px_rgba(94,234,212,0.55)] transition duration-700 ease-out hover:scale-105">
                  <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 text-white" fill="currentColor" aria-hidden>
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                </span>
              </div>
              <p className="line-clamp-2 text-left font-mono text-[11px] leading-relaxed text-slate-300/95 sm:text-xs">{t("landing.heroStagePrompt")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="animate-hero-drift aspect-[4/5] rounded-xl border border-white/[0.06] bg-gradient-to-br from-violet-500/30 to-slate-950/80 shadow-inner-glow transition duration-500 ease-out hover:from-violet-400/38 hover:shadow-[0_0_32px_-12px_rgba(139,92,246,0.35)]" />
              <div className="aspect-[4/5] animate-hero-drift rounded-xl border border-white/[0.06] bg-gradient-to-br from-teal-500/25 to-slate-950/80 shadow-inner-glow transition duration-500 ease-out [animation-delay:-4s] [animation-duration:14s] hover:from-teal-400/35 hover:shadow-[0_0_32px_-12px_rgba(94,234,212,0.3)]" />
            </div>
            <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-black/40 px-3 py-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-slate-500">{t("landing.heroStageTimeline")}</p>
              <div className="relative mt-2 flex gap-1">
                {[2, 1, 3, 1, 2].map((grow, i) => (
                  <div
                    key={i}
                    className="relative h-1.5 min-w-[4px] overflow-hidden rounded-full bg-gradient-to-r from-teal-400/35 to-violet-400/25"
                    style={{ flexGrow: grow, opacity: 0.45 + i * 0.07 }}
                  >
                    <div
                      className="absolute inset-y-0 w-1/2 animate-slow-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent"
                      style={{ animationDelay: `${i * 0.9}s` }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center gap-1.5 py-0.5" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1 w-1 rounded-full bg-teal-300/50"
                  style={{
                    animation: "dot-pulse 2.4s ease-in-out infinite",
                    animationDelay: `${i * 0.35}s`,
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.03] py-6 text-[10px] text-slate-500 transition duration-300 ease-out hover:border-teal-400/20 hover:bg-white/[0.05]">
                {t("landing.heroStageCardA")}
              </div>
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.03] py-6 text-[10px] text-slate-500 transition duration-300 ease-out hover:border-teal-400/20 hover:bg-white/[0.05]">
                {t("landing.heroStageCardB")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
