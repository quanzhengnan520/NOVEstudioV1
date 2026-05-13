"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";

export function CreditsBadge() {
  const { t } = useI18n();
  const [balance, setBalance] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    void (async () => {
      try {
        const r = await apiFetch<{ creditsBalance: number }>("auth/me", { method: "GET" });
        const b = r.data?.creditsBalance;
        setBalance(typeof b === "number" ? b : null);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) setBalance(null);
        else setBalance(null);
      }
    })();
  }, []);

  if (balance === undefined || balance === null) return null;

  return (
    <Link
      href="/credits"
      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-teal-400/30 hover:text-white"
    >
      <span className="text-slate-400">{t("credits.badge")}</span>
      <span className="tabular-nums text-teal-200/90">{balance}</span>
    </Link>
  );
}
