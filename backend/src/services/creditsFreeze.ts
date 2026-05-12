import type { PoolClient } from "pg";
import { HttpError } from "../lib/httpError.js";

/** Move amount from spendable balance into frozen (studio task reserve). */
export async function freezeCreditsForTaskTx(
  client: PoolClient,
  userId: string,
  amount: number,
  reason: string,
  meta: Record<string, unknown>,
): Promise<{ balanceAfter: number; frozenAfter: number }> {
  if (amount <= 0) throw new HttpError(400, "Freeze amount must be positive");

  const lock = await client.query<{
    credits_balance: number;
    credits_frozen: number;
    email_verified: boolean;
  }>(
    `
    select credits_balance, credits_frozen, (email_verified_at is not null) as email_verified
    from users where id = $1 for update
    `,
    [userId],
  );
  if (lock.rowCount === 0) throw new HttpError(404, "User not found");
  const row = lock.rows[0];
  if (!row.email_verified) throw new HttpError(403, "EMAIL_NOT_VERIFIED");
  if (row.credits_balance < amount) throw new HttpError(400, "Insufficient credits");

  const upd = await client.query<{ credits_balance: number; credits_frozen: number }>(
    `
    update users
    set credits_balance = credits_balance - $2,
        credits_frozen = credits_frozen + $2,
        updated_at = now()
    where id = $1
    returning credits_balance, credits_frozen
    `,
    [userId, amount],
  );
  const balanceAfter = upd.rows[0].credits_balance;
  const frozenAfter = upd.rows[0].credits_frozen;

  await client.query(
    `
    insert into credit_logs (user_id, delta, balance_after, reason, order_id, meta)
    values ($1, $2, $3, $4, null, $5::jsonb)
    `,
    [userId, -amount, balanceAfter, reason, JSON.stringify({ ...meta, kind: "freeze" })],
  );

  return { balanceAfter, frozenAfter };
}

/** Return frozen credits to spendable balance (task failed / timeout). */
export async function releaseFrozenForTaskTx(
  client: PoolClient,
  userId: string,
  amount: number,
  reason: string,
  meta: Record<string, unknown>,
): Promise<{ balanceAfter: number; frozenAfter: number }> {
  if (amount <= 0) throw new HttpError(400, "Release amount must be positive");

  const upd = await client.query<{ credits_balance: number; credits_frozen: number }>(
    `
    update users
    set credits_balance = credits_balance + $2,
        credits_frozen = credits_frozen - $2,
        updated_at = now()
    where id = $1 and credits_frozen >= $2
    returning credits_balance, credits_frozen
    `,
    [userId, amount],
  );
  if (upd.rowCount === 0) {
    throw new HttpError(400, "Cannot release frozen credits (insufficient frozen balance)");
  }
  const balanceAfter = upd.rows[0].credits_balance;
  const frozenAfter = upd.rows[0].credits_frozen;

  await client.query(
    `
    insert into credit_logs (user_id, delta, balance_after, reason, order_id, meta)
    values ($1, $2, $3, $4, null, $5::jsonb)
    `,
    [userId, amount, balanceAfter, reason, JSON.stringify({ ...meta, kind: "release" })],
  );

  return { balanceAfter, frozenAfter };
}

/** Finalize frozen credits as spent (task succeeded): remove from frozen + order record. */
export async function captureFrozenForTaskTx(
  client: PoolClient,
  userId: string,
  amount: number,
  orderType: string,
  reason: string,
  metadata: Record<string, unknown>,
): Promise<{ orderId: string; balanceAfter: number; frozenAfter: number }> {
  if (amount <= 0) throw new HttpError(400, "Capture amount must be positive");

  const upd = await client.query<{ credits_balance: number; credits_frozen: number }>(
    `
    update users
    set credits_frozen = credits_frozen - $2,
        updated_at = now()
    where id = $1 and credits_frozen >= $2
    returning credits_balance, credits_frozen
    `,
    [userId, amount],
  );
  if (upd.rowCount === 0) {
    throw new HttpError(400, "Cannot capture frozen credits (insufficient frozen balance)");
  }
  const balanceAfter = upd.rows[0].credits_balance;
  const frozenAfter = upd.rows[0].credits_frozen;

  const order = await client.query<{ id: string }>(
    `
    insert into orders (user_id, order_type, status, credits_amount, metadata)
    values ($1, $2, 'completed', $3, $4::jsonb)
    returning id
    `,
    [userId, orderType, amount, JSON.stringify({ ...metadata, capture: true })],
  );
  const orderId = order.rows[0].id;

  await client.query(
    `
    insert into credit_logs (user_id, delta, balance_after, reason, order_id, meta)
    values ($1, 0, $2, $3, $4, $5::jsonb)
    `,
    [userId, balanceAfter, reason, orderId, JSON.stringify({ ...metadata, kind: "capture", frozenAmount: amount })],
  );

  return { orderId, balanceAfter, frozenAfter };
}
