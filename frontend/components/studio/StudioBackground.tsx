export function StudioBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-nove-ink">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(139,92,246,0.14),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_60%,rgba(59,130,246,0.1),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_100%,rgba(94,234,212,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.03)_50%,transparent_100%)] opacity-[0.35] blur-sm" />
      <div className="absolute left-[18%] top-0 h-full w-px bg-gradient-to-b from-transparent via-white/[0.07] to-transparent opacity-40" />
      <div className="absolute right-[22%] top-0 h-full w-px bg-gradient-to-b from-transparent via-teal-200/[0.06] to-transparent opacity-35" />
      <div
        className="absolute -left-1/3 top-1/4 h-[420px] w-[420px] animate-aurora-shift rounded-full bg-violet-600/20 blur-[100px]"
        style={{ animationDuration: "22s" }}
      />
      <div
        className="absolute -right-1/4 bottom-0 h-[380px] w-[380px] animate-aurora-shift rounded-full bg-teal-500/15 blur-[90px]"
        style={{ animationDuration: "28s", animationDelay: "-8s" }}
      />
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
