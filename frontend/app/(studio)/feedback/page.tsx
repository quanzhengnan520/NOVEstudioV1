"use client";

import { useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { mapApiErrorMessage } from "@/lib/errors";

export default function FeedbackPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    const text = message.trim();
    if (!text || busy) return;
    setBusy(true);
    setErr(null);
    setDone(null);
    try {
      const env = await apiFetch<{ id: string }>("feedback", {
        method: "POST",
        body: JSON.stringify({ message: text, context: { source: "nove-studio-web" } }),
      });
      setDone(`已提交，编号 ${env.data?.id ?? ""}`.trim());
      setMessage("");
    } catch (e) {
      const raw = e instanceof ApiError ? String(e.body.error ?? e.message) : String(e);
      setErr(mapApiErrorMessage(raw));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8 md:px-8">
      <p className="text-xs uppercase tracking-[0.35em] text-nove-mist">Feedback</p>
      <h1 className="mt-2 text-2xl font-semibold text-white">反馈</h1>
      <p className="mt-2 text-sm text-slate-400">登录后提交产品建议或问题描述。</p>
      {err ? <p className="mt-4 text-sm text-red-300">{err}</p> : null}
      {done ? <p className="mt-4 text-sm text-nove-accent">{done}</p> : null}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={6}
        className="mt-6 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white"
        placeholder="告诉我们你的想法…"
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className="mt-4 rounded-full bg-nove-accent px-6 py-2 text-sm font-semibold text-nove-ink disabled:opacity-50"
      >
        {busy ? "发送中…" : "提交"}
      </button>
    </main>
  );
}
