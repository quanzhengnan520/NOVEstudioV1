"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditsBadge } from "@/components/nove/CreditsBadge";
import { LanguageSwitcher } from "@/components/nove/LanguageSwitcher";
import { UserMenu } from "@/components/nove/UserMenu";
import { useI18n } from "@/lib/i18n/context";

const quick = [
  { href: "/video", key: "nav.video" },
  { href: "/image", key: "nav.image" },
  { href: "/chat", key: "nav.chat" },
  { href: "/prompt", key: "nav.prompt" },
  { href: "/history", key: "nav.history" },
] as const;

export function GlobalTopBar() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <div className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <header className="mx-auto flex max-w-workspace items-center justify-between gap-2 rounded-2xl border border-white/[0.07] bg-black/30 px-3 py-2 shadow-[0_8px_40px_-16px_rgba(0,0,0,0.75)] backdrop-blur-2xl sm:gap-3 sm:px-4 sm:py-2.5">
        <Link
          href="/"
          className="group/logo flex shrink-0 items-center gap-2 rounded-xl py-0.5 transition duration-300 ease-out hover:bg-white/[0.04]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-violet-500 text-xs font-bold text-nove-ink shadow-[0_0_20px_-6px_rgba(94,234,212,0.45)] transition duration-300 ease-out group-hover/logo:rotate-[2deg] group-hover/logo:shadow-[0_0_28px_-4px_rgba(94,234,212,0.55),0_0_32px_-6px_rgba(139,92,246,0.35)]">
            N
          </span>
          <span className="hidden text-sm font-semibold tracking-tight text-white sm:inline">
            NOVE <span className="text-slate-500">Studio</span>
          </span>
        </Link>
        <nav className="hidden min-w-0 flex-1 justify-center gap-0.5 lg:flex">
          {quick.map((q) => {
            const active = pathname === q.href || pathname.startsWith(`${q.href}/`);
            return (
              <Link
                key={q.href}
                href={q.href}
                className={`rounded-full px-3 py-1.5 text-[11px] font-medium tracking-wide transition sm:px-3.5 sm:text-xs ${
                  active
                    ? "bg-white/[0.1] text-white shadow-inner-glow"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
                }`}
              >
                {t(q.key)}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <LanguageSwitcher />
          <CreditsBadge />
          <UserMenu />
        </div>
      </header>
    </div>
  );
}
