"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

export function AuthSplitShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const { t } = useI18n();
  const caps = [
    t("auth.brandCapVideo"),
    t("auth.brandCapImage"),
    t("auth.brandCapMotion"),
    t("auth.brandCapStory"),
  ] as const;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-nove-ink lg:flex-row">
      <div className="pointer-events-none absolute inset-0 nove-mesh-bg opacity-80" />
      <div className="pointer-events-none absolute -left-1/4 top-0 h-[min(90vh,640px)] w-[min(90vw,720px)] animate-aurora-shift rounded-full bg-gradient-to-br from-violet-600/25 via-transparent to-teal-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-1/4 bottom-0 h-[min(80vh,560px)] w-[min(85vw,640px)] animate-orb-drift rounded-full bg-gradient-to-tl from-blue-600/20 via-transparent to-teal-400/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,0.55)_100%)]" />

      <aside className="relative z-10 flex flex-col justify-between overflow-hidden px-8 py-12 lg:w-[48%] lg:max-w-[640px] lg:px-14 lg:py-16">
        <div className="pointer-events-none absolute inset-0 opacity-[0.09]">
          <div className="absolute -left-1/3 top-1/4 h-[min(55vh,520px)] w-[min(90vw,560px)] animate-aurora-shift rounded-full bg-gradient-to-br from-teal-400/40 via-transparent to-violet-500/30 blur-3xl" />
          <div className="absolute -right-1/4 bottom-0 h-[min(45vh,420px)] w-[min(80vw,480px)] animate-aurora-shift rounded-full bg-gradient-to-tl from-violet-500/35 via-transparent to-blue-500/25 blur-3xl [animation-delay:-7s]" />
        </div>
        <div className="pointer-events-none absolute inset-0">
          {[12, 28, 44, 62, 78, 18, 88, 52, 36, 70].map((top, i) => (
            <span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-white/80 opacity-[0.12] animate-orb-drift"
              style={{ left: `${8 + (i * 7) % 84}%`, top: `${top}%`, animationDelay: `${-i * 0.7}s` }}
            />
          ))}
        </div>
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2 text-white transition hover:opacity-90">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-violet-500 text-base font-bold text-nove-ink shadow-[0_0_48px_-8px_rgba(94,234,212,0.45)]">
              N
            </span>
            <span className="text-lg font-semibold tracking-tight">
              NOVE <span className="text-slate-500">Studio</span>
            </span>
          </Link>
          <div className="relative mt-10 hidden overflow-hidden rounded-2xl border border-white/[0.06] bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:mt-12 lg:block">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-500/15 via-transparent to-violet-600/20 opacity-70" />
            <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-900/80 via-nove-graphite to-black">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(94,234,212,0.2),transparent_55%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(105deg,transparent_40%,rgba(255,255,255,0.04)_50%,transparent_60%)]" />
            </div>
          </div>
          <h2 className="mt-8 max-w-lg animate-fade-slide-slow text-3xl font-semibold leading-[1.05] tracking-tight text-white sm:mt-10 sm:text-5xl sm:leading-[1.02] lg:mt-10">
            {t("auth.brandHeadline")}
          </h2>
          <p className="mt-5 max-w-md animate-fade-slide-delay text-sm leading-relaxed text-slate-400 sm:text-base">{t("auth.brandSub")}</p>
        </div>
        <div className="mt-12 hidden lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">{t("auth.brandCapsEyebrow")}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {caps.map((c) => (
              <li
                key={c}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-sm"
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16 pt-8 lg:px-10 lg:pb-12 lg:pt-12">
        <div className="w-full max-w-[400px]">
          <div className="rounded-[1.75rem] border border-white/[0.1] bg-black/40 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_40px_120px_-52px_rgba(94,234,212,0.15)] backdrop-blur-2xl sm:p-9">
            {children}
          </div>
          {footer ? <div className="mt-8 text-center text-sm text-slate-500">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
