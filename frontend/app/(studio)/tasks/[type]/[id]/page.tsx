"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { usePollStudioTask } from "@/lib/studio";

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

export default function TaskDetailPage() {
  const params = useParams<{ type: string; id: string }>();
  const type = params.type;
  const id = params.id;
  const { task, error, refresh } = usePollStudioTask(id);

  const typeOk = isStudioType(type);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <p className="text-xs uppercase tracking-[0.35em] text-nove-mist">Task</p>
      <h1 className="mt-2 text-2xl font-semibold text-white">任务状态</h1>
      <p className="mt-1 font-mono text-xs text-slate-500">{id}</p>

      {!typeOk ? <p className="mt-4 text-sm text-amber-200">未知任务类型路径，仍尝试加载任务。</p> : null}

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      {task ? (
        <div className="mt-8 space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
          {task.task_type !== type && typeOk ? (
            <p className="text-sm text-amber-200">
              路径类型为 <code>{type}</code>，实际任务为 <code>{task.task_type}</code>。
            </p>
          ) : null}
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-slate-400">状态</span>
            <span className="text-nove-accent">{task.status}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">类型 {task.task_type}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">积分 {task.credits_amount}</span>
          </div>
          {task.error_message ? (
            <p className="text-sm text-red-300">错误：{task.error_message}</p>
          ) : null}

          {task.task_type === "chat" ? (
            <div className="space-y-3 text-sm">
              <p className="text-slate-400">用户</p>
              <div className="rounded-lg bg-black/30 p-3 text-slate-200">
                {(() => {
                  const p = task.payload as { message?: string; messages?: { role: string; content: string }[] };
                  if (p.messages?.length) {
                    const last = [...p.messages].reverse().find((m) => m.role === "user");
                    return last?.content ?? "";
                  }
                  return String(p.message ?? "");
                })()}
              </div>
              {task.result ? (
                <>
                  <p className="text-slate-400">助手</p>
                  <div className="rounded-lg border border-nove-accent/20 bg-nove-accent/5 p-3 text-slate-100">
                    {String((task.result as { reply?: string }).reply ?? JSON.stringify(task.result))}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          {task.task_type === "prompt" ? (
            <div className="space-y-3 text-sm">
              <p className="text-slate-400">原始</p>
              <div className="rounded-lg bg-black/30 p-3">{String((task.payload as { prompt?: string }).prompt)}</div>
              {task.result ? (
                <>
                  <p className="text-slate-400">增强</p>
                  <div className="rounded-lg border border-nove-accent/20 bg-nove-accent/5 p-3">
                    {String((task.result as { enhanced?: string }).enhanced ?? "")}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          {task.task_type === "image" && task.result ? (
            <div className="space-y-3 text-sm">
              <p className="text-slate-400">结果</p>
              <pre className="max-h-64 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-slate-300">
                {JSON.stringify(task.result, null, 2)}
              </pre>
              {resultUrls(task.result).map((u) => (
                <div key={u}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" className="max-h-96 w-full rounded-lg object-contain" />
                  <a href={u} className="mt-1 inline-block break-all text-xs text-nove-accent hover:underline" target="_blank" rel="noreferrer">
                    {u}
                  </a>
                </div>
              ))}
            </div>
          ) : null}

          {task.task_type === "video" && task.result ? (
            <div className="space-y-3 text-sm">
              <p className="text-slate-400">结果</p>
              <pre className="max-h-48 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-slate-300">
                {JSON.stringify(task.result, null, 2)}
              </pre>
              {videoUrl(task.result) ? (
                <video
                  className="mt-2 w-full max-w-2xl rounded-lg border border-white/10"
                  controls
                  src={videoUrl(task.result) ?? undefined}
                />
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-full border border-white/15 px-4 py-2 text-xs text-slate-200"
          >
            立即刷新
          </button>
        </div>
      ) : !error ? (
        <p className="mt-8 text-sm text-slate-500">加载中…</p>
      ) : null}

      <div className="mt-8">
        <Link href="/history" className="text-sm text-nove-accent hover:underline">
          ← 返回历史
        </Link>
      </div>
    </main>
  );
}
