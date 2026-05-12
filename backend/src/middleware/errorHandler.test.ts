import type { NextFunction, Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "../lib/httpError.js";

const { mockEnv } = vi.hoisted(() => ({ mockEnv: { isProd: false } }));

vi.mock("../config/env.js", () => ({ env: mockEnv }));

import { errorHandler } from "./errorHandler.js";

function mockRes() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { status, json, raw: { status, json } as unknown as Response };
}

function mockReq(partial: Partial<Request> = {}): Request {
  return { requestId: "test-req", method: "GET", path: "/x", ...partial } as Request;
}

describe("errorHandler", () => {
  beforeEach(() => {
    mockEnv.isProd = false;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("passes HttpError message in production", () => {
    mockEnv.isProd = true;
    const res = mockRes();
    errorHandler(new HttpError(400, "Bad input"), mockReq(), res.raw, vi.fn() as NextFunction);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: "Bad input", requestId: "test-req" }),
    );
  });

  it("hides non-HttpError details in production", () => {
    mockEnv.isProd = true;
    const res = mockRes();
    errorHandler(new Error("secret stack trace"), mockReq(), res.raw, vi.fn() as NextFunction);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: "Internal server error", requestId: "test-req" }),
    );
  });

  it("exposes non-HttpError message in non-production", () => {
    mockEnv.isProd = false;
    const res = mockRes();
    errorHandler(new Error("debug visible"), mockReq(), res.raw, vi.fn() as NextFunction);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: "debug visible", requestId: "test-req" }),
    );
  });
});
