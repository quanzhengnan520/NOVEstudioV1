import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { fail } from "../lib/apiResponse.js";
import { HttpError } from "../lib/httpError.js";

export function notFoundHandler(req: Request, res: Response): void {
  const body = fail(req.requestId, `Route not found: ${req.method} ${req.path}`);
  res.status(404).json(body);
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = err instanceof HttpError ? err.status : 500;
  const safeStatus = status >= 400 && status < 600 ? status : 500;

  let clientMessage: string;
  if (err instanceof HttpError) {
    clientMessage = err.message;
  } else if (env.isProd) {
    console.error("[nove-backend] unhandled error", {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      err,
    });
    clientMessage = "Internal server error";
  } else {
    console.error("[nove-backend] unhandled error", {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      err,
    });
    clientMessage = err instanceof Error ? err.message : "Internal server error";
  }

  const body = fail(req.requestId, clientMessage);
  res.status(safeStatus).json(body);
}