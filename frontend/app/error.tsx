"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-nove-ink px-6 text-center">
      <div className="pointer-events-none absolute inset-0 nove-mesh-bg opacity-70" />
      <div className="pointer-events-none absolute right-0 top-1/4 h-[420px] w-[420px] animate-orb-drift rounded-full bg-rose-500/10 blur-[100px]" />
      <div className="relative z-10 max-w-md rounded-[1.75rem] border border-rose-500/20 bg-black/45 px-10 py-14 shadow-[0_0_48px_-12px_rgba(244,63,94,0.25)] backdrop-blur-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-rose-300/90">Error</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">Something interrupted the render.</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{error.message || "Please try again."}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full border border-white/15 bg-white/[0.06] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.1]"
          >
            Retry
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-teal-400 to-cyan-300 px-6 py-2.5 text-sm font-semibold text-nove-ink shadow-glow transition hover:opacity-90"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
