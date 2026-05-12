"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlobalTopBar } from "./GlobalTopBar";
import { Sidebar } from "./Sidebar";
import { StudioBackground } from "./StudioBackground";
import { useI18n } from "@/lib/i18n/context";

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <StudioBackground />
      <GlobalTopBar />
      <div className="relative z-10 flex min-h-0 flex-1">
        <Sidebar />
        <div className="min-h-0 flex-1 overflow-y-auto pb-24 md:pb-0 md:pl-[3.35rem] lg:pl-[3.5rem]">{children}</div>
      </div>
      <MobileDock />
    </div>
  );
}

function MobileDock() {
  const { t } = useI18n();
  const pathname = usePathname();
  const items = [
    { href: "/video", key: "nav.video" as const },
    { href: "/image", key: "nav.image" as const },
    { href: "/chat", key: "nav.chat" as const },
    { href: "/prompt", key: "nav.prompt" as const },
    { href: "/history", key: "nav.history" as const },
    { href: "/credits", key: "nav.credits" as const },
  ];

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-40 flex justify-between gap-1 rounded-2xl border border-white/[0.1] bg-black/55 px-1.5 py-1.5 shadow-[0_12px_48px_-12px_rgba(0,0,0,0.85)] backdrop-blur-2xl md:hidden">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-1 py-1.5 text-[9px] font-medium transition ${
              active ? "bg-teal-500/15 text-teal-100" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <span className="truncate">{t(item.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
