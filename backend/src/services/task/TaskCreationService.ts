import type { Queue } from "bullmq";
import { HttpError } from "../../lib/httpError.js";
import { getPool } from "../../db/pool.js";
import { enqueueStudioTask, type StudioJobData } from "../../queues/studioQueue.js";
import { releaseReservationForTask } from "../../queues/videoMaintenance.js";
import type { StudioTaskType } from "../../providers/types.js";
import { freezeCreditsForTaskTx } from "../creditsFreeze.js";
import { insertQueuedStudioTaskTx, setStudioTaskBullJobId } from "../studioTaskService.js";

export type CreatePreFrozenStudioTaskResult = {
  taskId: string;
  balanceAfter: number;
  creditsAmount: number;
  jobId: string;
};

/**
 * Used by deprecated POST /v1/tasks/* shims: insert queued studio row, freeze credits immediately,
 * enqueue BullMQ job. Worker freezeIfNeeded sees credits_reserved and skips duplicate freeze.
 */
export async function createPreFrozenStudioTaskAndEnqueue(opts: {
  queue: Queue<StudioJobData>;
  userId: string;
  taskType: StudioTaskType;
  payload: Record<string, unknown>;
}): Promise<CreatePreFrozenStudioTaskResult> {
  const pool = getPool();
  const client = await pool.connect();
  let rowId: string | null = null;
  let balanceAfter = 0;
  let creditsAmount = 0;
  try {
    await client.query("begin");
    const row = await insertQueuedStudioTaskTx(client, opts.userId, opts.taskType, opts.payload);
    rowId = row.id;
    creditsAmount = row.credits_amount;
    const fr = await freezeCreditsForTaskTx(client, opts.userId, row.credits_amount, "studio_task_freeze", {
      taskId: row.id,
    });
    balanceAfter = fr.balanceAfter;
    await client.query(`update nove_studio_tasks set credits_reserved = true, updated_at = now() where id = $1`, [
      row.id,
    ]);
    await client.query("commit");
  } catch (e) {
    await client.query("rollback").catch(() => {});
    if (e instanceof HttpError) throw e;
    throw e;
  } finally {
    client.release();
  }

  let jobId: string;
  try {
    jobId = await enqueueStudioTask(opts.queue, rowId!);
  } catch (e) {
    await releaseReservationForTask(rowId!);
    throw e instanceof Error ? e : new Error(String(e));
  }
  await setStudioTaskBullJobId(rowId!, jobId);
  return { taskId: rowId!, balanceAfter, creditsAmount, jobId };
}
