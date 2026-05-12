import { Router } from "express";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "../config/cookies.js";
import { getPool } from "../db/pool.js";
import { fail, ok } from "../lib/apiResponse.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { getClientIp } from "../lib/clientIp.js";
import { verifyAccessToken } from "../lib/jwt.js";
import { requireAuth } from "../middleware/auth.js";
import {
  findUserIdByActiveRefresh,
  loginUser,
  refreshSession,
  registerUser,
  resendVerificationEmail,
  revokeAllRefreshTokensForUser,
  verifyEmailWithToken,
} from "../services/authService.js";
import { clearAuthCookies, setAuthCookies } from "../services/cookieAuth.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password, captchaToken } = req.body as {
      email?: string;
      password?: string;
      captchaToken?: string;
    };
    if (!email || !password) {
      res.status(400).json(fail(req.requestId, "email and password are required"));
      return;
    }
    const session = await registerUser(email, password, {
      captchaToken,
      ip: getClientIp(req),
    });
    setAuthCookies(res, session.accessToken, session.refreshRaw);
    res.json(
      ok(req.requestId, {
        user: session.user,
        emailVerificationSent: session.emailVerificationSent,
      }),
    );
  }),
);

authRouter.post(
  "/verify-email",
  asyncHandler(async (req, res) => {
    const { token } = req.body as { token?: string };
    if (!token || typeof token !== "string") {
      res.status(400).json(fail(req.requestId, "token is required"));
      return;
    }
    await verifyEmailWithToken(token);
    res.json(ok(req.requestId, { verified: true }));
  }),
);

authRouter.post(
  "/resend-verification",
  requireAuth,
  asyncHandler(async (req, res) => {
    await resendVerificationEmail(req.auth!.sub);
    res.json(ok(req.requestId, { sent: true }));
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json(fail(req.requestId, "email and password are required"));
      return;
    }
    const session = await loginUser(email, password);
    setAuthCookies(res, session.accessToken, session.refreshRaw);
    res.json(ok(req.requestId, { user: session.user }));
  }),
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const refreshRaw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const session = await refreshSession(refreshRaw);
    setAuthCookies(res, session.accessToken, session.refreshRaw);
    res.json(ok(req.requestId, { user: session.user }));
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    let userId: string | null = null;
    const access = req.cookies?.[ACCESS_COOKIE] as string | undefined;
    if (access) {
      try {
        userId = verifyAccessToken(access).sub;
      } catch {
        userId = null;
      }
    }
    if (!userId) {
      const refreshRaw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
      userId = await findUserIdByActiveRefresh(refreshRaw);
    }
    if (userId) {
      await revokeAllRefreshTokensForUser(userId);
    }
    clearAuthCookies(res);
    res.json(ok(req.requestId, { loggedOut: true }));
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = req.auth!;
    const pool = getPool();
    const r = await pool.query<{ credits_balance: number; email_verified: boolean }>(
      `select credits_balance, (email_verified_at is not null) as email_verified from users where id = $1`,
      [auth.sub],
    );
    res.json(
      ok(req.requestId, {
        id: auth.sub,
        email: auth.email,
        isAdmin: auth.adm,
        creditsBalance: r.rows[0]?.credits_balance ?? 0,
        emailVerified: r.rows[0]?.email_verified ?? false,
      }),
    );
  }),
);
