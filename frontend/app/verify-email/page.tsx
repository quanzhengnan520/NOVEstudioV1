"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { mapApiErrorMessage } from "@/lib/errors";

function VerifyInner() {
  const sp = useSearchParams();
  const token = sp.get("token");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("err");
      setMessage("缺少验证参数，请从邮件中的完整链接打开。");
      return;
    }
    let cancelled = false;
    void (async () => {
      setStatus("loading");
      try {
        await apiFetch("auth/verify-email", {
          method: "POST",
          body: JSON.stringify({ token }),
        });
        await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
        if (!cancelled) {
          setStatus("ok");
          setMessage("邮箱验证成功，已刷新登录状态。");
        }
      } catch (e) {
        const raw = e instanceof ApiError ? String(e.body.error ?? e.message) : String(e);
        if (!cancelled) {
          setStatus("err");
          setMessage(mapApiErrorMessage(raw));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-white/10 bg-nove-surface/60 p-8 text-center shadow-2xl shadow-black/40 backdrop-blur">
        <h1 className="text-2xl font-semibold text-white">邮箱验证</h1>
        <p className="mt-4 text-sm text-slate-300">
          {status === "loading" ? "正在验证…" : null}
          {status !== "loading" ? message : null}
        </p>
        {status === "ok" ? (
          <Link
            href="/credits"
            className="mt-8 inline-block rounded-lg bg-nove-accent px-6 py-2.5 text-sm font-semibold text-nove-ink hover:brightness-110"
          >
            进入积分中心
          </Link>
        ) : null}
        {status === "err" ? (
          <div className="mt-8 space-y-3">
            <Link href="/login" className="block text-sm text-nove-accent hover:underline">
              去登录
            </Link>
            <Link href="/credits" className="block text-sm text-slate-400 hover:underline">
              积分中心（可尝试重新发送验证邮件）
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
          <p className="text-slate-400">加载中…</p>
        </main>
      }
    >
      <VerifyInner />
    </Suspense>
  );
}
