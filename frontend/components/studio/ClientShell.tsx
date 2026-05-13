"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/nove/Toast";
import { GlobalTopBar } from "./GlobalTopBar";
import { Sidebar } from "./Sidebar";
import { StudioBackground } from "./StudioBackground";
import { useI18n } from "@/lib/i18n/context";

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="relative flex min-h-screen flex-col">
        <StudioBackground />
        <GlobalTopBar />
        <div className="relative z-10 flex min-h-0 flex-1">
          <Sidebar />
          <div className="min-h-0 flex-1 overflow-y-auto pb-24 md:pb-0 md:pl-[3.35rem] lg:pl-[15rem]">{children}</div>
        </div>
        <MobileDock />
      </div>
    </ToastProvider>
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-between gap-1 border-t border-white/[0.08] bg-black/80 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.6)] backdrop-blur-2xl md:hidden">
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
