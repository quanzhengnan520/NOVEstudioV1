import type { Queue } from "bullmq";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { attachAuthUser } from "./middleware/auth.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { adminRouter } from "./routes/admin.js";
import { apiRouter } from "./routes/api.js";
import { authRouter } from "./routes/auth.js";
import { creditsRouter } from "./routes/credits.js";
import { feedbackRouter } from "./routes/feedback.js";
import { healthRouter } from "./routes/health.js";
import { createStudioRouter } from "./routes/studio.js";
import { createTasksRouter } from "./routes/tasks.js";
import type { StudioJobData } from "./queues/studioQueue.js";

export type CreateAppOptions = {
  studioQueue?: Queue<StudioJobData>;
};

export function createApp(opts: CreateAppOptions = {}) {
  const app = express();
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (env.frontendOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: `${Math.max(0.25, env.requestJsonBodyLimitMb)}mb` }));
  app.use(requestIdMiddleware);
  app.use(attachAuthUser);

  app.use("/health", healthRouter);
  app.use("/", apiRouter);
  app.use("/v1/auth", authRouter);
  app.use("/v1/credits", creditsRouter);
  app.use("/v1/tasks", createTasksRouter(opts.studioQueue ?? null));
  if (opts.studioQueue) {
    app.use("/v1/studio", createStudioRouter(opts.studioQueue));
  }
  app.use("/v1/feedback", feedbackRouter);
  app.use("/v1/admin", adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
