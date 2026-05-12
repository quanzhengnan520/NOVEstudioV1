import type { Request, Response, Router } from "express";
import { fail, ok } from "../lib/apiResponse.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../lib/httpError.js";
import { getPool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { generateChatCompletion, generateChatCompletionStream, type ChatMessage } from "../providers/deepseekChat.js";
import { sanitizeErrorMessage } from "../providers/sanitize.js";
import { costForSpend } from "../services/creditsService.js";
import { freezeCreditsForTaskTx } from "../services/creditsFreeze.js";
import { failLegacyLinkedRows, insertChatHistoryRows } from "../services/studioLegacySync.js";
import { captureStudioTaskSuccessTx } from "../services/task/TaskBillingService.js";
import { releaseReservationForTask } from "../queues/videoMaintenance.js";
import { broadcastStudioWsV1 } from "../ws/studioWs.js";

function lastUserContent(messages: ChatMessage[]): string {
  const u = [...messages].reverse().find((m) => m.role === "user");
  return u?.content ?? "";
}

export function attachStudioRealtimeRoutes(router: Router): void {
  router.post(
    "/prompt/complete",
    requireAuth,
    asyncHandler(async (req, res) => {
      const userId = req.auth!.sub;
      const body = req.body as {
        prompt?: string;
        system?: string;
        temperature?: number;
        max_tokens?: number;
        model?: string;
      };
      const prompt = (body.prompt ?? "").trim();
      if (!prompt) throw new HttpError(400, "prompt is required");
      const system = String(
        body.system ?? "You are a prompt engineer. Return only the improved prompt text, no preamble.",
      );
      const credits = costForSpend("prompt_enhance");
      const pool = getPool();
      const client = await pool.connect();
      let taskId: string;
      try {
        await client.query("begin");
        const ins = await client.query<{ id: string }>(
          `
          insert into nove_studio_tasks (user_id, task_type, status, payload, credits_amount)
          values ($1, 'prompt', 'processing', $2::jsonb, $3)
          returning id
          `,
          [
            userId,
            JSON.stringify({
              prompt,
              system,
              temperature: body.temperature,
              max_tokens: body.max_tokens,
              model: body.model,
            }),
            credits,
          ],
        );
        taskId = ins.rows[0].id;
        await freezeCreditsForTaskTx(client, userId, credits, "studio_prompt_freeze", { taskId });
        await client.query(
          `update nove_studio_tasks set credits_reserved = true, credits_charged = false, updated_at = now() where id = $1`,
          [taskId],
        );
        await client.query("commit");
      } catch (e) {
        await client.query("rollback").catch(() => {});
        throw e;
      } finally {
        client.release();
      }

      broadcastStudioWsV1(userId, {
        type: "task_processing",
        taskId,
        taskType: "prompt",
        status: "processing",
        credits: { phase: "freeze", amount: credits },
        timestamp: new Date().toISOString(),
      });

      try {
        const { content: enhanced } = await generateChatCompletion(
          [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
          {
            model: body.model,
            temperature: typeof body.temperature === "number" ? body.temperature : 0.4,
            max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : 2048,
          },
        );
        const c2 = await pool.connect();
        try {
          await c2.query("begin");
          await captureStudioTaskSuccessTx(c2, taskId, userId, credits, { enhanced, provider: "deepseek" });
          await c2.query("commit");
        } catch (e) {
          await c2.query("rollback").catch(() => {});
          throw e;
        } finally {
          c2.release();
        }
        broadcastStudioWsV1(userId, {
          type: "task_completed",
          taskId,
          taskType: "prompt",
          status: "completed",
          credits: { phase: "capture", amount: credits },
          timestamp: new Date().toISOString(),
        });
        res.json(ok(req.requestId, { taskId, enhanced }));
      } catch (e) {
        const msg = sanitizeErrorMessage(e instanceof Error ? e.message : String(e));
        await releaseReservationForTask(taskId);
        await pool.query(
          `update nove_studio_tasks set status = 'failed', error_message = $2, updated_at = now() where id = $1`,
          [taskId, msg],
        );
        await failLegacyLinkedRows(taskId, msg);
        broadcastStudioWsV1(userId, {
          type: "task_failed",
          taskId,
          taskType: "prompt",
          status: "failed",
          credits: { phase: "release", amount: credits },
          timestamp: new Date().toISOString(),
        });
        throw new HttpError(502, msg);
      }
    }),
  );

  router.post("/chat/stream", requireAuth, (req, res, next) => {
    void handleChatStream(req, res).catch((err) => {
      if (!res.headersSent) {
        next(err);
        return;
      }
      try {
        res.end();
      } catch {
        /* ignore */
      }
    });
  });
}

async function handleChatStream(req: Request, res: Response): Promise<void> {
  const userId = req.auth?.sub;
  if (!userId) {
    res.status(401).json(fail(req.requestId, "Unauthorized"));
    return;
  }

  const body = req.body as {
    messages?: ChatMessage[];
    message?: string;
    temperature?: number;
    max_tokens?: number;
    model?: string;
  };
  let messages: ChatMessage[] = [];
  if (Array.isArray(body.messages) && body.messages.length > 0) {
    messages = body.messages.map((m) => ({
      role: m.role === "system" || m.role === "assistant" || m.role === "user" ? m.role : "user",
      content: String(m.content ?? ""),
    }));
  } else if (typeof body.message === "string" && body.message.trim()) {
    messages = [{ role: "user", content: body.message.trim() }];
  } else {
    res.status(400).json(fail(req.requestId, "messages or message is required"));
    return;
  }

  const credits = costForSpend("chat");
  const pool = getPool();
  const client = await pool.connect();
  let taskId: string;
  try {
    await client.query("begin");
    const ins = await client.query<{ id: string }>(
      `
      insert into nove_studio_tasks (user_id, task_type, status, payload, credits_amount)
      values ($1, 'chat', 'processing', $2::jsonb, $3)
      returning id
      `,
      [
        userId,
        JSON.stringify({
          messages,
          stream: true,
          temperature: body.temperature,
          max_tokens: body.max_tokens,
          model: body.model,
        }),
        credits,
      ],
    );
    taskId = ins.rows[0].id;
    await freezeCreditsForTaskTx(client, userId, credits, "studio_chat_freeze", { taskId });
    await client.query(
      `update nove_studio_tasks set credits_reserved = true, credits_charged = false, updated_at = now() where id = $1`,
      [taskId],
    );
    await client.query("commit");
  } catch (e) {
    await client.query("rollback").catch(() => {});
    client.release();
    const msg = sanitizeErrorMessage(e instanceof Error ? e.message : String(e));
    const status = e instanceof HttpError ? e.status : 400;
    res.status(status).json(fail(req.requestId, msg));
    return;
  }
  client.release();

  let settled = false;
  const safeRelease = async (reason: string) => {
    if (settled) return;
    settled = true;
    await releaseReservationForTask(taskId);
    await pool
      .query(`update nove_studio_tasks set status = 'failed', error_message = $2, updated_at = now() where id = $1`, [
        taskId,
        reason.slice(0, 4000),
      ])
      .catch(() => {});
    await failLegacyLinkedRows(taskId, reason).catch(() => {});
    broadcastStudioWsV1(userId, {
      type: "task_failed",
      taskId,
      taskType: "chat",
      status: "failed",
      credits: { phase: "release", amount: credits },
      timestamp: new Date().toISOString(),
    });
  };

  res.on("close", () => {
    if (!settled) {
      void safeRelease("stream_closed");
    }
  });
  req.on("aborted", () => {
    if (!settled) {
      void safeRelease("request_aborted");
    }
  });

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  (res as Response & { flushHeaders?: () => void }).flushHeaders?.();

  const sse = (obj: unknown) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  sse({ type: "task", taskId });
  broadcastStudioWsV1(userId, {
    type: "task_processing",
    taskId,
    taskType: "chat",
    status: "processing",
    credits: { phase: "freeze", amount: credits },
    timestamp: new Date().toISOString(),
  });

  let full = "";
  try {
    for await (const delta of generateChatCompletionStream(messages, {
      model: body.model,
      temperature: typeof body.temperature === "number" ? body.temperature : 0.7,
      max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : undefined,
    })) {
      full += delta;
      sse({ type: "delta", text: delta });
    }
    const c2 = await pool.connect();
    try {
      await c2.query("begin");
      await captureStudioTaskSuccessTx(c2, taskId, userId, credits, { reply: full, provider: "deepseek" });
      await c2.query("commit");
    } catch (e) {
      await c2.query("rollback").catch(() => {});
      throw e;
    } finally {
      c2.release();
    }
    settled = true;
    try {
      await insertChatHistoryRows(userId, taskId, lastUserContent(messages), full);
    } catch {
      /* non-fatal: credits already captured */
    }
    sse({ type: "done", taskId });
    broadcastStudioWsV1(userId, {
      type: "task_completed",
      taskId,
      taskType: "chat",
      status: "completed",
      credits: { phase: "capture", amount: credits },
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    const msg = sanitizeErrorMessage(e instanceof Error ? e.message : String(e));
    await safeRelease(msg);
    sse({ type: "error", message: msg });
  } finally {
    res.end();
  }
}
