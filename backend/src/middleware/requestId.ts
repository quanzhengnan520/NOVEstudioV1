import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";

export const REQUEST_ID_HEADER = "x-request-id";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.get(REQUEST_ID_HEADER);
  const id = incoming && incoming.trim().length > 0 ? incoming.trim() : randomUUID();
  req.requestId = id;
  res.setHeader(REQUEST_ID_HEADER, id);
  next();
}
