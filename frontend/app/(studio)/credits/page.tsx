"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { mapApiErrorMessage } from "@/lib/errors";
import { resolveStudioWebSocketUrl } from "@/lib/studioWsUrl";
import { useI18n } from "@/lib/i18n/context";
import { GlassCard } from "@/components/nove/GlassCard";
import { GradientBorderCard } from "@/components/nove/GradientBorderCard";
import { NeonButton } from "@/components/nove/NeonButton";

type Me = { id: string; email: string; isAdmin: boolean; creditsBalance: number; emailVerified: boolean };
type LogRow = {
  id: string;
  delta: number;
  balance_after: number;
  reason: string;
  order_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
};

export default function CreditsPage() {
  const { t } = useI18n();
  const heroTitle = t("credits.r8Title");
  const tRef = useRef(t);
  tRef.current = t;

  const [me, setMe] = useState<Me | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [mockMsg, setMockMsg] = useState<string | null>(null);
  const [wsHint, setWsHint] = useState<string | null>(null);

  const showMockRecharge =
    process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_MOCK_RECHARGE === "1";

  async function load() {
    setError(null);
    try {
      const m = await apiFetch<Me>("auth/me", { method: "GET" });
      setMe(m.data);
      const l = await apiFetch<{ items: LogRow[] }>("credits/logs?limit=50", { method: "GET" });
      setLogs(l.data?.items ?? []);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError(tRef.current("credits.signIn"));
        setMe(null);
        setLogs([]);
        return;
      }
      setError(e instanceof Error ? mapApiErrorMessage((e as ApiError).body?.error ?? e.message) : tRef.current("credits.loadFail"));
    }
  }

  async function mockRecharge() {
    setMockMsg(null);
    setError(null);
    try {
      const res = await apiFetch<{ newBalance: number; paymentId?: string }>("credits/recharge-mock", {
        method: "POST",
        body: JSON.stringify({ amount: 100 }),
      });
      const nb = res.data?.newBalance;
      if (typeof nb === "number") {
        setMe((prev) => (prev ? { ...prev, creditsBalance: nb } : prev));
      }
      setMockMsg(tRef.current("credits.mockOk"));
      await load();
    } catch (e) {
      const raw = e instanceof ApiError ? String(e.body.error ?? e.message) : String(e);
      setError(mapApiErrorMessage(raw));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!me?.id) return;
    const wsUrl = resolveStudioWebSocketUrl();
    if (!wsUrl) {
      setWsHint(tRef.current("credits.wsUnavailable"));
      return;
    }
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      setWsHint(tRef.current("credits.wsUnavailable"));
      return;
    }
    let opened = false;
    ws.onopen = () => {
      opened = true;
      setWsHint(tRef.current("credits.wsConnected"));
    };
    ws.onclose = () => {
      if (opened) setWsHint(tRef.current("credits.wsDisconnected"));
    };
    ws.onmessage = (ev) => {
      try {
        const d = JSON.parse(String(ev.data)) as { event?: string };
        if (d.event === "studio_task") void load();
      } catch {
        /* ignore */
      }
    };
    return () => {
      ws?.close();
    };
  }, [me?.id]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setMe(null);
    setLogs([]);
  }

  async function resend() {
    setResendMsg(null);
    try {
      await apiFetch("auth/resend-verification", { method: "POST" });
      setResendMsg(tRef.current("credits.resendOk"));
    } catch (e) {
      const raw = e instanceof ApiError ? String(e.body.error ?? e.message) : String(e);
      setResendMsg(mapApiErrorMessage(raw));
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-workspace px-4 pb-6 pt-8 text-center sm:pt-10">
        <p className="nove-eyebrow opacity-80">{t("credits.eyebrow")}</p>
        <h1 className="nove-section-title mt-3">
          <span className="nove-text-gradient-neon">{heroTitle}</span>
        </h1>
        <p className="nove-description mx-auto mt-3 max-w-xl text-sm sm:text-base">{t("credits.r8Subtitle")}</p>
        <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-2">
          <NeonButton type="button" onClick={() => void load()} variant="secondary" className="!px-4 !py-2 !text-xs">
            {t("common.refresh")}
          </NeonButton>
          {me?.isAdmin ? (
            <NeonButton href="/admin" variant="ghost" className="!text-xs">
              {t("credits.admin")}
            </NeonButton>
          ) : null}
          <NeonButton href="/" variant="ghost" className="!text-xs">
            {t("credits.home")}
          </NeonButton>
          {me ? (
            <NeonButton type="button" onClick={() => void logout()} variant="ghost" className="!text-xs">
              {t("credits.logout")}
            </NeonButton>
          ) : null}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-workspace flex-1 flex-col gap-8 px-4 pb-28 pt-2 md:flex-row md:pb-12 lg:gap-10">
        <div className="w-full shrink-0 space-y-6 lg:max-w-md">
          {error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
          ) : null}

          {me && !me.emailVerified ? (
            <GlassCard className="border border-amber-500/25 bg-amber-500/[0.07] p-5" hover={false}>
              <p className="text-sm font-medium text-amber-100">{t("credits.verifyTitle")}</p>
              <p className="mt-2 text-xs leading-relaxed text-amber-100/85">{t("credits.verifyBody")}</p>
              <button
                type="button"
                onClick={() => void resend()}
                className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-50 hover:bg-amber-400/20"
              >
                {t("credits.resend")}
              </button>
              {resendMsg ? <p className="mt-3 text-xs text-amber-50/90">{resendMsg}</p> : null}
            </GlassCard>
          ) : null}

          {me ? (
            <GradientBorderCard>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">{t("credits.signedIn")}</p>
                <p className="text-sm text-white">{me.email}</p>
                <p className="text-xs text-slate-500">
                  {t("credits.status")}: {me.emailVerified ? t("credits.verified") : t("credits.pending")}
                </p>
                <div className="pt-6">
                  <p className="nove-eyebrow opacity-70">{t("credits.r8BalanceEyebrow")}</p>
                  <p className="nove-text-gradient-neon mt-3 text-7xl font-semibold tabular-nums tracking-tight sm:text-8xl">
                    {me.creditsBalance}
                  </p>
                  <p className="nove-description mt-3 text-xs">{t("credits.balanceHint")}</p>
                </div>
                {showMockRecharge ? (
                  <div className="mt-6 rounded-xl border border-dashed border-teal-400/25 bg-teal-950/20 px-4 py-4">
                    <p className="text-xs text-slate-300">{t("credits.mockTitle")}</p>
                    <NeonButton type="button" onClick={() => void mockRecharge()} variant="primary" className="mt-3 !py-2 !text-xs">
                      {t("credits.mockBtn")}
                    </NeonButton>
                    {mockMsg ? <p className="mt-2 text-xs text-emerald-300">{mockMsg}</p> : null}
                  </div>
                ) : null}
                {wsHint ? (
                  <p className="mt-4 text-[11px] text-slate-600">
                    {t("credits.livePrefix")} {wsHint}
                  </p>
                ) : null}
              </div>
            </GradientBorderCard>
          ) : null}

          <GlassCard className="p-5" hover={false}>
            <p className="text-sm font-medium text-white">{t("credits.moreTitle")}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{t("credits.moreBody")}</p>
            <NeonButton href="/video" variant="secondary" className="mt-4 !w-full !py-2 !text-xs">
              {t("credits.backCreate")}
            </NeonButton>
          </GlassCard>
        </div>

        <div className="min-w-0 flex-1">
          <GlassCard className="overflow-hidden p-0" hover={false}>
            <div className="border-b border-white/[0.07] px-5 py-4">
              <h2 className="text-sm font-semibold text-white">{t("credits.activity")}</h2>
              <p className="nove-description mt-1 text-xs">{t("credits.activitySub")}</p>
            </div>
            <div className="relative px-4 py-6 sm:px-6">
              <div
                aria-hidden
                className="absolute bottom-6 left-[1.15rem] top-6 w-px bg-gradient-to-b from-transparent via-white/12 to-transparent sm:left-7"
              />
              {logs.map((row) => (
                <div key={row.id} className="relative flex gap-4 pb-8 last:pb-2">
                  <span className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border border-teal-400/35 bg-teal-400/15 shadow-[0_0_14px_-3px_rgba(94,234,212,0.45)]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-100">{row.reason}</p>
                    <p className="mt-1 font-mono text-[10px] text-zinc-600">{new Date(row.created_at).toLocaleString()}</p>
                    {row.order_id ? (
                      <p className="mt-1 font-mono text-[10px] text-zinc-600">
                        {t("credits.order")} {row.order_id.slice(0, 8)}…
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-base font-semibold tabular-nums ${row.delta >= 0 ? "text-teal-300" : "text-rose-300"}`}>
                      {row.delta > 0 ? "+" : ""}
                      {row.delta}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {t("credits.balanceShort")} {row.balance_after}
                    </p>
                  </div>
                </div>
              ))}
              {logs.length === 0 ? (
                <div className="py-12 text-center text-sm text-zinc-500">{t("credits.logEmpty")}</div>
              ) : null}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
