import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

describe("GET /health", () => {
  it("returns unified API shape", async () => {
    const app = createApp();
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      error: null,
    });
    expect(typeof res.body.requestId).toBe("string");
    expect(res.body.requestId.length).toBeGreaterThan(0);
    expect(res.headers["x-request-id"]).toBe(res.body.requestId);
    expect(res.body.data).toMatchObject({ status: "ok" });
  });
});
