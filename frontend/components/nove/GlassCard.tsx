import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export function GlassCard({ children, className = "", hover = true }: Props) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-inner-glow backdrop-blur-md transition duration-300 ease-out ${
        hover ? "hover:-translate-y-0.5 hover:border-teal-400/25 hover:shadow-[0_0_40px_-14px_rgba(94,234,212,0.22)]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
