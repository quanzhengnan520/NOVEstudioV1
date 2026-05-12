import type { Queue } from "bullmq";
import { Router } from "express";
import { ok } from "../lib/apiResponse.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../lib/httpError.js";
import { requireAuth } from "../middleware/auth.js";
import { createPreFrozenStudioTaskAndEnqueue } from "../services/task/TaskCreationService.js";
import type { StudioJobData } from "../queues/studioQueue.js";

/**
 * @deprecated Legacy task endpoints. Internally create `nove_studio_tasks` + BullMQ (same as POST /v1/studio/tasks).
 * Response shape preserved for backward compatibility (`taskId`, `orderId`, `balanceAfter`, `creditsCharged`).
 */
export function createTasksRouter(studioQueue: Queue<StudioJobData> | null): Router {
  const tasksRouter = Router();

  tasksRouter.post(
    "/image",
    requireAuth,
    asyncHandler(async (req, res) => {
      if (!studioQueue) {
        throw new HttpError(503, "Studio worker queue is not configured");
      }
      const { prompt } = req.body as { prompt?: string };
      const text = (prompt ?? "").trim() || "image job";
      const { taskId, balanceAfter, creditsAmount } = await createPreFrozenStudioTaskAndEnqueue({
        queue: studioQueue,
        userId: req.auth!.sub,
        taskType: "image",
        payload: { prompt: text, engine: "dashscope" },
      });
      res.setHeader("Deprecation", "true");
      res.setHeader("Link", '</v1/studio/tasks>; rel="successor-version"');
      res.json(
        ok(req.requestId, {
          taskId,
          orderId: null,
          balanceAfter,
          creditsCharged: creditsAmount,
        }),
      );
    }),
  );

  tasksRouter.post(
    "/video",
    requireAuth,
    asyncHandler(async (req, res) => {
      if (!studioQueue) {
        throw new HttpError(503, "Studio worker queue is not configured");
      }
      const { prompt, tier, amount } = req.body as { prompt?: string; tier?: number; amount?: number };
      const text = (prompt ?? "").trim() || "video job";
      const { taskId, balanceAfter, creditsAmount } = await createPreFrozenStudioTaskAndEnqueue({
        queue: studioQueue,
        userId: req.auth!.sub,
        taskType: "video",
        payload: {
          prompt: text,
          tier: typeof tier === "number" ? tier : undefined,
          amount: typeof amount === "number" ? amount : undefined,
          vendor: "stub",
        },
      });
      res.setHeader("Deprecation", "true");
      res.setHeader("Link", '</v1/studio/tasks>; rel="successor-version"');
      res.json(
        ok(req.requestId, {
          taskId,
          orderId: null,
          balanceAfter,
          creditsCharged: creditsAmount,
        }),
      );
    }),
  );

  return tasksRouter;
}
