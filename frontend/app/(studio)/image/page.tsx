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

type StyleId = "cinematic" | "portrait" | "product" | "neon";
type LightId = "soft" | "dramatic" | "studio" | "golden";
type CompId = "wide" | "close" | "symmetry" | "rule3";

function urlsFromResult(result: Record<string, unknown> | null): string[] {
  if (!result) return [];
  const u = result.urls;
  if (Array.isArray(u)) return u.filter((x): x is string => typeof x === "string");
  return typeof result.url === "string" ? [result.url] : [];
}

function buildSuffix(t: (key: string) => string, style: StyleId, light: LightId, comp: CompId): string {
  const sk: Record<StyleId, string> = {
    cinematic: "image.sfxStyleCinematic",
    portrait: "image.sfxStylePortrait",
    product: "image.sfxStyleProduct",
    neon: "image.sfxStyleNeon",
  };
  const lk: Record<LightId, string> = {
    soft: "image.sfxLightSoft",
    dramatic: "image.sfxLightDramatic",
    studio: "image.sfxLightStudio",
    golden: "image.sfxLightGolden",
  };
  const ck: Record<CompId, string> = {
    wide: "image.sfxCompWide",
    close: "image.sfxCompClose",
    symmetry: "image.sfxCompSymmetry",
    rule3: "image.sfxCompRule3",
  };
  return `, ${t(sk[style])}, ${t(lk[light])}, ${t(ck[comp])}`;
}

export default function ImagePage() {
  const { t } = useI18n();
  const router = useRouter();
  const heroTitle = t("image.r8Title");

  const styleChips = useMemo(
    () =>
      [
        { id: "cinematic" as const, label: t("image.chipStyleCinematic") },
        { id: "portrait" as const, label: t("image.chipStylePortrait") },
        { id: "product" as const, label: t("image.chipStyleProduct") },
        { id: "neon" as const, label: t("image.chipStyleNeon") },
      ] as const,
    [t],
  );
  const lightChips = useMemo(
    () =>
      [
        { id: "soft" as const, label: t("image.chipLightSoft") },
        { id: "dramatic" as const, label: t("image.chipLightDramatic") },
        { id: "studio" as const, label: t("image.chipLightStudio") },
        { id: "golden" as const, label: t("image.chipLightGolden") },
      ] as const,
    [t],
  );
  const compChips = useMemo(
    () =>
      [
        { id: "wide" as const, label: t("image.chipCompWide") },
        { id: "close" as const, label: t("image.chipCompClose") },
        { id: "symmetry" as const, label: t("image.chipCompSymmetry") },
        { id: "rule3" as const, label: t("image.chipCompRule3") },
      ] as const,
    [t],
  );

  const [prompt, setPrompt] = useState("");
  const [styleId, setStyleId] = useState<StyleId>("cinematic");
  const [lightId, setLightId] = useState<LightId>("soft");
  const [compId, setCompId] = useState<CompId>("wide");
  const [engine, setEngine] = useState<"dashscope" | "openai-compat" | "replicate">("dashscope");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [recent, setRecent] = useState<StudioTaskView[]>([]);

  async function loadRecent() {
    try {
      const env = await apiFetch<{ items: StudioTaskView[] }>("studio/tasks?limit=18", { method: "GET" });
      const items = env.data?.items ?? [];
      setRecent(items.filter((x) => x.task_type === "image"));
    } catch {
      setRecent([]);
    }
  }

  useEffect(() => {
    void loadRecent();
  }, []);

  async function submit() {
    const base = prompt.trim() || t("image.submitFallbackPrompt");
    const text = `${base}${buildSuffix(t, styleId, lightId, compId)}`;
    setBusy(true);
    setErr(null);
    try {
      const me = await apiFetch<Me>("auth/me", { method: "GET" });
      if (!me.data?.emailVerified) {
        setErr(t("image.verify"));
        setBusy(false);
        return;
      }
      const task = await createStudioTask("image", { prompt: text, engine });
      setPrompt("");
      router.push(`/tasks/image/${task.id}`);
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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[min(50vh,480px)] bg-[radial-gradient(ellipse_80%_55%_at_50%_-8%,rgba(139,92,246,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[min(36vh,340px)] bg-[radial-gradient(ellipse_70%_50%_at_50%_100%,rgba(94,234,212,0.08),transparent_55%)]" />

      <div className="relative z-10 mx-auto w-full max-w-workspace flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:py-14">
        <header className="text-center transition duration-500 ease-out group-focus-within/promptPage:opacity-40 group-focus-within/promptPage:blur-[0.5px]">
          <p className="nove-eyebrow">{t("nav.image")}</p>
          <h1 className="nove-section-title mx-auto mt-4 max-w-4xl">
            <span className="nove-text-gradient-neon">{heroTitle}</span>
          </h1>
          <p className="nove-description mx-auto mt-4 max-w-2xl text-sm sm:text-base">{t("image.r8Subtitle")}</p>
        </header>

        <div className="mx-auto mt-10 w-full max-w-promptStage space-y-5 sm:mt-14">
          {err ? (
            <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-100">{err}</div>
          ) : null}

          <div className="relative z-20 transition duration-500 ease-out group-focus-within/promptPage:scale-[1.01]">
            <AiPromptSurface
              variant="stage"
              label={t("image.promptLabel")}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("image.r8PromptPlaceholder")}
            />
          </div>

          <div className="space-y-3 transition duration-500 ease-out group-focus-within/promptPage:opacity-35 group-focus-within/promptPage:blur-[0.5px]">
            <AiChipRow
              center
              compact
              label={t("image.controlsStyle")}
              chips={[...styleChips]}
              value={styleId}
              onChange={(id) => setStyleId(id)}
            />
            <AiChipRow
              center
              compact
              label={t("image.controlsLight")}
              chips={[...lightChips]}
              value={lightId}
              onChange={(id) => setLightId(id)}
            />
            <AiChipRow
              center
              compact
              label={t("image.controlsComp")}
              chips={[...compChips]}
              value={compId}
              onChange={(id) => setCompId(id)}
            />
          </div>

          <div className="mx-auto max-w-md transition duration-500 ease-out group-focus-within/promptPage:opacity-35 group-focus-within/promptPage:blur-[0.5px]">
            <label className="block text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">
              {t("image.engineLabel")}
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value as typeof engine)}
                className="nove-native-select mt-2 w-full rounded-2xl border border-white/[0.14] bg-nove-graphite/95 px-4 py-3 text-sm text-slate-100 shadow-inner-glow [color-scheme:dark] focus:border-teal-400/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
              >
                <option value="dashscope">{t("image.engineDashscope")}</option>
                <option value="openai-compat">{t("image.engineOpenai")}</option>
                <option value="replicate">{t("image.engineReplicate")}</option>
              </select>
            </label>
          </div>

          <div className="flex flex-col items-center gap-4 pt-2 transition duration-500 ease-out group-focus-within/promptPage:opacity-35 group-focus-within/promptPage:blur-[0.5px]">
            <div className="relative inline-flex">
              {busy ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-4 rounded-full bg-gradient-to-r from-teal-400/12 via-violet-500/18 to-teal-400/12 opacity-90 blur-2xl animate-nove-breathe"
                />
              ) : null}
              <NeonButton type="button" size="xl" loading={busy} disabled={busy} onClick={() => void submit()} variant="primary">
                {busy ? t("image.queuing") : t("image.generate")}
              </NeonButton>
            </div>
            <Link href="/history" className="text-xs text-slate-500 transition hover:text-teal-200/90">
              {t("image.openHistory")}
            </Link>
          </div>
        </div>

        <section className="mx-auto mt-20 w-full max-w-workspace border-t border-white/[0.06] pt-12 transition duration-500 ease-out sm:mt-24 sm:pt-16 group-focus-within/promptPage:opacity-40 group-focus-within/promptPage:blur-[0.5px]">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-semibold text-white sm:text-xl">{t("image.recentStage")}</h2>
              <p className="mt-1 text-sm text-slate-500">{recent.length ? t("image.subtitle") : t("image.emptySub")}</p>
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
            <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.02] px-8 py-20 text-center">
              <p className="text-base font-medium text-slate-200">{t("image.emptyTitle")}</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{t("image.emptySub")}</p>
            </div>
          ) : (
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {busy ? (
                <div className="contents">
                  {[0, 1].map((i) => (
                    <div
                      key={`sk-${i}`}
                      className="relative mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] shadow-inner-glow"
                    >
                      <div className="relative aspect-[4/5] bg-gradient-to-br from-white/[0.06] via-transparent to-violet-500/10">
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent animate-slow-shimmer" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {recent.map((x) => {
                const thumb = urlsFromResult(x.result)[0] ?? null;
                const title = String((x.payload as { prompt?: string }).prompt ?? "Image");
                const taskHref = `/tasks/image/${x.id}`;
                return (
                  <div
                    key={x.id}
                    className="group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-white/[0.07] bg-nove-graphite/40 shadow-inner-glow transition duration-300 ease-out hover:-translate-y-[2px] hover:border-teal-400/28 hover:shadow-[0_0_44px_-12px_rgba(94,234,212,0.22)]"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-violet-950/50 to-nove-graphite">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.05]" />
                      ) : (
                        <div className="flex h-full items-end p-4">
                          <p className="line-clamp-3 text-sm text-slate-400">{title}</p>
                        </div>
                      )}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent opacity-95 transition duration-300 group-hover:from-black/90" />
                      <Link
                        href={taskHref}
                        aria-label={`${t("image.openFrame")}: ${title}`}
                        className="absolute inset-0 z-[2]"
                      />
                      <div className="pointer-events-none absolute left-3 top-3 z-[3] opacity-90 transition duration-300 group-hover:opacity-100">
                        <TaskStatusPill status={x.status} />
                      </div>
                      <div className="pointer-events-none absolute inset-0 z-[6] flex flex-col items-center justify-center gap-2 opacity-0 transition duration-300 ease-out group-hover:opacity-100">
                        {thumb ? (
                          <a
                            href={thumb}
                            download
                            onClick={(e) => e.stopPropagation()}
                            className="pointer-events-auto rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur-md transition hover:bg-white/20"
                          >
                            ↓ {t("task.download")}
                          </a>
                        ) : null}
                        <Link
                          href={taskHref}
                          onClick={(e) => e.stopPropagation()}
                          className="pointer-events-auto rounded-full border border-white/15 bg-black/50 px-4 py-2 text-xs font-medium text-white shadow-[0_0_28px_-8px_rgba(94,234,212,0.35)] backdrop-blur-md transition hover:bg-white/10"
                        >
                          {t("image.openFrame")}
                        </Link>
                      </div>
                      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[5] translate-y-2 p-4 opacity-0 transition duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                        <p className="line-clamp-2 text-sm font-medium leading-snug text-white">{title}</p>
                        <p className="mt-1 text-[10px] font-medium tabular-nums text-zinc-600">
                          {x.credits_amount} {t("history.creditsUnit")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
