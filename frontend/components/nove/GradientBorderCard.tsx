import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Soft neon gradient ring + inner glass panel */
export function GradientBorderCard({ children, className = "" }: Props) {
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br from-violet-500/25 via-teal-400/15 to-blue-500/20 p-[1px] shadow-[0_0_40px_-12px_rgba(94,234,212,0.15)] transition duration-300 hover:from-violet-400/35 hover:shadow-glow ${className}`}
    >
      <div className="rounded-2xl bg-nove-graphite/90 p-6 backdrop-blur-xl">{children}</div>
    </div>
  );
}
