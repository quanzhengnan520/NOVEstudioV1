import type { Queue } from "bullmq";
import { Router } from "express";
import { ok } from "../lib/apiResponse.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../lib/httpError.js";
import { enqueueStudioTask, type StudioJobData } from "../queues/studioQueue.js";
import { requireAuth } from "../middleware/auth.js";
import {
  assertStudioTaskType,
  getStudioTaskForUser,
  insertQueuedStudioTask,
  listStudioTasksForUser,
  setStudioTaskBullJobId,
} from "../services/studioTaskService.js";
import { attachStudioRealtimeRoutes } from "./studioRealtime.js";
import { assertStudioTaskRateLimit } from "../services/studioRateLimit.js";
import { broadcastStudioWsV1 } from "../ws/studioWs.js";

export function createStudioRouter(studioQueue: Queue<StudioJobData>): Router {
  const studioRouter = Router();
  attachStudioRealtimeRoutes(studioRouter);

  studioRouter.post(
    "/tasks",
    requireAuth,
    asyncHandler(async (req, res) => {
      const body = req.body as { taskType?: unknown; payload?: unknown };
      const taskType = assertStudioTaskType(body.taskType);
      const payload =
        body.payload && typeof body.payload === "object" && body.payload !== null
          ? (body.payload as Record<string, unknown>)
          : {};
      await assertStudioTaskRateLimit(req.auth!.sub, Boolean(req.auth!.adm), taskType);
      const row = await insertQueuedStudioTask(req.auth!.sub, taskType, payload);
      const jobId = await enqueueStudioTask(studioQueue, row.id);
      await setStudioTaskBullJobId(row.id, jobId);
      broadcastStudioWsV1(req.auth!.sub, {
        type: "task_queued",
        taskId: row.id,
        taskType: row.task_type,
        status: "queued",
        timestamp: new Date().toISOString(),
      });
      res.json(
        ok(req.requestId, {
          task: {
            id: row.id,
            taskType: row.task_type,
            status: row.status,
            bullmqJobId: jobId,
            creditsAmount: row.credits_amount,
            creditsReserved: row.credits_reserved,
            remoteTaskId: row.remote_task_id,
            processingDeadline: row.processing_deadline,
            payload: row.payload,
            createdAt: row.created_at,
          },
        }),
      );
    }),
  );

  studioRouter.get(
    "/tasks/:id",
    requireAuth,
    asyncHandler(async (req, res) => {
      const task = await getStudioTaskForUser(req.auth!.sub, req.params.id);
      if (!task) throw new HttpError(404, "Task not found");
      res.json(ok(req.requestId, { task }));
    }),
  );

  studioRouter.get(
    "/tasks",
    requireAuth,
    asyncHandler(async (req, res) => {
      const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 30)));
      const offset = Math.max(0, Number(req.query.offset ?? 0));
      const items = await listStudioTasksForUser(req.auth!.sub, { limit, offset });
      res.json(ok(req.requestId, { items }));
    }),
  );

  studioRouter.get(
    "/history",
    requireAuth,
    asyncHandler(async (req, res) => {
      const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)));
      const offset = Math.max(0, Number(req.query.offset ?? 0));
      const items = await listStudioTasksForUser(req.auth!.sub, { limit, offset });
      res.json(ok(req.requestId, { items }));
    }),
  );

  return studioRouter;
}
