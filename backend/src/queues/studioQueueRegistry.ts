import type { Queue } from "bullmq";
import type { StudioJobData } from "./studioQueue.js";

let studioQueue: Queue<StudioJobData> | null = null;
let studioFailedQueue: Queue | null = null;

export function registerStudioQueues(main: Queue<StudioJobData>, failed: Queue): void {
  studioQueue = main;
  studioFailedQueue = failed;
}

export function getRegisteredStudioQueue(): Queue<StudioJobData> | null {
  return studioQueue;
}

export function getRegisteredStudioFailedQueue(): Queue | null {
  return studioFailedQueue;
}
