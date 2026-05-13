"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { mapApiErrorMessage } from "@/lib/errors";
import { useI18n } from "@/lib/i18n/context";
import { streamStudioChat } from "@/lib/studioStream";
import { NeonButton } from "@/components/nove/NeonButton";
import { AiPromptSurface } from "@/components/nove/workspace/AiPromptSurface";

type Me = { emailVerified: boolean };

export default function ChatPage() {
  const { t } = useI18n();
  const heroTitle = t("chat.r8Title");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [lastUser, setLastUser] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [reply, lastUser, busy]);

  async function submit() {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setErr(null);
    setReply("");
    setTaskId(null);
    setLastUser(text);
    try {
      const me = await apiFetch<Me>("auth/me", { method: "GET" });
      if (!me.data?.emailVerified) {
        setErr(t("chat.verify"));
        setBusy(false);
        return;
      }
      let acc = "";
      await streamStudioChat({ message: text, temperature: 0.7 }, (ev) => {
        if (ev.type === "task" && typeof ev.taskId === "string") setTaskId(ev.taskId);
        if (ev.type === "delta" && typeof ev.text === "string") {
          acc += ev.text;
          setReply(acc);
        }
        if (ev.type === "error" && typeof ev.message === "string") {
          setErr(mapApiErrorMessage(ev.message));
        }
      });
      setInput("");
    } catch (e) {
      const raw = e instanceof ApiError ? String(e.body.error ?? e.message) : String(e);
      setErr(mapApiErrorMessage(raw));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-4 pt-8 text-center sm:pt-10">
        <p className="nove-eyebrow">{t("chat.eyebrow")}</p>
        <h1 className="nove-section-title mt-3">
          <span className="nove-text-gradient-neon">{heroTitle}</span>
        </h1>
        <p className="nove-description mx-auto mt-3 max-w-lg text-sm sm:text-base">{t("chat.r8Subtitle")}</p>
        <p className="nove-description mx-auto mt-4 max-w-xl text-[11px] sm:text-xs">
          {t("chat.tip1")} · {t("chat.tip2")}
        </p>
      </div>

      <div ref={scrollRef} className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4">
        {!lastUser && !reply && !busy ? (
          <div className="rounded-[1.75rem] border border-dashed border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center shadow-inner-glow">
            <p className="text-base font-medium text-slate-200">{t("chat.emptyTitle")}</p>
            <p className="nove-description mx-auto mt-2 max-w-sm text-sm">{t("chat.emptySub")}</p>
          </div>
        ) : null}

        {lastUser ? (
          <div className="flex justify-end">
            <div className="max-w-[92%] rounded-3xl rounded-br-md bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-5 py-4 text-[15px] leading-relaxed text-slate-100 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.6)] backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-300/70">{t("chat.you")}</p>
              <p className="mt-2 whitespace-pre-wrap">{lastUser}</p>
            </div>
          </div>
        ) : null}

        {busy && !reply ? (
          <div className="flex justify-start">
            <div className="max-w-[92%] rounded-3xl rounded-bl-md border border-teal-400/15 bg-teal-500/[0.06] px-5 py-4 shadow-[0_0_40px_-20px_rgba(94,234,212,0.25)]">
              <div className="flex items-center gap-2 text-xs text-teal-100/90">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
                </span>
                {t("chat.generating")}
              </div>
              <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/5 animate-slow-shimmer rounded-full bg-gradient-to-r from-teal-500/0 via-teal-400/45 to-teal-500/0" />
              </div>
            </div>
          </div>
        ) : null}

        {reply ? (
          <div className="flex justify-start">
            <div className="max-w-[min(100%,48rem)] rounded-3xl rounded-bl-md border border-white/[0.06] bg-gradient-to-br from-violet-500/[0.07] via-nove-graphite/55 to-teal-500/[0.05] px-5 py-5 shadow-inner-glow">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300/75">{t("chat.assistant")}</p>
              <div className="nove-chat-assistant-body mt-3 border-l border-teal-400/15 pl-4">{reply}</div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 z-20 mt-auto border-t border-white/[0.08] bg-gradient-to-t from-nove-ink via-nove-ink/95 to-nove-ink/80 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_40px_-16px_rgba(0,0,0,0.65)] backdrop-blur-2xl md:rounded-t-3xl md:border md:border-b-0 md:border-white/[0.07]">
        <div className="mx-auto w-full max-w-3xl space-y-3">
          {err ? <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{err}</div> : null}
          <AiPromptSurface
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chat.placeholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
            rows={3}
            className="min-h-[100px] max-h-[160px] md:min-h-[120px]"
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <NeonButton type="button" loading={busy} disabled={busy} onClick={() => void submit()} variant="primary" size="xl">
              {busy ? t("chat.streaming") : t("chat.send")}
            </NeonButton>
            {taskId ? (
              <NeonButton href={`/tasks/chat/${taskId}`} variant="secondary">
                {t("chat.taskDetail")}
              </NeonButton>
            ) : null}
            <NeonButton href="/history" variant="ghost">
              {t("chat.history")}
            </NeonButton>
          </div>
          <p className="text-center text-[11px] text-zinc-500">
            {t("chat.modelName")} · {t("chat.modelHint")}
          </p>
        </div>
      </div>
    </div>
  );
}
