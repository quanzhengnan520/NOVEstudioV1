import { createApp } from "./app.js";
import { assertAuthEnvForProd, env } from "./config/env.js";
import { sanitizeErrorMessage } from "./providers/sanitize.js";
import { createStudioFailedJobsQueue, createStudioQueue } from "./queues/studioQueue.js";
import { registerStudioQueues } from "./queues/studioQueueRegistry.js";
import { startStudioWorker } from "./queues/studioWorker.js";
import { closeRedis } from "./queues/redis.js";
import { runStudioTaskTimeouts, runVideoRemotePollBatch } from "./queues/videoMaintenance.js";
import { attachStudioWebSocket, closeStudioWebSocket } from "./ws/studioWs.js";

const studioQueue = createStudioQueue();
const studioFailedQueue = createStudioFailedJobsQueue();
registerStudioQueues(studioQueue, studioFailedQueue);
const studioWorker = startStudioWorker(studioFailedQueue);

const videoPollTimer = setInterval(() => {
  void runVideoRemotePollBatch().catch((e) => console.error("[nove-studio] video remote poll", e));
}, Math.max(3000, env.studioVideoPollIntervalMs));

const taskTimeoutTimer = setInterval(() => {
  void runStudioTaskTimeouts().catch((e) => console.error("[nove-studio] task timeout sweep", e));
}, Math.max(10_000, env.studioTaskTimeoutSweepIntervalMs));

const app = createApp({ studioQueue });

studioWorker.on("failed", (job, err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("[nove-studio-worker] job failed", job?.id, sanitizeErrorMessage(msg));
});

const httpServer = app.listen(env.port, () => {
  assertAuthEnvForProd();
  console.log(`[nove-backend] NOVE Studio API listening on :${env.port}`);
});

attachStudioWebSocket(httpServer);

async function shutdown(signal: string): Promise<void> {
  console.log(`[nove-backend] ${signal}, shutting down…`);
  clearInterval(videoPollTimer);
  clearInterval(taskTimeoutTimer);
  await closeStudioWebSocket(httpServer);
  await new Promise<void>((resolve, reject) => {
    httpServer.close((err) => (err ? reject(err) : resolve()));
  });
  await studioWorker.close();
  await studioQueue.close();
  await studioFailedQueue.close();
  await closeRedis();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
