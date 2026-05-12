import { Router } from "express";
import { env } from "../config/env.js";
import { fail, ok } from "../lib/apiResponse.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../lib/httpError.js";
import { getPool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { costForSpend, grantCredits, spendCreditsTx, type SpendKind } from "../services/creditsService.js";

export const creditsRouter = Router();

creditsRouter.post(
  "/recharge-mock",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!env.noveMockRechargeEnabled) {
      throw new HttpError(403, "Mock recharge is disabled");
    }
    const body = req.body as { amount?: unknown };
    const amount = typeof body.amount === "number" && Number.isFinite(body.amount) ? Math.floor(body.amount) : NaN;
    if (!Number.isFinite(amount) || amount < 1 || amount > 50_000) {
      throw new HttpError(400, "amount must be an integer between 1 and 50000");
    }
    const userId = req.auth!.sub;
    const pool = getPool();
    const client = await pool.connect();
    let paymentId: string;
    try {
      await client.query("begin");
      const pay = await client.query<{ id: string }>(
        `
        insert into payments (user_id, amount, provider, status)
        values ($1, $2, 'mock', 'pending')
        returning id
        `,
        [userId, amount],
      );
      paymentId = pay.rows[0].id;
      const balanceAfter = await grantCredits(client, userId, amount, "mock_recharge", { paymentId }, null);
      await client.query(
        `update payments set status = 'success', provider_order_id = $2, updated_at = now() where id = $1`,
        [paymentId, String(paymentId)],
      );
      await client.query("commit");
      res.json(ok(req.requestId, { success: true, newBalance: balanceAfter, paymentId }));
    } catch (e) {
      await client.query("rollback").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  }),
);

creditsRouter.get(
  "/balance",
  requireAuth,
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const r = await pool.query<{ credits_balance: number }>(
      `select credits_balance from users where id = $1`,
      [req.auth!.sub],
    );
    res.json(ok(req.requestId, { balance: r.rows[0]?.credits_balance ?? 0 }));
  }),
);

creditsRouter.get(
  "/logs",
  requireAuth,
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
    const rows = await pool.query(
      `
      select id, delta, balance_after, reason, order_id, meta, created_at
      from credit_logs
      where user_id = $1
      order by created_at desc
      limit $2
      `,
      [req.auth!.sub, limit],
    );
    res.json(ok(req.requestId, { items: rows.rows }));
  }),
);

creditsRouter.post(
  "/consume",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!env.noveCreditsConsumeApiEnabled) {
      throw new HttpError(403, "Credits consume API is disabled");
    }
    const { kind, videoTier, videoAmount } = req.body as {
      kind?: SpendKind;
      videoTier?: number;
      videoAmount?: number;
    };
    if (!kind) {
      res.status(400).json(fail(req.requestId, "kind is required"));
      return;
    }
    const amount = costForSpend(kind, { videoTier, videoAmount });
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query("begin");
      const spent = await spendCreditsTx(client, req.auth!.sub, amount, `consume_${kind}`, `consume_${kind}`, {
        kind,
        videoTier,
        videoAmount,
      });
      await client.query("commit");
      res.json(ok(req.requestId, { orderId: spent.orderId, balanceAfter: spent.balanceAfter, charged: amount }));
    } catch (e) {
      await client.query("rollback");
      throw e;
    } finally {
      client.release();
    }
  }),
);
