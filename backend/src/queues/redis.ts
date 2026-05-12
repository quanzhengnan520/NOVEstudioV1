import { Redis } from "ioredis";
import { env } from "../config/env.js";

let shared: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!shared) {
    shared = new Redis(env.redisUrl, {
      maxRetriesPerRequest: null,
    });
  }
  return shared;
}

export async function closeRedis(): Promise<void> {
  if (shared) {
    await shared.quit();
    shared = null;
  }
}
