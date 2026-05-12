import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";

describe("integration: health", () => {
  it("GET /health", async () => {
    const app = createApp();
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.status).toBe("ok");
    expect(res.body.data?.service).toBe("nove-backend");
  });
});
