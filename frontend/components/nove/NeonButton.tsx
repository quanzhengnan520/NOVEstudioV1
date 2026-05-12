import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  href?: string;
  loading?: boolean;
  size?: "md" | "xl";
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

const sizes = {
  md: "px-6 py-2.5 text-sm",
  xl: "min-h-[3.25rem] px-12 py-3.5 text-base sm:min-h-[3.5rem] sm:px-14 sm:text-lg",
};

const variants: Record<Variant, string> = {
  primary:
    "rounded-full bg-gradient-to-r from-teal-400 via-sky-400 to-cyan-300 font-semibold text-nove-ink shadow-glow-soft transition duration-300 ease-out hover:scale-[1.02] hover:shadow-[0_0_52px_-4px_rgba(94,234,212,0.58)] active:scale-[0.98] disabled:scale-100 disabled:opacity-60",
  secondary:
    "rounded-full border border-white/15 bg-white/[0.05] font-medium text-slate-100 transition duration-300 ease-out hover:scale-[1.02] hover:border-teal-400/35 hover:bg-white/[0.1] hover:shadow-[0_0_28px_-6px_rgba(94,234,212,0.28)] active:scale-[0.98]",
  ghost:
    "rounded-full px-4 py-2 text-sm text-slate-300 transition duration-300 ease-out hover:scale-[1.02] hover:bg-white/5 hover:text-white active:scale-[0.98]",
  danger:
    "rounded-full border border-rose-500/35 bg-rose-500/10 px-6 py-2.5 text-sm font-medium text-rose-100 shadow-[0_0_24px_-8px_rgba(244,63,94,0.35)] transition duration-300 ease-out hover:scale-[1.02] hover:bg-rose-500/20 active:scale-[0.98]",
};

export function NeonButton({
  children,
  variant = "primary",
  className = "",
  href,
  loading,
  size = "md",
  disabled,
  ...btn
}: Props) {
  const busy = Boolean(loading || disabled);
  const c = `${variants[variant]} ${sizes[size]} ${className} ${loading ? "relative overflow-hidden" : ""}`;
  const shimmer =
    loading && variant === "primary" ? (
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-[80%] bg-gradient-to-r from-transparent via-white/35 to-transparent animate-slow-shimmer"
      />
    ) : null;

  if (href) {
    return (
      <Link href={href} className={`inline-flex items-center justify-center active:scale-[0.98] ${c}`}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={`relative inline-flex items-center justify-center ${c}`} disabled={busy} {...btn}>
      {shimmer}
      <span className={loading ? "relative z-[1]" : undefined}>{children}</span>
    </button>
  );
}
