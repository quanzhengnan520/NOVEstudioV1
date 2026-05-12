"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { mapApiErrorMessage } from "@/lib/errors";
import { useI18n } from "@/lib/i18n/context";
import { createStudioTask, type StudioTaskView } from "@/lib/studio";
import { NeonButton } from "@/components/nove/NeonButton";
import { TaskStatusPill } from "@/components/nove/TaskStatusPill";
import { AiChipRow } from "@/components/nove/workspace/AiChipRow";
import { AiPromptSurface } from "@/components/nove/workspace/AiPromptSurface";

type Me = { emailVerified: boolean };

type ResChip = "720p" | "1080p" | "4K";
type DurChip = "4" | "5" | "8";
type MotionChip = "cinematic" | "anime" | "motion" | "realistic";
type RefMode = "none" | "url";

function videoUrlFromTask(task: StudioTaskView): string | null {
  const r = task.result;
  if (!r) return null;
  const u = r.url;
  return typeof u === "string" && u.length > 0 ? u : null;
}

function motionToTier(m: MotionChip): number {
  if (m === "motion") return 3;
  if (m === "realistic") return 3;
  return 2;
}

function motionAppendKey(m: MotionChip): string {
  switch (m) {
    case "cinematic":
      return "video.motionAppendCinematic";
    case "anime":
      return "video.motionAppendAnime";
    case "motion":
      return "video.motionAppendMotion";
    default:
      return "video.motionAppendRealistic";
  }
}

export default function VideoPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [prompt, setPrompt] = useState("");
  const [resChip, setResChip] = useState<ResChip>("1080p");
  const [durChip, setDurChip] = useState<DurChip>("5");
  const [motionChip, setMotionChip] = useState<MotionChip>("cinematic");
  const [refMode, setRefMode] = useState<RefMode>("none");
  const [imageRef, setImageRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [recent, setRecent] = useState<StudioTaskView[]>([]);

  const tier = useMemo(() => motionToTier(motionChip), [motionChip]);

  async function loadRecent() {
    try {
      const env = await apiFetch<{ items: StudioTaskView[] }>("studio/tasks?limit=12", { method: "GET" });
      const items = env.data?.items ?? [];
      setRecent(items.filter((x) => x.task_type === "video"));
    } catch {
      setRecent([]);
    }
  }

  useEffect(() => {
    void loadRecent();
  }, []);

  async function submit() {
    const base = prompt.trim() || t("video.submitFallbackPrompt");
    const text = `${base}${t(motionAppendKey(motionChip))}`;
    setBusy(true);
    setErr(null);
    try {
      const me = await apiFetch<Me>("auth/me", { method: "GET" });
      if (!me.data?.emailVerified) {
        setErr(t("video.verify"));
        setBusy(false);
        return;
      }
      const payload: Record<string, unknown> = {
        prompt: text,
        tier,
        vendor: "stub",
        resolution: resChip === "4K" ? "4K" : resChip,
        duration: Number(durChip),
      };
      const ir = refMode === "url" ? imageRef.trim() : "";
      if (ir) payload.image_url = ir;
      const task = await createStudioTask("video", payload);
      setPrompt("");
      router.push(`/tasks/video/${task.id}`);
    } catch (e) {
      const raw = e instanceof ApiError ? String(e.body.error ?? e.message) : String(e);
      setErr(mapApiErrorMessage(raw));
    } finally {
      setBusy(false);
      void loadRecent();
    }
  }

  return (
    <div className="group/promptPage relative flex min-h-0 flex-1 flex-col overflow-x-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[min(55vh,520px)] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(94,234,212,0.14),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[min(40vh,380px)] bg-[radial-gradient(ellipse_70%_50%_at_50%_100%,rgba(139,92,246,0.1),transparent_55%)]" />

      <div className="relative z-10 mx-auto w-full max-w-workspace flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:py-14">
        <header className="text-center transition duration-500 ease-out group-focus-within/promptPage:opacity-[0.32] group-focus-within/promptPage:blur-[0.5px]">
          <p className="nove-eyebrow">{t("nav.video")}</p>
          <h1 className="nove-section-title mx-auto mt-4 max-w-4xl">
            <span className="nove-text-gradient-neon">{t("video.r8Title")}</span>
          </h1>
          <p className="nove-description mx-auto mt-4 max-w-2xl text-sm sm:text-base">{t("video.r8Subtitle")}</p>
        </header>

        <div className="mx-auto mt-8 w-full max-w-promptStage space-y-5 sm:mt-12">
          {err ? (
            <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-100">{err}</div>
          ) : null}

          <div className="relative z-20 transition duration-500 ease-out group-focus-within/promptPage:scale-[1.01]">
            <AiPromptSurface
              variant="stage"
              label={t("video.prompt")}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("video.r8PromptPlaceholder")}
            />
          </div>

          <div className="space-y-3 transition duration-500 ease-out group-focus-within/promptPage:opacity-[0.28] group-focus-within/promptPage:blur-[0.5px]">
            <AiChipRow
              center
              compact
              label={t("video.controlsResolution")}
              chips={[
                { id: "720p", label: "720p" },
                { id: "1080p", label: "1080p" },
                { id: "4K", label: "4K" },
              ]}
              value={resChip}
              onChange={(id) => setResChip(id as ResChip)}
            />
            <AiChipRow
              center
              compact
              label={t("video.controlsDuration")}
              chips={[
                { id: "4", label: "4s" },
                { id: "5", label: "5s" },
                { id: "8", label: "8s" },
              ]}
              value={durChip}
              onChange={(id) => setDurChip(id as DurChip)}
            />
            <AiChipRow
              center
              compact
              label={t("video.controlsMotion")}
              chips={[
                { id: "cinematic", label: t("video.motionCinematic") },
                { id: "anime", label: t("video.motionAnime") },
                { id: "motion", label: t("video.motionDynamic") },
                { id: "realistic", label: t("video.motionRealistic") },
              ]}
              value={motionChip}
              onChange={(id) => setMotionChip(id as MotionChip)}
            />
            <AiChipRow
              center
              compact
              label={t("video.controlsRefHint")}
              chips={[
                { id: "none", label: t("video.refNone") },
                { id: "url", label: t("video.refUrl") },
              ]}
              value={refMode}
              onChange={(id) => {
                const m = id as RefMode;
                setRefMode(m);
                if (m === "none") setImageRef("");
              }}
            />
          </div>

          {refMode === "url" ? (
            <div className="mx-auto max-w-xl space-y-2 transition duration-500 ease-out group-focus-within/promptPage:opacity-[0.28] group-focus-within/promptPage:blur-[0.5px]">
              <p className="text-center text-xs leading-relaxed text-slate-500">{t("video.refUrlHelper")}</p>
              <input
                value={imageRef}
                onChange={(e) => setImageRef(e.target.value)}
                placeholder={t("video.controlsRefPlaceholder")}
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-slate-600 focus:border-teal-400/30 focus:outline-none focus:ring-1 focus:ring-teal-400/25"
              />
            </div>
          ) : null}

          <div className="flex flex-col items-center gap-4 pt-3 transition duration-500 ease-out group-focus-within/promptPage:opacity-[0.28] group-focus-within/promptPage:blur-[0.5px]">
            <div className="relative inline-flex">
              {busy ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-4 rounded-full bg-gradient-to-r from-teal-400/12 via-violet-500/18 to-teal-400/12 opacity-90 blur-2xl animate-nove-breathe"
                />
              ) : null}
              <NeonButton
                type="button"
                size="xl"
                loading={busy}
                disabled={busy}
                onClick={() => void submit()}
                variant="primary"
                className="relative min-w-[min(100%,20rem)] px-16 shadow-[0_0_56px_-10px_rgba(94,234,212,0.5)]"
              >
                {busy ? t("video.queuing") : t("video.generate")}
              </NeonButton>
            </div>
            <Link href="/history" className="text-xs text-slate-500 transition hover:text-teal-200/90">
              {t("video.openHistory")}
            </Link>
          </div>
        </div>

        <section
          className={`mx-auto mt-20 w-full max-w-workspace border-t border-white/[0.06] pt-12 transition duration-500 sm:mt-24 sm:pt-16 group-focus-within/promptPage:opacity-[0.32] group-focus-within/promptPage:blur-[0.5px] ${busy ? "shadow-[0_0_60px_-28px_rgba(94,234,212,0.14)]" : ""}`}
        >
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-semibold text-white sm:text-xl">{t("video.recentStage")}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("video.stageSub")}</p>
            </div>
            <button
              type="button"
              onClick={() => void loadRecent()}
              className="text-xs font-medium text-teal-300/90 transition hover:text-teal-100"
            >
              {t("common.refresh")}
            </button>
          </div>

          {recent.length === 0 && !busy ? (
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.1] bg-gradient-to-b from-white/[0.06] to-black/55 px-6 py-16 text-center shadow-[0_0_80px_-36px_rgba(94,234,212,0.28)] sm:px-10 sm:py-20">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(94,234,212,0.14),transparent_55%)]" />
              <div className="pointer-events-none absolute inset-0 animate-gradient-flow bg-gradient-to-r from-teal-500/10 via-violet-500/10 to-teal-400/10 bg-[length:200%_200%] opacity-40" />
              <div className="pointer-events-none absolute -bottom-24 left-1/2 h-48 w-[min(92%,480px)] -translate-x-1/2 rounded-full bg-violet-500/15 blur-3xl" />
              <div className="relative mx-auto max-w-lg">
                <div className="mx-auto mb-8 aspect-video max-w-md overflow-hidden rounded-2xl border border-dashed border-teal-400/25 bg-black/40 shadow-[inset_0_0_0_1px_rgba(94,234,212,0.08)]">
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
                    <span className="text-2xl opacity-80" aria-hidden>
                      ✦
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-teal-200/90">
                      {t("video.emptyStageBadge")}
                    </span>
                  </div>
                </div>
                <p className="text-lg font-medium text-slate-100 sm:text-xl">{t("video.emptyTitle")}</p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">{t("video.emptySub")}</p>
                <p className="mx-auto mt-5 max-w-md text-sm font-medium text-teal-200/85">{t("video.emptyCta")}</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
              {busy ? (
                <div className="contents">
                  {[0, 1].map((i) => (
                    <div
                      key={`sk-${i}`}
                      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] shadow-inner-glow"
                    >
                      <div className="relative aspect-video bg-gradient-to-br from-white/[0.06] via-transparent to-violet-500/10">
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent animate-slow-shimmer" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {recent.map((x) => {
                const url = videoUrlFromTask(x);
                const title = String((x.payload as { prompt?: string }).prompt ?? t("nav.video"));
                return (
                  <Link
                    key={x.id}
                    href={`/tasks/video/${x.id}`}
                    className="group/card relative overflow-hidden rounded-2xl border border-white/[0.07] bg-nove-graphite/30 shadow-inner-glow transition duration-300 ease-out hover:-translate-y-[2px] hover:border-teal-400/28 hover:shadow-[0_0_52px_-14px_rgba(94,234,212,0.28)]"
                  >
                    <div className="relative aspect-video bg-gradient-to-br from-black via-nove-graphite to-violet-950/60">
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <video
                          src={url}
                          className="pointer-events-none h-full w-full object-cover transition duration-500 ease-out group-hover/card:scale-[1.05]"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <div className="flex h-full items-end p-6 opacity-90 transition duration-300 group-hover/card:opacity-100">
                          <p className="line-clamp-2 text-sm leading-relaxed text-slate-400">{title}</p>
                        </div>
                      )}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-95 transition duration-300 group-hover/card:from-black/95" />
                      <div className="absolute left-3 top-3 flex flex-wrap gap-2 opacity-90 transition duration-300 group-hover/card:opacity-100">
                        <TaskStatusPill status={x.status} />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 ease-out group-hover/card:opacity-100">
                        <span className="rounded-full border border-white/15 bg-black/50 px-4 py-2 text-xs font-medium text-white shadow-[0_0_32px_-8px_rgba(94,234,212,0.4)] backdrop-blur-md">
                          {t("video.openClip")}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-5 opacity-0 transition duration-300 ease-out group-hover/card:translate-y-0 group-hover/card:opacity-100">
                        <p className="line-clamp-2 text-sm font-medium leading-snug text-white">{title}</p>
                        <p className="mt-1 text-[10px] font-medium tabular-nums text-zinc-500">
                          {x.credits_amount} {t("history.creditsUnit")}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
