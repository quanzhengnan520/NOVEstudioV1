"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NotFound() {
  const pathname = usePathname();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-nove-ink px-6 text-center">
      <div className="pointer-events-none absolute inset-0 nove-mesh-bg opacity-70" />
      <div className="pointer-events-none absolute -left-1/4 top-0 h-[min(70vh,520px)] w-[min(90vw,640px)] animate-aurora-shift rounded-full bg-gradient-to-br from-violet-600/20 to-transparent blur-3xl" />
      <div className="relative z-10 max-w-md rounded-[1.75rem] border border-white/[0.09] bg-black/40 px-10 py-14 shadow-glow-soft backdrop-blur-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-teal-300/80">404</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">This scene does not exist.</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          The link may be old, or the page was moved. Head back to the workspace.
        </p>
        {pathname ? (
          <p className="mt-4 break-all font-mono text-[11px] text-slate-500" title="Current path">
            {pathname}
          </p>
        ) : null}
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          本地开发请打开 <span className="text-slate-300">http://localhost:3000</span>
          （若终端提示别的端口，请用终端里显示的地址）。视频工作台路径为{" "}
          <span className="text-slate-300">/video</span>。
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-teal-400 via-sky-400 to-cyan-300 px-8 py-3 text-sm font-semibold text-nove-ink shadow-glow transition hover:-translate-y-0.5"
          >
            Return home
          </Link>
          <Link
            href="/video"
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/[0.1]"
          >
            Open /video
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-3 text-sm text-slate-300 transition hover:border-teal-400/30 hover:text-white"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
