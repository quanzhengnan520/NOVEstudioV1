"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";

const links = [
  { href: "/video", key: "nav.video" as const, Icon: IconVideo },
  { href: "/image", key: "nav.image" as const, Icon: IconImage },
  { href: "/chat", key: "nav.chat" as const, Icon: IconChat },
  { href: "/prompt", key: "nav.prompt" as const, Icon: IconPrompt },
  { href: "/history", key: "nav.history" as const, Icon: IconHistory },
  { href: "/credits", key: "nav.credits" as const, Icon: IconCredits },
  { href: "/feedback", key: "nav.feedback" as const, Icon: IconFeedback },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside className="group peer fixed left-2 top-[4.5rem] z-30 hidden h-[calc(100dvh-5.25rem)] w-[2.75rem] flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-black/35 py-2.5 shadow-[0_12px_48px_-28px_rgba(0,0,0,0.75)] backdrop-blur-xl transition-[width,box-shadow,border-color] duration-300 ease-out hover:w-[13.5rem] hover:border-white/[0.09] hover:shadow-[0_16px_56px_-24px_rgba(0,0,0,0.85)] md:left-2.5 md:top-[4.65rem] md:flex md:flex-col lg:w-[13.5rem] lg:border-white/[0.09]">
      <div className="flex h-full flex-col gap-0.5 px-1">
        <div className="mb-0.5 px-1 pb-1.5">
          <Link
            href="/"
            title={t("sidebar.home")}
            aria-label={t("sidebar.home")}
            className={`group/item relative flex h-9 items-center gap-2.5 overflow-hidden rounded-lg px-2 transition ${
              pathname === "/"
                ? "bg-white/[0.09] text-white shadow-inner-glow"
                : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
            }`}
          >
            <IconHome
              className={`h-4 w-4 shrink-0 ${pathname === "/" ? "text-teal-200/95" : "text-slate-500 group-hover/item:text-slate-300"}`}
            />
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-[11px] font-medium opacity-0 transition-all duration-300 group-hover:max-w-[11rem] group-hover:opacity-100 lg:max-w-[11rem] lg:opacity-100">
              {t("sidebar.home")}
            </span>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            const label = t(l.key);
            return (
              <Link
                key={l.href}
                href={l.href}
                title={label}
                className={`group/item relative flex h-9 items-center gap-2.5 overflow-hidden rounded-lg px-2 transition ${
                  active ? "bg-white/[0.09] text-white shadow-inner-glow" : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
                }`}
              >
                <l.Icon className={`h-4 w-4 shrink-0 ${active ? "text-teal-200/95" : "text-slate-500 group-hover/item:text-slate-300"}`} />
                <span className="max-w-0 overflow-hidden whitespace-nowrap text-[11px] font-medium opacity-0 transition-all duration-300 group-hover:max-w-[11rem] group-hover:opacity-100 lg:max-w-[11rem] lg:opacity-100">
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <div className="mb-1 max-w-0 overflow-hidden px-1.5 opacity-0 transition-all duration-300 group-hover:max-w-[11rem] group-hover:opacity-100 lg:max-w-[11rem] lg:opacity-100">
            <span className="inline-block rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] text-slate-600">Beta</span>
          </div>
          <p className="pointer-events-none max-w-0 overflow-hidden px-1.5 pb-0.5 text-[8px] leading-snug text-slate-600 opacity-0 transition-all duration-300 group-hover:max-w-[11rem] group-hover:opacity-100 lg:max-w-[11rem] lg:opacity-100">
            {t("sidebar.tagline")}
          </p>
        </div>
      </div>
    </aside>
  );
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10.5z" strokeLinejoin="round" />
    </svg>
  );
}

function IconVideo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 7.5A2.5 2.5 0 016.5 5h7A2.5 2.5 0 0116 7.5v9A2.5 2.5 0 0113.5 19h-7A2.5 2.5 0 014 16.5v-9z" strokeLinejoin="round" />
      <path d="M17.25 9.75L21 7.5v9l-3.75-2.25" strokeLinejoin="round" />
    </svg>
  );
}

function IconImage({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 15l2.5-3 2.5 3 3.5-4.5L18 15" strokeLinejoin="round" />
      <circle cx="9" cy="9" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconChat({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M6 6.5h12a2 2 0 012 2V15a2 2 0 01-2 2H10l-4 3v-3H6a2 2 0 01-2-2V8.5a2 2 0 012-2z" strokeLinejoin="round" />
    </svg>
  );
}

function IconPrompt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 3l1.2 4.2L17 8.5l-4.2 1.2L12 14l-1.2-4.3L6.5 8.5l4.3-1.3L12 3z" strokeLinejoin="round" />
      <path d="M19 15l.6 2.1 2.1.6-2.1.6L19 20.5l-.6-2.2-2.1-.6 2.1-.6L19 15z" strokeLinejoin="round" />
    </svg>
  );
}

function IconHistory({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 7v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="7" />
    </svg>
  );
}

function IconCredits({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 8.5v7M9.5 12h5" strokeLinecap="round" />
    </svg>
  );
}

function IconFeedback({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M6 8h12v8H10l-3 3v-3H6V8z" strokeLinejoin="round" />
    </svg>
  );
}
