import { getPool } from "../db/pool.js";
import { sanitizeErrorMessage } from "../providers/sanitize.js";
import { fetchVideoRemoteStatus } from "../providers/volcengineArkVideo.js";
import { captureFrozenForTaskTx, releaseFrozenForTaskTx } from "../services/creditsFreeze.js";
import { failLegacyLinkedRows, syncAfterStudioJobSuccess } from "../services/studioLegacySync.js";
import { rehostRemoteUrlToR2 } from "../services/objectStorageR2.js";
import { getStudioTaskById } from "../services/studioTaskService.js";
import { broadcastStudioWsV1 } from "../ws/studioWs.js";

export async function releaseReservationForTask(taskId: string): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const t = await client.query<{
      user_id: string;
      credits_amount: number;
      credits_reserved: boolean;
      credits_charged: boolean;
    }>(
      `select user_id, credits_amount, credits_reserved, credits_charged from nove_studio_tasks where id = $1 for update`,
      [taskId],
    );
    if (t.rowCount === 0) {
      await client.query("rollback");
      return;
    }
    const row = t.rows[0];
    if (!row.credits_reserved || row.credits_charged) {
      await client.query("commit");
      return;
    }
    await releaseFrozenForTaskTx(client, row.user_id, row.credits_amount, "studio_task_release", { taskId });
    await client.query(
      `update nove_studio_tasks set credits_reserved = false, updated_at = now() where id = $1`,
      [taskId],
    );
    await client.query("commit");
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export async function runVideoRemotePollBatch(): Promise<void> {
  const pool = getPool();
  const rows = await pool.query<{
    id: string;
    user_id: string;
    credits_amount: number;
    remote_task_id: string;
    payload: Record<string, unknown>;
  }>(
    `
    select id, user_id, credits_amount, remote_task_id, payload
    from nove_studio_tasks
    where task_type = 'video'
      and status = 'processing'
      and remote_task_id is not null
      and credits_reserved = true
      and credits_charged = false
      and (
        last_remote_poll_at is null
        or now() - last_remote_poll_at >= case
          when now() - created_at < interval '3 minutes' then interval '5 seconds'
          when now() - created_at < interval '30 minutes' then interval '15 seconds'
          else interval '30 seconds'
        end
      )
    order by last_remote_poll_at nulls first, created_at asc
    limit 25
    `,
  );
  for (const row of rows.rows) {
    try {
      await pool.query(`update nove_studio_tasks set last_remote_poll_at = now() where id = $1`, [row.id]);
      const st = await fetchVideoRemoteStatus(row.remote_task_id);
      if (st.status === "running" || st.status === "unknown") continue;
      if (st.status === "failed") {
        const msg = sanitizeErrorMessage(st.errorMessage ?? "video failed");
        await pool.query(
          `update nove_studio_tasks set status = 'failed', error_message = $2, updated_at = now() where id = $1`,
          [row.id, msg.slice(0, 4000)],
        );
        await releaseReservationForTask(row.id);
        await failLegacyLinkedRows(row.id, msg);
        broadcastStudioWsV1(row.user_id, {
          type: "task_failed",
          taskId: row.id,
          taskType: "video",
          status: "failed",
          credits: { phase: "release", amount: row.credits_amount },
          timestamp: new Date().toISOString(),
          error: msg,
        });
        continue;
      }
      if (st.status === "succeeded" && st.videoUrl) {
        const key = `studio/video/${row.id}/${Date.now()}.mp4`;
        const publicUrl = await rehostRemoteUrlToR2(key, st.videoUrl);
        const result = {
          url: publicUrl,
          vendorTaskId: row.remote_task_id,
          provider: "volcengine-ark",
          rehosted: publicUrl !== st.videoUrl,
        };
        const client = await pool.connect();
        try {
          await client.query("begin");
          const cap = await captureFrozenForTaskTx(
            client,
            row.user_id,
            row.credits_amount,
            "studio_task",
            "studio_task_capture",
            { taskId: row.id },
          );
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
            [row.id, JSON.stringify(result), cap.orderId],
          );
          await client.query("commit");
        } catch (e) {
          await client.query("rollback").catch(() => {});
          throw e;
        } finally {
          client.release();
        }
        const full = await getStudioTaskById(row.id);
        if (full) {
          await syncAfterStudioJobSuccess(full.user_id, full.task_type, full.id, full.payload ?? {}, result);
          broadcastStudioWsV1(full.user_id, {
            type: "task_completed",
            taskId: full.id,
            taskType: "video",
            status: "completed",
            credits: { phase: "capture", amount: full.credits_amount },
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch {
      /* single row errors should not stop batch */
    }
  }
}

export async function runStudioTaskTimeouts(): Promise<void> {
  const pool = getPool();
  const stale = await pool.query<{ id: string }>(
    `
    select id from nove_studio_tasks
    where status = 'processing'
      and processing_deadline is not null
      and processing_deadline < now()
      and credits_reserved = true
      and credits_charged = false
    limit 50
    `,
  );
  for (const r of stale.rows) {
    const msg = "Task timed out in processing";
    await pool.query(
      `update nove_studio_tasks set status = 'failed', error_message = $2, updated_at = now() where id = $1`,
      [r.id, msg],
    );
    await releaseReservationForTask(r.id);
    await failLegacyLinkedRows(r.id, msg);
  }
}
