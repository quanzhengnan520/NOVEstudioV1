import { Queue } from "bullmq";
import { getRedisConnection } from "./redis.js";

export const STUDIO_QUEUE_NAME = "nove-studio";
export const STUDIO_FAILED_QUEUE_NAME = "nove-studio-failed-jobs";

export type StudioJobData = { taskId: string };

export function createStudioQueue(): Queue<StudioJobData> {
  return new Queue<StudioJobData>(STUDIO_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: false,
    },
  });
}

export function createStudioFailedJobsQueue(): Queue<Record<string, unknown>> {
  return new Queue(STUDIO_FAILED_QUEUE_NAME, {
    connection: getRedisConnection(),
  });
}

export async function enqueueStudioTask(queue: Queue<StudioJobData>, taskId: string): Promise<string> {
  const job = await queue.add("run", { taskId });
  return String(job.id);
}
