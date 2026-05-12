import { getPool } from "../db/pool.js";
import { env } from "../config/env.js";

/** Resolve Ark API keys in order: DB `provider_fallbacks` for `video`, then env keys. */
export async function getVideoArkApiKeysOrdered(): Promise<string[]> {
  const pool = getPool();
  let logical: string[] = ["volcengine-ark", "ark-fallback"];
  try {
    const r = await pool.query<{ provider_order: string[] }>(
      `select provider_order from provider_fallbacks where task_type = 'video' order by created_at desc limit 1`,
    );
    if (r.rows[0]?.provider_order?.length) logical = r.rows[0].provider_order;
  } catch {
    /* table missing before migrate */
  }
  const keys: string[] = [];
  for (const name of logical) {
    const n = String(name).toLowerCase().trim();
    if (n === "volcengine-ark" && env.volcengineArkApiKey) keys.push(env.volcengineArkApiKey);
    else if ((n === "ark-fallback" || n === "volcengine-ark-fallback") && env.volcengineArkFallbackApiKey) {
      keys.push(env.volcengineArkFallbackApiKey);
    }
  }
  const uniq = [...new Set(keys)];
  if (uniq.length > 0) return uniq;
  if (env.volcengineArkApiKey) return [env.volcengineArkApiKey];
  if (env.volcengineArkFallbackApiKey) return [env.volcengineArkFallbackApiKey];
  return [];
}
