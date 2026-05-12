import { getRedisConnection } from "../queues/redis.js";
import { env } from "../config/env.js";
import { HttpError } from "../lib/httpError.js";
import type { StudioTaskType } from "../providers/types.js";

function hourBucket(): string {
  return String(Math.floor(Date.now() / 3600000));
}
function dayBucket(): string {
  return String(Math.floor(Date.now() / 86400000));
}
function minuteBucket(): string {
  return String(Math.floor(Date.now() / 60000));
}

export async function assertStudioTaskRateLimit(
  userId: string,
  isAdmin: boolean,
  taskType: StudioTaskType,
): Promise<void> {
  if (isAdmin) return;
  const r = getRedisConnection();
  if (taskType === "video") {
    const hk = `nove:rl:video:h:${userId}:${hourBucket()}`;
    const dk = `nove:rl:video:d:${userId}:${dayBucket()}`;
    const hc = await r.incr(hk);
    if (hc === 1) await r.expire(hk, 4000);
    if (hc > env.studioVideoRateLimitPerHour) {
      throw new HttpError(429, "Video rate limit: too many requests this hour");
    }
    const dc = await r.incr(dk);
    if (dc === 1) await r.expire(dk, 100000);
    if (dc > env.studioVideoRateLimitPerDay) {
      throw new HttpError(429, "Video rate limit: daily cap reached");
    }
    return;
  }
  if (taskType === "image") {
    const mk = `nove:rl:image:m:${userId}:${minuteBucket()}`;
    const c = await r.incr(mk);
    if (c === 1) await r.expire(mk, 120);
    if (c > env.studioImageRateLimitPerMinute) {
      throw new HttpError(429, "Image rate limit: too many requests this minute");
    }
  }
}
