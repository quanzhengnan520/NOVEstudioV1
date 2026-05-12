import type { PoolClient } from "pg";
import { getPool } from "../db/pool.js";
import { HttpError } from "../lib/httpError.js";
import { costForSpend, type SpendKind } from "./creditsService.js";
import type { StudioTaskType } from "../providers/types.js";

export type StudioTaskRowDb = {
  id: string;
  user_id: string;
  task_type: StudioTaskType;
  status: string;
  bullmq_job_id: string | null;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error_message: string | null;
  credits_amount: number;
  credits_charged: boolean;
  credits_reserved: boolean;
  order_id: string | null;
  remote_task_id: string | null;
  processing_deadline: Date | null;
  created_at: Date;
  updated_at: Date;
};

function spendKindForType(type: StudioTaskType): SpendKind {
  if (type === "chat") return "chat";
  if (type === "prompt") return "prompt_enhance";
  if (type === "image") return "image";
  return "video";
}

export function creditsForStudioTask(
  type: StudioTaskType,
  payload: Record<string, unknown>,
): number {
  if (type === "video") {
    const tier = typeof payload.tier === "number" ? payload.tier : undefined;
    const amount = typeof payload.amount === "number" ? payload.amount : undefined;
    return costForSpend("video", { videoTier: tier, videoAmount: amount });
  }
  return costForSpend(spendKindForType(type));
}

export async function insertQueuedStudioTask(
  userId: string,
  taskType: StudioTaskType,
  payload: Record<string, unknown>,
): Promise<StudioTaskRowDb> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    return await insertQueuedStudioTaskTx(client, userId, taskType, payload);
  } finally {
    client.release();
  }
}

export async function insertQueuedStudioTaskTx(
  client: PoolClient,
  userId: string,
  taskType: StudioTaskType,
  payload: Record<string, unknown>,
): Promise<StudioTaskRowDb> {
  const credits = creditsForStudioTask(taskType, payload);
  const r = await client.query<StudioTaskRowDb>(
    `
    insert into nove_studio_tasks (user_id, task_type, status, payload, credits_amount)
    values ($1, $2, 'queued', $3::jsonb, $4)
    returning id, user_id, task_type, status, bullmq_job_id, payload, result, error_message,
              credits_amount, credits_charged, credits_reserved, order_id, remote_task_id, processing_deadline,
              created_at, updated_at
    `,
    [userId, taskType, JSON.stringify(payload), credits],
  );
  return r.rows[0];
}

export async function setStudioTaskBullJobId(taskId: string, bullmqJobId: string): Promise<void> {
  const pool = getPool();
  await pool.query(`update nove_studio_tasks set bullmq_job_id = $2, updated_at = now() where id = $1`, [
    taskId,
    bullmqJobId,
  ]);
}

export async function getStudioTaskForUser(
  userId: string,
  taskId: string,
): Promise<StudioTaskRowDb | null> {
  const pool = getPool();
  const r = await pool.query<StudioTaskRowDb>(
    `
    select id, user_id, task_type, status, bullmq_job_id, payload, result, error_message,
           credits_amount, credits_charged, credits_reserved, order_id, remote_task_id, processing_deadline,
           created_at, updated_at
    from nove_studio_tasks
    where id = $1 and user_id = $2
    `,
    [taskId, userId],
  );
  return r.rows[0] ?? null;
}

export async function listStudioTasksForUser(
  userId: string,
  opts: { limit: number; offset: number },
): Promise<StudioTaskRowDb[]> {
  const pool = getPool();
  const r = await pool.query<StudioTaskRowDb>(
    `
    select id, user_id, task_type, status, bullmq_job_id, payload, result, error_message,
           credits_amount, credits_charged, credits_reserved, order_id, remote_task_id, processing_deadline,
           created_at, updated_at
    from nove_studio_tasks
    where user_id = $1
    order by created_at desc
    limit $2 offset $3
    `,
    [userId, opts.limit, opts.offset],
  );
  return r.rows;
}

export async function getStudioTaskById(taskId: string): Promise<StudioTaskRowDb | null> {
  const pool = getPool();
  const r = await pool.query<StudioTaskRowDb>(
    `
    select id, user_id, task_type, status, bullmq_job_id, payload, result, error_message,
           credits_amount, credits_charged, credits_reserved, order_id, remote_task_id, processing_deadline,
           created_at, updated_at
    from nove_studio_tasks
    where id = $1
    `,
    [taskId],
  );
  return r.rows[0] ?? null;
}

export function assertStudioTaskType(v: unknown): StudioTaskType {
  if (v === "chat" || v === "prompt" || v === "image" || v === "video") return v;
  throw new HttpError(400, "taskType must be chat | prompt | image | video");
}
