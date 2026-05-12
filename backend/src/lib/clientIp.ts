import type { Request } from "express";

export function getClientIp(req: Request): string {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  if (typeof req.socket?.remoteAddress === "string" && req.socket.remoteAddress.length > 0) {
    return req.socket.remoteAddress.replace(/^::ffff:/, "");
  }
  return "unknown";
}
