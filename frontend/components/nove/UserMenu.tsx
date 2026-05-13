"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";

type Me = { email: string; isAdmin: boolean };

export function UserMenu() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const r = await apiFetch<Me>("auth/me", { method: "GET" });
        setMe(r.data ?? null);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) setMe(null);
      }
    })();
  }, []);

  if (!me) {
    return (
      <Link
        href="/login"
        className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:text-white"
      >
        {t("user.login")}
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex max-w-[10rem] items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-left text-xs text-slate-200 transition hover:border-teal-400/25 hover:bg-white/[0.07]"
      >
        <span className="truncate">{me.email}</span>
        <span className="text-slate-500">▾</span>
      </button>
      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default bg-transparent" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 min-w-[11rem] rounded-xl border border-white/10 bg-nove-graphite/95 py-1 shadow-xl backdrop-blur-xl">
            <Link href="/credits" className="block px-4 py-2 text-sm text-slate-200 hover:bg-white/5" onClick={() => setOpen(false)}>
              {t("user.menuCredits")}
            </Link>
            <Link href="/history" className="block px-4 py-2 text-sm text-slate-200 hover:bg-white/5" onClick={() => setOpen(false)}>
              {t("user.menuHistory")}
            </Link>
            {me.isAdmin ? (
              <Link href="/admin" className="block px-4 py-2 text-sm text-teal-200 hover:bg-white/5" onClick={() => setOpen(false)}>
                {t("user.menuAdmin")}
              </Link>
            ) : null}
            <button
              type="button"
              className="w-full px-4 py-2 text-left text-sm text-slate-400 hover:bg-white/5"
              onClick={() => {
                setOpen(false);
                void fetch("/api/auth/logout", { method: "POST", credentials: "include" }).then(() => {
                  window.location.href = "/";
                });
              }}
            >
              {t("user.logout")}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
