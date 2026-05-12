import type { PoolClient } from "pg";
import { env } from "../config/env.js";
import { HttpError } from "../lib/httpError.js";

export async function assertRegistrationIpAllowed(client: PoolClient, ip: string): Promise<void> {
  if (!ip || ip === "unknown") {
    return;
  }
  const r = await client.query<{ c: string }>(
    `
    select count(*)::text as c
    from registration_ip_events
    where ip = $1
      and created_at > now() - interval '24 hours'
    `,
    [ip],
  );
  const count = Number(r.rows[0]?.c ?? 0);
  if (count >= env.registerMaxPerIp24h) {
    throw new HttpError(429, "REGISTRATION_IP_LIMIT");
  }
}

export async function recordRegistrationIp(client: PoolClient, ip: string): Promise<void> {
  if (!ip || ip === "unknown") {
    return;
  }
  await client.query(`insert into registration_ip_events (ip) values ($1)`, [ip]);
}
