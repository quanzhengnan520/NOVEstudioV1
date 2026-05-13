"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { NeonButton } from "@/components/nove/NeonButton";
import { TaskStatusPill } from "@/components/nove/TaskStatusPill";
import { usePollStudioTask } from "@/lib/studio";
import { useI18n } from "@/lib/i18n/context";

const types = ["chat", "prompt", "image", "video"] as const;

function isStudioType(s: string): s is (typeof types)[number] {
  return (types as readonly string[]).includes(s);
}

function resultUrls(result: Record<string, unknown> | null): string[] {
  if (!result) return [];
  const u = result.urls;
  if (Array.isArray(u)) return u.filter((x): x is string => typeof x === "string");
  return typeof result.url === "string" && result.url.length > 0 ? [result.url] : [];
}

function videoUrl(result: Record<string, unknown> | null): string | null {
  if (!result) return null;
  const u = result.url;
  return typeof u === "string" && u.length > 0 ? u : null;
}

function promptFromPayload(payload: Record<string, unknown> | null | undefined): string {
  if (!payload) return "";
  const p = payload as { prompt?: string; message?: string; messages?: { role: string; content: string }[] };
  if (Array.isArray(p.messages) && p.messages.length > 0) {
    const last = [...p.messages].reverse().find((m) => m.role === "user");
    if (last?.content) return String(last.content);
  }
  if (typeof p.prompt === "string") return p.prompt;
  if (typeof p.message === "string") return p.message;
  return "";
}

function chatReplyFromResult(result: Record<string, unknown> | null): string {
  if (!result) return "";
  const r = result as { reply?: string; text?: string };
  if (typeof r.reply === "string") return r.reply;
  if (typeof r.text === "string") return r.text;
  return "";
}

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-white/[0.05] ${className ?? ""}`}>
      <div className="h-full w-full rounded-2xl bg-gradient-to-r from-transparent via-white/[0.07] to-transparent animate-slow-shimmer" />
    </div>
  );
}

export default function TaskDetailPage() {
  const { t } = useI18n();
  const params = useParams<{ type: string; id: string }>();
  const routeType = typeof params.type === "string" ? params.type : params.type?.[0] ?? "";
  const taskId = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";
  const { task, error, refresh } = usePollStudioTask(taskId || null);
  const [copied, setCopied] = useState(false);

  const typeOk = isStudioType(routeType);
  const effectiveType = task && isStudioType(task.task_type) ? task.task_type : routeType;
  const isTerminal =
    task?.status === "completed" || task?.status === "succeeded" || task?.status === "failed";
  const isPending = !error && (!task || !isTerminal);
  const promptText = promptFromPayload(task?.payload);
  const typeMismatch = Boolean(task && typeOk && task.task_type !== routeType);

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const createAnotherHref = isStudioType(effectiveType) ? `/${effectiveType}` : "/video";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link href="/history" className="flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-teal-300">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t("history.r8Title")}
        </Link>
        <div className="flex items-center gap-2">
          {task ? <TaskStatusPill status={task.status} /> : null}
          {!isTerminal ? (
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:border-teal-400/25 hover:text-white"
            >
              {t("common.refresh")}
            </button>
          ) : null}
        </div>
      </div>

      {!typeOk ? (
        <p className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{t("task.invalidPath")}</p>
      ) : null}
      {typeOk && typeMismatch ? (
        <p className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{t("task.typeMismatch")}</p>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
      ) : null}

      {effectiveType === "image" ? (
        <div className="space-y-6">
          {isPending ? (
            <div className="space-y-3">
              <SkeletonPulse className="aspect-square w-full max-w-2xl" />
            </div>
          ) : null}
          {isTerminal && task?.status === "failed" && resultUrls(task?.result ?? null).length === 0 ? (
            <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {task.error_message ?? t("common.errorPrefix")}
            </div>
          ) : null}
          {resultUrls(task?.result ?? null).map((url) => (
            <div key={url} className="group relative overflow-hidden rounded-3xl border border-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full object-cover" />
              <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-5 opacity-0 transition duration-300 group-hover:opacity-100">
                <div className="flex gap-2">
                  <a
                    href={url}
                    download
                    className="rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur-md transition hover:bg-white/20"
                  >
                    ↓ {t("task.download")}
                  </a>
                  <button
                    type="button"
                    onClick={() => void copyText(url)}
                    className="rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur-md transition hover:bg-white/20"
                  >
                    {copied ? t("prompt.copied") : t("task.copyUrl")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {effectiveType === "video" ? (
        <div className="space-y-6">
          {isPending ? (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.02] py-24 text-center">
              <span className="relative flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-40" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-teal-400" />
              </span>
              <p className="text-sm text-slate-300">{t("task.videoProcessing")}</p>
              <p className="text-xs text-slate-600">{t("task.videoHint")}</p>
            </div>
          ) : null}
          {videoUrl(task?.result ?? null) ? (
            <div className="overflow-hidden rounded-3xl border border-white/[0.08]">
              <video src={videoUrl(task?.result ?? null) ?? undefined} controls className="w-full" autoPlay loop />
              <div className="flex gap-3 border-t border-white/[0.06] bg-black/30 px-5 py-4">
                <a
                  href={videoUrl(task?.result ?? null) ?? "#"}
                  download
                  className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-white transition hover:border-teal-400/35 hover:text-teal-200"
                >
                  ↓ {t("task.download")}
                </a>
                <button
                  type="button"
                  onClick={() => void copyText(videoUrl(task?.result ?? null) ?? "")}
                  className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-teal-400/35 hover:text-teal-200"
                >
                  {copied ? t("prompt.copied") : t("task.copyUrl")}
                </button>
              </div>
            </div>
          ) : null}
          {task?.error_message ? (
            <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{task.error_message}</div>
          ) : null}
        </div>
      ) : null}

      {effectiveType === "chat" ? (
        <div className="space-y-6">
          {isPending ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/[0.08] bg-white/[0.02] py-16 text-center">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-40" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-violet-400" />
              </span>
              <p className="text-sm text-slate-400">{t("task.chatProcessing")}</p>
            </div>
          ) : null}
          {task?.result ? (
            <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-violet-500/[0.07] via-nove-graphite/55 to-teal-500/[0.05] px-6 py-6 shadow-inner-glow">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300/75">{t("chat.assistant")}</p>
              <div className="nove-chat-assistant-body mt-4 border-l border-teal-400/15 pl-4 whitespace-pre-wrap text-slate-100">
                {chatReplyFromResult(task.result)}
              </div>
            </div>
          ) : null}
          {task?.error_message ? (
            <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{task.error_message}</div>
          ) : null}
        </div>
      ) : null}

      {effectiveType === "prompt" ? (
        <div className="space-y-6">
          {isPending ? (
            <div className="grid gap-4 md:grid-cols-2">
              <SkeletonPulse className="h-48" />
              <SkeletonPulse className="h-48" />
            </div>
          ) : null}
          {task?.result ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-600">{t("prompt.rawLabel")}</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-400">{promptText}</p>
              </div>
              <div className="rounded-3xl border border-teal-400/20 bg-teal-500/[0.04] p-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-teal-300/80">{t("prompt.resultLabel")}</p>
                  <button
                    type="button"
                    onClick={() => void copyText(String((task.result as { enhanced?: string }).enhanced ?? ""))}
                    className="rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-[10px] font-medium text-teal-100 transition hover:bg-teal-400/20"
                  >
                    {copied ? t("prompt.copied") : t("prompt.copy")}
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">
                  {String((task.result as { enhanced?: string }).enhanced ?? "")}
                </p>
              </div>
            </div>
          ) : null}
          {task?.error_message ? (
            <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{task.error_message}</div>
          ) : null}
        </div>
      ) : null}

      {promptText && effectiveType !== "prompt" ? (
        <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-600">{t("task.promptUsed")}</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-400">{promptText}</p>
        </div>
      ) : null}

      {task ? (
        <div className="mt-6 flex flex-wrap gap-4 border-t border-white/[0.05] pt-5 text-[11px] text-slate-600">
          <span className="font-mono">
            {task.id.slice(0, 8)}…{task.id.slice(-4)}
          </span>
          <span>
            {task.credits_amount} {t("history.creditsUnit")}
          </span>
          <span>{new Date(task.created_at).toLocaleString()}</span>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <NeonButton href={createAnotherHref} variant="secondary">
          {t("task.createAnother")}
        </NeonButton>
        <NeonButton href="/history" variant="ghost">
          {t("history.r8Title")}
        </NeonButton>
      </div>
    </div>
  );
}
