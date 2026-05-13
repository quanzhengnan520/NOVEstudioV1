"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";

type UserRow = {
  id: string;
  email: string;
  is_admin: boolean;
  credits_balance: number;
  created_at: string;
};

type OrderRow = {
  id: string;
  user_id: string;
  email: string;
  order_type: string;
  status: string;
  credits_amount: number;
  metadata: Record<string, unknown>;
  created_at: string;
};

type LogRow = {
  id: string;
  user_id: string;
  email: string;
  delta: number;
  balance_after: number;
  reason: string;
  order_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
};

type ProviderOpsRow = {
  name: string;
  healthy: boolean;
  enabled: boolean;
  lastError: string | null;
  failStreakDb: number;
  totalRequests: number;
  avgLatencyMs: number | null;
  lastFailureAt: string | null;
  lastFailureMessage: string | null;
  circuitOpen: boolean;
  circuitFailCount: number;
  circuitOpenTtlSec: number | null;
  activeJobs: number;
};

type TaskRow = {
  id: string;
  user_id: string;
  email: string;
  order_id: string | null;
  status: string;
  prompt: string | null;
  credits_cost?: number;
  result_url: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

type FeedbackRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  message: string;
  context: Record<string, unknown>;
  created_at: string;
};

export default function AdminHomePage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-6xl px-6 py-12 text-slate-300">加载管理后台…</main>}>
      <AdminHomePageInner />
    </Suspense>
  );
}

function AdminHomePageInner() {
  const [tab, setTab] = useState<"users" | "orders" | "tasks" | "providers" | "feedback">("users");
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [images, setImages] = useState<TaskRow[]>([]);
  const [videos, setVideos] = useState<TaskRow[]>([]);
  const [providers, setProviders] = useState<ProviderOpsRow[]>([]);
  const [queueCounts, setQueueCounts] = useState<Record<string, number> | null>(null);
  const [studioProcByType, setStudioProcByType] = useState<Record<string, number>>({});
  const [feedbackRows, setFeedbackRows] = useState<FeedbackRow[]>([]);
  const [adjustUserId, setAdjustUserId] = useState("");
  const [adjustDelta, setAdjustDelta] = useState("10");
  const [adjustReason, setAdjustReason] = useState("manual_adjust");

  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const title = useMemo(() => "NOVE Studio · 管理后台", []);

  useEffect(() => {
    if (tabParam === "providers") setTab("providers");
    if (tabParam === "feedback") setTab("feedback");
  }, [tabParam]);

  async function loadUsers() {
    const res = await apiFetch<{ items: UserRow[] }>(`admin/users?q=${encodeURIComponent(q)}&limit=50`, {
      method: "GET",
    });
    setUsers(res.data?.items ?? []);
  }

  async function loadOrders() {
    const res = await apiFetch<{ items: OrderRow[] }>("admin/orders?limit=50", { method: "GET" });
    setOrders(res.data?.items ?? []);
  }

  async function loadLogs() {
    const res = await apiFetch<{ items: LogRow[] }>("admin/credit-logs?limit=50", { method: "GET" });
    setLogs(res.data?.items ?? []);
  }

  async function loadTasks() {
    const [i, v] = await Promise.all([
      apiFetch<{ items: TaskRow[] }>("admin/tasks/images?limit=50", { method: "GET" }),
      apiFetch<{ items: TaskRow[] }>("admin/tasks/videos?limit=50", { method: "GET" }),
    ]);
    setImages(i.data?.items ?? []);
    setVideos(v.data?.items ?? []);
  }

  async function loadProviders() {
    const res = await apiFetch<{
      providers: ProviderOpsRow[];
      queueCounts: Record<string, number> | null;
      studioProcessingByType: Record<string, number>;
    }>("admin/providers", { method: "GET" });
    setProviders(res.data?.providers ?? []);
    setQueueCounts(res.data?.queueCounts ?? null);
    setStudioProcByType(res.data?.studioProcessingByType ?? {});
  }

  async function loadFeedback() {
    const res = await apiFetch<{ items: FeedbackRow[] }>("admin/feedback?limit=100", { method: "GET" });
    setFeedbackRows(res.data?.items ?? []);
  }

  useEffect(() => {
    void (async () => {
      setError(null);
      try {
        if (tab === "users") await loadUsers();
        if (tab === "orders") {
          await loadOrders();
          await loadLogs();
        }
        if (tab === "tasks") await loadTasks();
        if (tab === "providers") await loadProviders();
        if (tab === "feedback") await loadFeedback();
      } catch (e) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          setError("需要管理员权限或未登录。");
          return;
        }
        setError(e instanceof Error ? e.message : "加载失败");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function applyAdjust() {
    setError(null);
    try {
      const delta = Number(adjustDelta);
      await apiFetch(`admin/users/${adjustUserId}/credits`, {
        method: "PATCH",
        body: JSON.stringify({ delta, reason: adjustReason }),
      });
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "调整失败");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-nove-mist">{title}</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">管理后台</h1>
        </div>
        <Link href="/credits" className="text-sm text-nove-accent hover:underline">
          返回积分中心
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {(["users", "orders", "tasks", "providers", "feedback"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm ${
              tab === t ? "bg-nove-accent text-nove-ink" : "border border-white/15 text-slate-200"
            }`}
          >
            {t === "users"
              ? "用户"
              : t === "orders"
                ? "订单 / 流水"
                : t === "tasks"
                  ? "任务监控"
                  : t === "providers"
                    ? "服务商 / 队列"
                    : "用户留言"}
          </button>
        ))}
      </div>

      {error ? <p className="mt-6 text-sm text-red-300">{error}</p> : null}

      {tab === "users" ? (
        <section className="mt-8 space-y-6">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm text-slate-300">
              搜索邮箱
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="mt-2 block rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                placeholder="关键字"
              />
            </label>
            <button
              type="button"
              onClick={() => void loadUsers()}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white"
            >
              搜索
            </button>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-lg font-semibold text-white">调积分</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input
                value={adjustUserId}
                onChange={(e) => setAdjustUserId(e.target.value)}
                placeholder="用户 UUID"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              />
              <input
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(e.target.value)}
                placeholder="delta（可负）"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              />
              <input
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="原因"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              />
            </div>
            <button
              type="button"
              onClick={() => void applyAdjust()}
              className="mt-4 rounded-lg bg-nove-accent px-4 py-2 text-sm font-semibold text-nove-ink"
            >
              提交调整
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-black/30 text-left text-slate-300">
                <tr>
                  <th className="px-4 py-3">邮箱</th>
                  <th className="px-4 py-3">管理员</th>
                  <th className="px-4 py-3">积分</th>
                  <th className="px-4 py-3">用户 ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.is_admin ? "是" : "否"}</td>
                    <td className="px-4 py-3">{u.credits_balance}</td>
                    <td className="px-4 py-3 font-mono text-xs">{u.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "orders" ? (
        <section className="mt-8 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-white">订单</h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="bg-black/30 text-left text-slate-300">
                  <tr>
                    <th className="px-3 py-2">时间</th>
                    <th className="px-3 py-2">用户</th>
                    <th className="px-3 py-2">类型</th>
                    <th className="px-3 py-2">积分</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="px-3 py-2 text-xs text-slate-400">{new Date(o.created_at).toLocaleString()}</td>
                      <td className="px-3 py-2">{o.email}</td>
                      <td className="px-3 py-2">{o.order_type}</td>
                      <td className="px-3 py-2">{o.credits_amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">积分流水（全局）</h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="bg-black/30 text-left text-slate-300">
                  <tr>
                    <th className="px-3 py-2">时间</th>
                    <th className="px-3 py-2">用户</th>
                    <th className="px-3 py-2">Δ</th>
                    <th className="px-3 py-2">原因</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {logs.map((l) => (
                    <tr key={l.id}>
                      <td className="px-3 py-2 text-xs text-slate-400">{new Date(l.created_at).toLocaleString()}</td>
                      <td className="px-3 py-2">{l.email}</td>
                      <td className="px-3 py-2">{l.delta}</td>
                      <td className="px-3 py-2">{l.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {tab === "tasks" ? (
        <section className="mt-8 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-white">Image tasks</h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="bg-black/30 text-left text-slate-300">
                  <tr>
                    <th className="px-3 py-2">状态</th>
                    <th className="px-3 py-2">用户</th>
                    <th className="px-3 py-2">提示词</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {images.map((t) => (
                    <tr key={t.id}>
                      <td className="px-3 py-2">{t.status}</td>
                      <td className="px-3 py-2">{t.email}</td>
                      <td className="px-3 py-2">{t.prompt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Video tasks</h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="bg-black/30 text-left text-slate-300">
                  <tr>
                    <th className="px-3 py-2">状态</th>
                    <th className="px-3 py-2">积分</th>
                    <th className="px-3 py-2">用户</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {videos.map((t) => (
                    <tr key={t.id}>
                      <td className="px-3 py-2">{t.status}</td>
                      <td className="px-3 py-2">{t.credits_cost ?? "—"}</td>
                      <td className="px-3 py-2">{t.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {tab === "providers" ? (
        <section className="mt-8 space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <p className="font-semibold text-white">Studio 队列（BullMQ）</p>
            <pre className="mt-2 overflow-x-auto font-mono text-xs text-slate-400">
              {queueCounts ? JSON.stringify(queueCounts, null, 2) : "（无队列句柄：仅 API 进程无 Worker 时为空）"}
            </pre>
            <p className="mt-3 font-semibold text-white">Processing 按类型</p>
            <pre className="mt-2 overflow-x-auto font-mono text-xs text-slate-400">
              {JSON.stringify(studioProcByType, null, 2)}
            </pre>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-black/30 text-left text-slate-300">
                <tr>
                  <th className="px-3 py-2">Provider</th>
                  <th className="px-3 py-2">Healthy</th>
                  <th className="px-3 py-2">Enabled</th>
                  <th className="px-3 py-2">Circuit</th>
                  <th className="px-3 py-2">Fail#</th>
                  <th className="px-3 py-2">Active≈</th>
                  <th className="px-3 py-2">Avg ms</th>
                  <th className="px-3 py-2">Last fail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {providers.map((p) => (
                  <tr key={p.name}>
                    <td className="px-3 py-2 font-mono text-xs">{p.name}</td>
                    <td className="px-3 py-2">{p.healthy ? "yes" : "no"}</td>
                    <td className="px-3 py-2">{p.enabled ? "yes" : "no"}</td>
                    <td className="px-3 py-2">
                      {p.circuitOpen ? `OPEN ${p.circuitOpenTtlSec ?? "?"}s` : "closed"}
                    </td>
                    <td className="px-3 py-2">{p.circuitFailCount}</td>
                    <td className="px-3 py-2">{p.activeJobs}</td>
                    <td className="px-3 py-2">{p.avgLatencyMs ?? "—"}</td>
                    <td className="max-w-xs truncate px-3 py-2 text-xs text-slate-400" title={p.lastFailureMessage ?? ""}>
                      {p.lastFailureAt ? new Date(p.lastFailureAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "feedback" ? (
        <section className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">用户留言</h2>
            <button
              type="button"
              onClick={() => void loadFeedback()}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white"
            >
              刷新
            </button>
          </div>
          <p className="text-sm text-slate-400">来自首页 / 工作室「反馈」入口，按时间倒序。</p>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-black/30 text-left text-slate-300">
                <tr>
                  <th className="px-3 py-2">时间</th>
                  <th className="px-3 py-2">用户</th>
                  <th className="px-3 py-2">留言</th>
                  <th className="px-3 py-2">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {feedbackRows.map((f) => (
                  <tr key={f.id} className="align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-400">
                      {new Date(f.created_at).toLocaleString()}
                    </td>
                    <td className="max-w-[10rem] px-3 py-2 text-xs">{f.email ?? f.user_id ?? "—"}</td>
                    <td className="max-w-xl px-3 py-2 text-xs leading-relaxed text-slate-200">
                      <span className="whitespace-pre-wrap break-words">{f.message}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px] text-slate-500">{f.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {feedbackRows.length === 0 ? <p className="text-sm text-slate-500">暂无留言。</p> : null}
        </section>
      ) : null}
    </main>
  );
}
