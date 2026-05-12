import type { PoolClient } from "pg";
import { captureFrozenForTaskTx } from "../creditsFreeze.js";

/**
 * Finalize a successful studio task: capture frozen credits and persist result.
 * Used by BullMQ worker and synchronous realtime flows (chat stream / prompt).
 */
export async function captureStudioTaskSuccessTx(
  client: PoolClient,
  taskId: string,
  userId: string,
  amount: number,
  result: Record<string, unknown>,
): Promise<void> {
  const cap = await captureFrozenForTaskTx(client, userId, amount, "studio_task", "studio_task_capture", {
    taskId,
  });
  await client.query(
    `
    update nove_studio_tasks
    set status = 'completed',
        result = $2::jsonb,
        credits_charged = true,
        credits_reserved = false,
        order_id = $3,
        error_message = null,
        updated_at = now()
    where id = $1
    `,
    [taskId, JSON.stringify(result), cap.orderId],
  );
}
