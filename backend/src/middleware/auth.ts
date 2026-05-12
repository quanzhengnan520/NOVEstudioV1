import type { NextFunction, Request, Response } from "express";
import { ACCESS_COOKIE } from "../config/cookies.js";
import { HttpError } from "../lib/httpError.js";
import { verifyAccessToken, type AccessClaims } from "../lib/jwt.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AccessClaims | null;
    }
  }
}

export function attachAuthUser(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
  if (!token) {
    req.auth = null;
    next();
    return;
  }
  try {
    req.auth = verifyAccessToken(token);
  } catch {
    req.auth = null;
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth) {
    next(new HttpError(401, "Unauthorized"));
    return;
  }
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth?.adm) {
    next(new HttpError(403, "Admin only"));
    return;
  }
  next();
}
