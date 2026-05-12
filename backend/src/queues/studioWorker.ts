import { Queue, UnrecoverableError, Worker } from "bullmq";
import { env } from "../config/env.js";
import { getPool } from "../db/pool.js";
import { HttpError } from "../lib/httpError.js";
import { executeStudioTask } from "../providers/studioExecutor.js";
import type { StudioTaskRow } from "../providers/types.js";
import { freezeCreditsForTaskTx } from "../services/creditsFreeze.js";
import { captureStudioTaskSuccessTx } from "../services/task/TaskBillingService.js";
import { failLegacyLinkedRows, syncAfterStudioJobSuccess } from "../services/studioLegacySync.js";
import { rehostRemoteUrlToR2 } from "../services/objectStorageR2.js";
import { getStudioTaskById } from "../services/studioTaskService.js";
import { getRedisConnection } from "./redis.js";
import { STUDIO_QUEUE_NAME, type StudioJobData } from "./studioQueue.js";
import { releaseReservationForTask } from "./videoMaintenance.js";
import { broadcastStudioWsV1 } from "../ws/studioWs.js";

function isUnrecoverableSpend(err: unknown): boolean {
  if (!(err instanceof HttpError)) return false;
  if (err.status === 403 && err.message === "EMAIL_NOT_VERIFIED") return true;
  if (err.status === 400 && err.message === "Insufficient credits") return true;
  return false;
}

async function transitionQueuedToProcessing(taskId: string): Promise<{ skip: boolean }> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const locked = await client.query<{ status: string; task_type: string }>(
      `select status, task_type from nove_studio_tasks where id = $1 for update`,
      [taskId],
    );
    if (locked.rowCount === 0) {
      await client.query("rollback");
      return { skip: true };
    }
    const st = locked.rows[0].status;
    if (st === "completed" || st === "failed") {
      await client.query("commit");
      return { skip: true };
    }
    if (st === "queued") {
      const interval = locked.rows[0].task_type === "video" ? "8 hours" : "45 minutes";
      await client.query(
        `
        update nove_studio_tasks
        set status = 'processing',
            processing_deadline = now() + $2::interval,
            updated_at = now()
        where id = $1
        `,
        [taskId, interval],
      );
    }
    await client.query("commit");
    return { skip: false };
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

async function freezeIfNeeded(taskId: string): Promise<{ skip: boolean }> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const locked = await client.query<{
      status: string;
      user_id: string;
      credits_amount: number;
      credits_reserved: boolean;
      credits_charged: boolean;
    }>(
      `select status, user_id, credits_amount, credits_reserved, credits_charged from nove_studio_tasks where id = $1 for update`,
      [taskId],
    );
    if (locked.rowCount === 0) {
      await client.query("rollback");
      return { skip: true };
    }
    const row = locked.rows[0];
    if (row.status === "completed" || row.status === "failed") {
      await client.query("commit");
      return { skip: true };
    }
    if (!row.credits_reserved) {
      try {
        await freezeCreditsForTaskTx(client, row.user_id, row.credits_amount, "studio_task_freeze", { taskId });
        await client.query(
          `update nove_studio_tasks set credits_reserved = true, updated_at = now() where id = $1`,
          [taskId],
        );
      } catch (e) {
        await client.query("rollback");
        if (isUnrecoverableSpend(e)) {
          const msg = e instanceof Error ? e.message : "Spend failed";
          await pool.query(
            `update nove_studio_tasks set status = 'failed', error_message = $2, updated_at = now() where id = $1`,
            [taskId, msg],
          );
          await failLegacyLinkedRows(taskId, msg);
          throw new UnrecoverableError(msg);
        }
        throw e;
      }
    }
    await client.query("commit");
    return { skip: false };
  } catch (e) {
    await client.query("rollback").catch(() => {});
    if (e instanceof UnrecoverableError) throw e;
    throw e;
  } finally {
    client.release();
  }
}

async function finalizeNonVideoSuccess(
  taskId: string,
  userId: string,
  amount: number,
  result: Record<string, unknown>,
): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    await captureStudioTaskSuccessTx(client, taskId, userId, amount, result);
    await client.query("commit");
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

async function markFailed(taskId: string, message: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    `update nove_studio_tasks set status = 'failed', error_message = $2, updated_at = now() where id = $1`,
    [taskId, message.slice(0, 4000)],
  );
}

async function maybeRehostImageResult(taskId: string, result: Record<string, unknown>): Promise<Record<string, unknown>> {
  const urls = result.urls;
  if (!Array.isArray(urls)) return result;
  const out: string[] = [];
  let i = 0;
  for (const u of urls) {
    if (typeof u !== "string") continue;
    const key = `studio/image/${taskId}/${Date.now()}_${i++}.img`;
    out.push(await rehostRemoteUrlToR2(key, u));
  }
  return { ...result, urls: out.length ? out : urls };
}

export function startStudioWorker(failedQueue: Queue): Worker<StudioJobData> {
  const connection = getRedisConnection();
  const worker = new Worker<StudioJobData>(
    STUDIO_QUEUE_NAME,
    async (job) => {
      const taskId = job.data.taskId;
      const t0 = await transitionQueuedToProcessing(taskId);
      if (t0.skip) return { skipped: true };

      const t1 = await freezeIfNeeded(taskId);
      if (t1.skip) return { skipped: true };

      const row = await getStudioTaskById(taskId);
      if (!row || row.status === "failed" || row.status === "completed") {
        return { skipped: true };
      }

      if (
        row.task_type === "video" &&
        row.remote_task_id &&
        row.status === "processing" &&
        row.credits_reserved &&
        !row.credits_charged
      ) {
        return { deferred: true };
      }

      const execRow: StudioTaskRow = {
        id: row.id,
        user_id: row.user_id,
        task_type: row.task_type,
        status: row.status,
        payload: row.payload ?? {},
        credits_amount: row.credits_amount,
      };

      try {
        const result = await executeStudioTask(execRow);

        if (row.task_type === "video" && result.polling === true && typeof result.vendorTaskId === "string") {
          const pool = getPool();
          await pool.query(
            `
            update nove_studio_tasks
            set remote_task_id = $2,
                result = $3::jsonb,
                processing_deadline = now() + interval '8 hours',
                updated_at = now()
            where id = $1
            `,
            [taskId, result.vendorTaskId, JSON.stringify(result)],
          );
          return { deferred: true };
        }

        let out = result as Record<string, unknown>;
        if (row.task_type === "image") {
          out = await maybeRehostImageResult(taskId, out);
        }

        await finalizeNonVideoSuccess(taskId, row.user_id, row.credits_amount, out);
        await syncAfterStudioJobSuccess(row.user_id, row.task_type, taskId, row.payload ?? {}, out);
        broadcastStudioWsV1(row.user_id, {
          type: "task_completed",
          taskId,
          taskType: row.task_type,
          status: "completed",
          credits: { phase: "capture", amount: row.credits_amount },
          timestamp: new Date().toISOString(),
        });
        return { ok: true };
      } catch (e) {
        await releaseReservationForTask(taskId);
        const msg = e instanceof Error ? e.message : String(e);
        await markFailed(taskId, msg);
        await failLegacyLinkedRows(taskId, msg);
        throw e;
      }
    },
    { connection, concurrency: Math.max(1, env.noveWorkerConcurrency) },
  );

  worker.on("failed", async (job, err) => {
    const taskId = job?.data?.taskId;
    const attempts = job?.opts?.attempts ?? 3;
    const made = job?.attemptsMade ?? 0;
    const terminal = err instanceof UnrecoverableError || made >= attempts;
    if (!taskId || !terminal) return;
    const msg = err instanceof Error ? err.message : String(err);
    await releaseReservationForTask(taskId);
    await markFailed(taskId, msg);
    await failLegacyLinkedRows(taskId, msg);
    await failedQueue.add(
      "failed-job",
      {
        sourceQueue: STUDIO_QUEUE_NAME,
        taskId,
        bullmqJobId: job?.id,
        error: msg,
        attemptsMade: made,
      },
      { removeOnComplete: { count: 5000 } },
    );
  });

  return worker;
}
