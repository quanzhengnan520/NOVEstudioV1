import type { IncomingMessage } from "node:http";
import { ACCESS_COOKIE } from "../config/cookies.js";
import { verifyAccessToken } from "../lib/jwt.js";

/** Read JWT from WebSocket upgrade: `?access_token=` or HttpOnly cookie (browser same-origin only). */
export function tryUserIdFromUpgradeRequest(req: IncomingMessage): string | null {
  try {
    const host = req.headers.host ?? "127.0.0.1";
    const rawUrl = req.url ?? "/";
    const u = new URL(rawUrl, `http://${host}`);
    const qp = u.searchParams.get("access_token");
    if (qp) {
      return verifyAccessToken(qp).sub;
    }
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;
    for (const part of cookieHeader.split(";")) {
      const s = part.trim();
      if (!s.startsWith(`${ACCESS_COOKIE}=`)) continue;
      const val = decodeURIComponent(s.slice(ACCESS_COOKIE.length + 1).trim());
      return verifyAccessToken(val).sub;
    }
    return null;
  } catch {
    return null;
  }
}
