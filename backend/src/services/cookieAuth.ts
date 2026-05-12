import type { Response } from "express";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "../config/cookies.js";
import { env } from "../config/env.js";

const sameSite: "lax" | "strict" | "none" = env.isProd ? "lax" : "lax";

export function setAuthCookies(res: Response, accessToken: string, refreshRaw: string): void {
  const base = {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite,
    path: "/",
  };
  res.cookie(ACCESS_COOKIE, accessToken, { ...base, maxAge: env.accessTokenTtlSec * 1000 });
  res.cookie(REFRESH_COOKIE, refreshRaw, { ...base, maxAge: env.refreshTokenTtlSec * 1000 });
}

export function clearAuthCookies(res: Response): void {
  const base = { httpOnly: true, secure: env.cookieSecure, sameSite, path: "/" };
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
}
