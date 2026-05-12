import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-nove-ink px-6 text-center">
      <div className="pointer-events-none absolute inset-0 nove-mesh-bg opacity-70" />
      <div className="pointer-events-none absolute -left-1/4 top-0 h-[min(70vh,520px)] w-[min(90vw,640px)] animate-aurora-shift rounded-full bg-gradient-to-br from-violet-600/20 to-transparent blur-3xl" />
      <div className="relative z-10 max-w-md rounded-[1.75rem] border border-white/[0.09] bg-black/40 px-10 py-14 shadow-glow-soft backdrop-blur-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-teal-300/80">404</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">This scene does not exist.</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">The link may be old, or the page was moved. Head back to the workspace.</p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-gradient-to-r from-teal-400 via-sky-400 to-cyan-300 px-8 py-3 text-sm font-semibold text-nove-ink shadow-glow transition hover:-translate-y-0.5"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
