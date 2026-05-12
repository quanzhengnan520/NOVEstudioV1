import type { PoolClient } from "pg";
import { CREDIT_COSTS, videoCreditsForAmount, videoCreditsForTier } from "../config/credits.js";
import { HttpError } from "../lib/httpError.js";

export type SpendKind = "chat" | "prompt_enhance" | "image" | "video";

export function costForSpend(kind: SpendKind, opts?: { videoTier?: number; videoAmount?: number }): number {
  if (kind === "chat") return CREDIT_COSTS.chat;
  if (kind === "prompt_enhance") return CREDIT_COSTS.prompt_enhance;
  if (kind === "image") return CREDIT_COSTS.image;
  if (kind === "video") {
    if (typeof opts?.videoTier === "number") return videoCreditsForTier(opts.videoTier);
    if (typeof opts?.videoAmount === "number") return videoCreditsForAmount(opts.videoAmount);
    return CREDIT_COSTS.video.min;
  }
  throw new HttpError(400, "Unknown spend kind");
}

export async function grantCredits(
  client: PoolClient,
  userId: string,
  delta: number,
  reason: string,
  meta: Record<string, unknown> = {},
  orderId: string | null = null,
): Promise<number> {
  if (delta === 0) {
    const b = await client.query<{ credits_balance: number }>(
      `select credits_balance from users where id = $1 for update`,
      [userId],
    );
    if (b.rowCount === 0) throw new HttpError(404, "User not found");
    return b.rows[0].credits_balance;
  }

  const updated = await client.query<{ credits_balance: number }>(
    `
    update users
    set credits_balance = credits_balance + $2,
        updated_at = now()
    where id = $1
    returning credits_balance
    `,
    [userId, delta],
  );
  if (updated.rowCount === 0) throw new HttpError(404, "User not found");
  const balanceAfter = updated.rows[0].credits_balance;
  if (balanceAfter < 0) {
    throw new HttpError(400, "Credits balance cannot be negative");
  }

  await client.query(
    `
    insert into credit_logs (user_id, delta, balance_after, reason, order_id, meta)
    values ($1, $2, $3, $4, $5, $6::jsonb)
    `,
    [userId, delta, balanceAfter, reason, orderId, JSON.stringify(meta)],
  );

  return balanceAfter;
}

export async function spendCreditsTx(
  client: PoolClient,
  userId: string,
  amount: number,
  orderType: string,
  reason: string,
  metadata: Record<string, unknown> = {},
): Promise<{ orderId: string; balanceAfter: number }> {
  if (amount <= 0) throw new HttpError(400, "Spend amount must be positive");

  const lock = await client.query<{ credits_balance: number; email_verified: boolean }>(
    `
    select credits_balance, (email_verified_at is not null) as email_verified
    from users
    where id = $1
    for update
    `,
    [userId],
  );
  if (lock.rowCount === 0) throw new HttpError(404, "User not found");
  const row = lock.rows[0];
  if (!row.email_verified) {
    throw new HttpError(403, "EMAIL_NOT_VERIFIED");
  }
  const balance = row.credits_balance;
  if (balance < amount) {
    throw new HttpError(400, "Insufficient credits");
  }

  const order = await client.query<{ id: string }>(
    `
    insert into orders (user_id, order_type, status, credits_amount, metadata)
    values ($1, $2, 'completed', $3, $4::jsonb)
    returning id
    `,
    [userId, orderType, amount, JSON.stringify(metadata)],
  );
  const orderId = order.rows[0].id;

  const updated = await client.query<{ credits_balance: number }>(
    `
    update users
    set credits_balance = credits_balance - $2,
        updated_at = now()
    where id = $1
    returning credits_balance
    `,
    [userId, amount],
  );
  const balanceAfter = updated.rows[0].credits_balance;

  await client.query(
    `
    insert into credit_logs (user_id, delta, balance_after, reason, order_id, meta)
    values ($1, $2, $3, $4, $5, $6::jsonb)
    `,
    [userId, -amount, balanceAfter, reason, orderId, JSON.stringify(metadata)],
  );

  return { orderId, balanceAfter };
}
