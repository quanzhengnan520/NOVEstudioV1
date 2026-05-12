import { getRedisConnection } from "../queues/redis.js";
import { env } from "../config/env.js";
import { getPool } from "../db/pool.js";
import { sanitizeErrorMessage } from "../providers/sanitize.js";

const FAIL_KEY = (p: string) => `nove:circuit:${p}:fails`;
const OPEN_KEY = (p: string) => `nove:circuit:${p}:open`;

export type CircuitSnapshot = {
  failCount: number;
  circuitOpen: boolean;
  circuitOpenTtlSec: number | null;
};

export async function getCircuitSnapshot(provider: string): Promise<CircuitSnapshot> {
  const r = getRedisConnection();
  const failsRaw = await r.get(FAIL_KEY(provider));
  const failCount = Math.max(0, Number(failsRaw ?? 0));
  const open = (await r.exists(OPEN_KEY(provider))) === 1;
  const ttl = open ? await r.ttl(OPEN_KEY(provider)) : -1;
  return {
    failCount,
    circuitOpen: open,
    circuitOpenTtlSec: ttl > 0 ? ttl : null,
  };
}

export async function isProviderCircuitOpen(provider: string): Promise<boolean> {
  const r = getRedisConnection();
  return (await r.exists(OPEN_KEY(provider))) === 1;
}

export async function recordProviderFailure(provider: string, err?: unknown): Promise<void> {
  const r = getRedisConnection();
  const n = await r.incr(FAIL_KEY(provider));
  if (n === 1) await r.expire(FAIL_KEY(provider), 120);
  const msg = err instanceof Error ? sanitizeErrorMessage(err.message) : sanitizeErrorMessage(String(err ?? ""));
  if (n >= env.providerCircuitFailureThreshold) {
    await r.set(
      OPEN_KEY(provider),
      "1",
      "EX",
      Math.max(60, Math.floor(env.providerCircuitCooldownMs / 1000)),
    );
    await r.del(FAIL_KEY(provider));
  }
  void persistMetricFailure(provider, msg);
}

export async function recordProviderSuccess(provider: string, latencyMs: number): Promise<void> {
  const r = getRedisConnection();
  await r.del(FAIL_KEY(provider));
  await r.del(OPEN_KEY(provider));
  void persistMetricSuccess(provider, latencyMs);
}

async function persistMetricFailure(provider: string, msg: string): Promise<void> {
  try {
    const pool = getPool();
    await pool.query(
      `
      insert into nove_provider_metrics (provider_name, fail_streak, last_failure_at, last_failure_message, updated_at)
      values ($1, 1, now(), $2, now())
      on conflict (provider_name) do update set
        fail_streak = nove_provider_metrics.fail_streak + 1,
        last_failure_at = now(),
        last_failure_message = excluded.last_failure_message,
        updated_at = now()
      `,
      [provider, msg.slice(0, 2000)],
    );
  } catch {
    /* ignore */
  }
}

async function persistMetricSuccess(provider: string, latencyMs: number): Promise<void> {
  try {
    const pool = getPool();
    const ms = Math.max(0, Math.floor(latencyMs));
    await pool.query(
      `
      insert into nove_provider_metrics (provider_name, fail_streak, total_requests, total_latency_ms, updated_at)
      values ($1, 0, 1, $2, now())
      on conflict (provider_name) do update set
        fail_streak = 0,
        total_requests = nove_provider_metrics.total_requests + 1,
        total_latency_ms = nove_provider_metrics.total_latency_ms + $2,
        updated_at = now()
      `,
      [provider, ms],
    );
  } catch {
    /* ignore */
  }
}
