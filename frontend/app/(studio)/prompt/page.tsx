"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { mapApiErrorMessage } from "@/lib/errors";
import { useI18n } from "@/lib/i18n/context";
import { NeonButton } from "@/components/nove/NeonButton";
import { AiChipRow } from "@/components/nove/workspace/AiChipRow";
import { AiPromptSurface } from "@/components/nove/workspace/AiPromptSurface";

type Me = { emailVerified: boolean };

type TagId = "cinematic" | "realistic" | "portrait" | "wide" | "motion" | "lighting";

export default function PromptPage() {
  const { t } = useI18n();
  const heroTitle = t("prompt.r8Title");
  const tagDefs = useMemo(
    () =>
      [
        { id: "cinematic" as const, label: t("prompt.tagCinematic") },
        { id: "realistic" as const, label: t("prompt.tagRealistic") },
        { id: "portrait" as const, label: t("prompt.tagPortrait") },
        { id: "wide" as const, label: t("prompt.tagWide") },
        { id: "motion" as const, label: t("prompt.tagMotion") },
        { id: "lighting" as const, label: t("prompt.tagLighting") },
      ] as const,
    [t],
  );
  const [prompt, setPrompt] = useState("");
  const [tag, setTag] = useState<TagId | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [enhanced, setEnhanced] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit() {
    const rawText = prompt.trim();
    const text = tag ? (rawText ? `${rawText}, ${tag}` : tag) : rawText;
    if (!text || busy) return;
    setBusy(true);
    setErr(null);
    setEnhanced(null);
    setTaskId(null);
    setCopied(false);
    try {
      const me = await apiFetch<Me>("auth/me", { method: "GET" });
      if (!me.data?.emailVerified) {
        setErr(t("prompt.verify"));
        setBusy(false);
        return;
      }
      const env = await apiFetch<{ taskId: string; enhanced: string }>("studio/prompt/complete", {
        method: "POST",
        body: JSON.stringify({ prompt: text, temperature: 0.4, max_tokens: 2048 }),
      });
      setEnhanced(env.data?.enhanced ?? null);
      setTaskId(env.data?.taskId ?? null);
      setPrompt("");
    } catch (e) {
      const raw = e instanceof ApiError ? String(e.body.error ?? e.message) : String(e);
      setErr(mapApiErrorMessage(raw));
    } finally {
      setBusy(false);
    }
  }

  async function copyEnhanced() {
    if (!enhanced) return;
    try {
      await navigator.clipboard.writeText(enhanced);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-workspace px-4 pb-6 pt-8 text-center sm:pt-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-violet-300/75">{t("prompt.eyebrow")}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          <span className="nove-text-gradient-neon">{heroTitle}</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">{t("prompt.r8Subtitle")}</p>
      </div>

      <div className="mx-auto grid w-full max-w-workspace flex-1 gap-8 px-4 pb-28 lg:grid-cols-2 lg:gap-10 lg:pb-12">
        <div className="space-y-6">
          {err ? (
            <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{err}</div>
          ) : null}
          <AiPromptSurface
            label={t("prompt.rawLabel")}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t("prompt.placeholder")}
            rows={8}
            className="min-h-[200px] max-h-[280px]"
          />
          <AiChipRow label={t("prompt.tagsTitle")} chips={[...tagDefs]} value={tag} onChange={(id) => setTag(id)} />
          <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
            <NeonButton type="button" size="xl" loading={busy} disabled={busy} onClick={() => void submit()} variant="primary">
              {busy ? t("prompt.processing") : t("prompt.enhance")}
            </NeonButton>
            {taskId ? (
              <NeonButton href={`/tasks/prompt/${taskId}`} variant="secondary">
                {t("chat.taskDetail")}
              </NeonButton>
            ) : null}
            <NeonButton href="/history" variant="ghost">
              {t("chat.history")}
            </NeonButton>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-4 text-left text-xs text-slate-500">
            <p className="font-semibold uppercase tracking-[0.25em] text-slate-600">{t("prompt.workflowTitle")}</p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-4 leading-relaxed">
              <li>{t("prompt.wf1")}</li>
              <li>{t("prompt.wf2")}</li>
              <li>{t("prompt.wf3")}</li>
            </ol>
            <Link href="/video" className="mt-3 inline-block text-teal-300/90 hover:text-teal-100">
              {t("prompt.openVideo")}
            </Link>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/[0.08] bg-black/25 p-6 shadow-inner-glow backdrop-blur-sm md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">{t("prompt.resultLabel")}</p>
            {enhanced ? (
              <button
                type="button"
                onClick={() => void copyEnhanced()}
                className="rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-medium text-teal-100 transition hover:bg-teal-400/20"
              >
                {copied ? t("prompt.copied") : t("prompt.copy")}
              </button>
            ) : null}
          </div>
          {enhanced ? (
            <p className="mt-6 whitespace-pre-wrap text-[15px] leading-[1.75] text-slate-100">{enhanced}</p>
          ) : (
            <p className="mt-10 text-center text-sm text-slate-500">{t("prompt.resultEmpty")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
