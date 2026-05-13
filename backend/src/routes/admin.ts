import { Router } from "express";
import { ok } from "../lib/apiResponse.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../lib/httpError.js";
import { getPool } from "../db/pool.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { grantCredits } from "../services/creditsService.js";
import { getProviderHealthList } from "../providers/providerTelemetry.js";
import { getCircuitSnapshot } from "../services/providerCircuit.js";
import { getRegisteredStudioQueue } from "../queues/studioQueueRegistry.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get(
  "/providers/health",
  asyncHandler(async (req, res) => {
    res.json(ok(req.requestId, getProviderHealthList()));
  }),
);

adminRouter.get(
  "/providers",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const metrics = await pool.query<{
      provider_name: string;
      fail_streak: number;
      total_requests: string;
      total_latency_ms: string;
      last_failure_at: Date | null;
      last_failure_message: string | null;
    }>(`select * from nove_provider_metrics`);
    const health = getProviderHealthList();
    const mainQ = getRegisteredStudioQueue();
    let queueCounts: Record<string, number> | null = null;
    if (mainQ) {
      queueCounts = (await mainQ.getJobCounts(
        "waiting",
        "active",
        "delayed",
        "paused",
        "completed",
        "failed",
      )) as Record<string, number>;
    }
    const processing = await pool.query<{ task_type: string; c: string }>(
      `select task_type, count(*)::text as c from nove_studio_tasks where status = 'processing' group by task_type`,
    );
    const byType: Record<string, number> = {};
    for (const r of processing.rows) byType[r.task_type] = Number(r.c);

    const names = ["deepseek", "dashscope", "volcengine-ark", "openai-compat", "replicate"] as const;
    const providers = [];
    for (const name of names) {
      const h = health.providers.find((p) => p.name === name);
      const m = metrics.rows.find((row) => row.provider_name === name);
      const snap = await getCircuitSnapshot(name);
      let avgLatencyMs: number | null = null;
      const tr = m ? Number(m.total_requests) : 0;
      if (m && tr > 0) {
        avgLatencyMs = Math.round(Number(m.total_latency_ms) / tr);
      }
      let activeJobs = 0;
      if (name === "volcengine-ark") activeJobs = byType.video ?? 0;
      else if (name === "dashscope") activeJobs = byType.image ?? 0;
      else if (name === "deepseek") activeJobs = (byType.chat ?? 0) + (byType.prompt ?? 0);
      providers.push({
        name,
        healthy: h?.healthy ?? false,
        enabled: h?.enabled ?? false,
        lastError: h?.lastError ?? null,
        failStreakDb: m?.fail_streak ?? 0,
        totalRequests: tr,
        avgLatencyMs,
        lastFailureAt: m?.last_failure_at ?? null,
        lastFailureMessage: m?.last_failure_message ?? null,
        circuitOpen: snap.circuitOpen,
        circuitFailCount: snap.failCount,
        circuitOpenTtlSec: snap.circuitOpenTtlSec,
        activeJobs,
      });
    }
    res.json(ok(req.requestId, { providers, queueCounts, studioProcessingByType: byType }));
  }),
);

adminRouter.get(
  "/users",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const offset = Math.max(0, Number(req.query.offset ?? 0));
    const rows = await pool.query(
      `
      select id, email, is_admin, credits_balance, created_at
      from users
      where ($1::text = '' or email ilike '%' || $1 || '%')
      order by created_at desc
      limit $2 offset $3
      `,
      [q, limit, offset],
    );
    res.json(ok(req.requestId, { items: rows.rows }));
  }),
);

adminRouter.patch(
  "/users/:id/credits",
  asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const { delta, reason } = req.body as { delta?: number; reason?: string };
    if (typeof delta !== "number" || !Number.isFinite(delta) || delta === 0) {
      throw new HttpError(400, "delta must be a non-zero number");
    }
    if (!reason || typeof reason !== "string") {
      throw new HttpError(400, "reason is required");
    }
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query("begin");
      const balanceAfter = await grantCredits(client, userId, delta, "admin_adjust", { by: req.auth!.sub, reason });
      await client.query("commit");
      res.json(ok(req.requestId, { userId, balanceAfter, delta }));
    } catch (e) {
      await client.query("rollback");
      throw e;
    } finally {
      client.release();
    }
  }),
);

adminRouter.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)));
    const offset = Math.max(0, Number(req.query.offset ?? 0));
    const rows = await pool.query(
      `
      select o.id, o.user_id, u.email, o.order_type, o.status, o.credits_amount, o.metadata, o.created_at
      from orders o
      join users u on u.id = o.user_id
      order by o.created_at desc
      limit $1 offset $2
      `,
      [limit, offset],
    );
    res.json(ok(req.requestId, { items: rows.rows }));
  }),
);

adminRouter.get(
  "/feedback",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 80)));
    const offset = Math.max(0, Number(req.query.offset ?? 0));
    const rows = await pool.query(
      `
      select f.id, f.user_id, u.email, f.message, f.context, f.created_at
      from nove_feedback f
      left join users u on u.id = f.user_id
      order by f.created_at desc
      limit $1 offset $2
      `,
      [limit, offset],
    );
    res.json(ok(req.requestId, { items: rows.rows }));
  }),
);

adminRouter.get(
  "/credit-logs",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const userId = typeof req.query.userId === "string" ? req.query.userId : "";
    const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)));
    const offset = Math.max(0, Number(req.query.offset ?? 0));
    const rows = await pool.query(
      `
      select l.id, l.user_id, u.email, l.delta, l.balance_after, l.reason, l.order_id, l.meta, l.created_at
      from credit_logs l
      join users u on u.id = l.user_id
      where ($1::text = '' or l.user_id::text = $1)
      order by l.created_at desc
      limit $2 offset $3
      `,
      [userId, limit, offset],
    );
    res.json(ok(req.requestId, { items: rows.rows }));
  }),
);

adminRouter.get(
  "/tasks/images",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)));
    const rows = await pool.query(
      `
      select t.id, t.user_id, u.email, t.order_id, t.status,
             coalesce(t.payload->>'prompt','') as prompt,
             coalesce(t.result->'urls'->>0, t.result->>'url') as result_url,
             t.error_message as error,
             t.credits_amount as credits_cost,
             t.created_at, t.updated_at
      from nove_studio_tasks t
      join users u on u.id = t.user_id
      where t.task_type = 'image'
        and ($1::text = '' or t.status = $1)
      order by t.created_at desc
      limit $2
      `,
      [status, limit],
    );
    res.json(ok(req.requestId, { items: rows.rows }));
  }),
);

adminRouter.get(
  "/tasks/videos",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)));
    const rows = await pool.query(
      `
      select t.id, t.user_id, u.email, t.order_id, t.status,
             coalesce(t.payload->>'prompt','') as prompt,
             t.credits_amount as credits_cost,
             coalesce(t.result->>'url', null) as result_url,
             t.error_message as error,
             t.created_at, t.updated_at
      from nove_studio_tasks t
      join users u on u.id = t.user_id
      where t.task_type = 'video'
        and ($1::text = '' or t.status = $1)
      order by t.created_at desc
      limit $2
      `,
      [status, limit],
    );
    res.json(ok(req.requestId, { items: rows.rows }));
  }),
);

adminRouter.get(
  "/studio/queue-summary",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const counts = await pool.query<{ status: string; c: string }>(
      `select status, count(*)::text as c from nove_studio_tasks group by status`,
    );
    const byStatus: Record<string, number> = {};
    for (const r of counts.rows) {
      byStatus[r.status] = Number(r.c);
    }
    const mainQ = getRegisteredStudioQueue();
    let queueCounts: Record<string, number> | null = null;
    if (mainQ) {
      queueCounts = (await mainQ.getJobCounts(
        "waiting",
        "active",
        "delayed",
        "paused",
        "completed",
        "failed",
      )) as Record<string, number>;
    }
    res.json(ok(req.requestId, { noveStudioTasksByStatus: byStatus, bullmq: queueCounts }));
  }),
);
