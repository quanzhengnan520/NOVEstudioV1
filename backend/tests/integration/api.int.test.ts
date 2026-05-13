import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";

describe("integration: public API", () => {
  it("GET /v1/ping", async () => {
    const app = createApp();
    const res = await request(app).get("/v1/ping");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.message).toBe("pong");
    expect(typeof res.body.requestId).toBe("string");
  });

  it("GET unknown /v1 route returns 404 envelope", async () => {
    const app = createApp();
    const res = await request(app).get("/v1/__no_such_route__");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/not found/i);
  });

  it("GET /v1/credits/balance without auth returns 401", async () => {
    const app = createApp();
    const res = await request(app).get("/v1/credits/balance");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/unauthorized/i);
  });
});
