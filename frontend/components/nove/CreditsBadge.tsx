"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";

export function CreditsBadge() {
  const { t } = useI18n();
  const [balance, setBalance] = useState<number | null>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const r = await apiFetch<{ creditsBalance: number }>("auth/me", { method: "GET" });
        setAuthed(true);
        setBalance(r.data?.creditsBalance ?? 0);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          setAuthed(false);
          setBalance(null);
        }
      }
    })();
  }, []);

  if (!authed) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-500 transition hover:border-white/20 hover:text-slate-300"
      >
        {t("credits.badge")}
      </Link>
    );
  }

  return (
    <Link
      href="/credits"
      className="flex items-center gap-2 rounded-full border border-teal-400/25 bg-teal-400/5 px-3 py-1.5 text-xs font-medium text-teal-100 shadow-[0_0_20px_-6px_rgba(94,234,212,0.35)] transition hover:border-teal-400/40 hover:bg-teal-400/10"
    >
      <span className="text-slate-500">{t("credits.badge")}</span>
      <span className="tabular-nums text-white">{balance ?? "—"}</span>
    </Link>
  );
}
