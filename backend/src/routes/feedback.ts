import { Router } from "express";
import { ok } from "../lib/apiResponse.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../lib/httpError.js";
import { getPool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

export const feedbackRouter = Router();

feedbackRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { message, context } = req.body as { message?: unknown; context?: unknown };
    const text = typeof message === "string" ? message.trim() : "";
    if (!text) throw new HttpError(400, "message is required");
    if (text.length > 8000) throw new HttpError(400, "message too long (max 8000 characters)");
    const ctx =
      context && typeof context === "object" && context !== null ? (context as Record<string, unknown>) : {};
    const pool = getPool();
    const r = await pool.query<{ id: string }>(
      `
      insert into nove_feedback (user_id, message, context)
      values ($1, $2, $3::jsonb)
      returning id
      `,
      [req.auth!.sub, text, JSON.stringify(ctx)],
    );
    res.json(ok(req.requestId, { id: r.rows[0].id }));
  }),
);
