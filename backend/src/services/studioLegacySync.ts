import { getPool } from "../db/pool.js";

/**
 * LEGACY COMPATIBILITY ONLY — scheduled for removal in future versions.
 *
 * Historical `image_tasks` / `video_tasks` rows are no longer written or updated.
 * Canonical studio data lives exclusively in `nove_studio_tasks`.
 * Chat transcript rows remain in `nove_chat_messages` (not legacy task tables).
 */

export async function insertLegacyImageTask(_userId: string, _studioTaskId: string, _prompt: string): Promise<void> {
  /* no-op: legacy image_tasks inserts removed (R9) */
}

export async function insertLegacyVideoTask(
  _userId: string,
  _studioTaskId: string,
  _prompt: string,
  _creditsCost: number,
): Promise<void> {
  /* no-op: legacy video_tasks inserts removed (R9) */
}

export async function markLegacyImageSuccess(_studioTaskId: string, _resultUrl: string): Promise<void> {
  /* no-op */
}

export async function markLegacyImageFailed(_studioTaskId: string, _err: string): Promise<void> {
  /* no-op */
}

export async function markLegacyVideoSuccess(_studioTaskId: string, _resultUrl: string): Promise<void> {
  /* no-op */
}

export async function markLegacyVideoFailed(_studioTaskId: string, _err: string): Promise<void> {
  /* no-op */
}

export async function failLegacyLinkedRows(_studioTaskId: string, _err: string): Promise<void> {
  /* no-op — legacy tables are not updated */
}

export async function insertChatHistoryRows(
  userId: string,
  studioTaskId: string,
  userText: string,
  assistantText: string,
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `insert into nove_chat_messages (user_id, studio_task_id, role, content) values ($1, $2, 'user', $3)`,
    [userId, studioTaskId, userText.slice(0, 32000)],
  );
  await pool.query(
    `insert into nove_chat_messages (user_id, studio_task_id, role, content) values ($1, $2, 'assistant', $3)`,
    [userId, studioTaskId, assistantText.slice(0, 32000)],
  );
}

function userTextFromChatPayload(payload: Record<string, unknown>): string {
  const msgs = payload.messages as { role?: string; content?: string }[] | undefined;
  if (Array.isArray(msgs)) {
    const u = [...msgs].reverse().find((m) => m.role === "user");
    return String(u?.content ?? "");
  }
  return String(payload.message ?? "");
}

/** After BullMQ worker succeeds — persist chat transcript only (image/video URLs live on nove_studio_tasks.result). */
export async function syncAfterStudioJobSuccess(
  userId: string,
  taskType: string,
  taskId: string,
  payload: Record<string, unknown>,
  result: Record<string, unknown>,
): Promise<void> {
  if (taskType === "chat") {
    const reply = String(result.reply ?? "");
    await insertChatHistoryRows(userId, taskId, userTextFromChatPayload(payload), reply);
  }
}
