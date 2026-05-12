"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { mapApiErrorMessage } from "@/lib/errors";
import { useI18n } from "@/lib/i18n/context";
import type { StudioTaskView } from "@/lib/studio";
import { NeonButton } from "@/components/nove/NeonButton";
import { TaskStatusPill } from "@/components/nove/TaskStatusPill";
import { taskThumbUrl, taskTitlePreview } from "@/components/nove/taskPreview";

type Filter = "all" | "chat" | "prompt" | "image" | "video";

function navKeyForType(type: string): string {
  const m: Record<string, string> = {
    chat: "nav.chat",
    prompt: "nav.prompt",
    image: "nav.image",
    video: "nav.video",
  };
  return m[type] ?? type;
}

function GhostPreviewCards() {
  const shades = ["opacity-[0.5]", "opacity-[0.38]", "opacity-[0.45]"] as const;
  return (
    <div className="mx-auto mt-10 grid max-w-xl grid-cols-3 gap-3">
      {shades.map((op, i) => (
        <div
          key={i}
          className={`aspect-[3/4] rounded-xl border border-white/[0.05] bg-gradient-to-b from-white/[0.06] to-transparent shadow-inner-glow ${op}`}
        >
          <div className="h-full w-full rounded-xl bg-gradient-to-br from-teal-500/8 via-transparent to-violet-500/12 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function HistoryPage() {
  const { t } = useI18n();
  const heroTitle = t("history.r8Title");
  const [items, setItems] = useState<StudioTaskView[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  async function load() {
    setErr(null);
    try {
      const env = await apiFetch<{ items: StudioTaskView[] }>("studio/history?limit=80", { method: "GET" });
      setItems(env.data?.items ?? []);
    } catch (e) {
      const raw = e instanceof ApiError ? String(e.body.error ?? e.message) : String(e);
      setErr(mapApiErrorMessage(raw));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((x) => x.task_type === filter);
  }, [items, filter]);

  const filters: { id: Filter; labelKey: string }[] = [
    { id: "all", labelKey: "history.filterAll" },
    { id: "video", labelKey: "history.filterVideo" },
    { id: "image", labelKey: "history.filterImage" },
    { id: "chat", labelKey: "history.filterChat" },
    { id: "prompt", labelKey: "history.filterPrompt" },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-workspace px-4 pb-6 pt-8 text-center sm:pt-10">
        <p className="nove-eyebrow opacity-80">{t("history.eyebrow")}</p>
        <h1 className="nove-section-title mt-3">
          <span className="nove-text-gradient-neon">{heroTitle}</span>
        </h1>
        <p className="nove-description mx-auto mt-3 max-w-xl text-sm sm:text-base">{t("history.r8Subtitle")}</p>
        <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`nove-chip ${filter === f.id ? "nove-chip-active" : ""}`}
            >
              {t(f.labelKey)}
            </button>
          ))}
          <NeonButton type="button" onClick={() => void load()} variant="secondary" className="!px-4 !py-2 !text-xs">
            {t("common.refresh")}
          </NeonButton>
        </div>
      </div>

      <div className="mx-auto w-full max-w-workspace flex-1 px-4 pb-28 pt-2 md:pb-12">
        {err ? (
          <div className="mb-6 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-100">{err}</div>
        ) : null}

        <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
          {filtered.map((x) => {
            const thumb = taskThumbUrl(x);
            const title = taskTitlePreview(x);
            const typeLabel = t(navKeyForType(x.task_type));
            return (
              <div key={x.id} className="mb-5 break-inside-avoid">
                <Link
                  href={`/tasks/${x.task_type}/${x.id}`}
                  className="group/card block overflow-hidden rounded-2xl border border-white/[0.07] bg-nove-graphite/30 shadow-inner-glow transition duration-300 ease-out hover:-translate-y-0.5 hover:border-teal-400/25 hover:shadow-[0_0_48px_-14px_rgba(94,234,212,0.22)]"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/50">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 ease-out group-hover/card:scale-[1.05]"
                      />
                    ) : (
                      <div className="flex h-full flex-col justify-end bg-gradient-to-br from-violet-950/50 via-nove-graphite to-teal-950/25 p-5">
                        <p className="line-clamp-3 text-sm leading-relaxed text-slate-300">{title}</p>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent opacity-90 transition duration-300 group-hover/card:from-black/92" />
                    <div className="absolute left-3 top-3 flex flex-wrap gap-2 opacity-95 transition duration-300 group-hover/card:opacity-100">
                      <span className="rounded-full border border-white/12 bg-black/50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-100/95 backdrop-blur-md">
                        {typeLabel}
                      </span>
                      <TaskStatusPill status={x.status} />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-4 opacity-0 transition duration-300 ease-out group-hover/card:translate-y-0 group-hover/card:opacity-100">
                      <p className="line-clamp-2 text-sm font-medium text-white">{title}</p>
                      <p className="mt-1 text-[10px] tabular-nums text-zinc-500">
                        {new Date(x.created_at).toLocaleString()} · {x.credits_amount} {t("history.creditsUnit")}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="mx-auto mt-12 max-w-lg rounded-[1.75rem] border border-dashed border-white/[0.08] bg-white/[0.02] px-8 py-14 text-center shadow-inner-glow">
            <p className="text-base font-medium text-slate-100">{t("history.emptyTitle")}</p>
            <p className="nove-description mx-auto mt-2 max-w-sm text-sm">{t("history.emptySub")}</p>
            <GhostPreviewCards />
          </div>
        ) : null}
      </div>
    </div>
  );
}
