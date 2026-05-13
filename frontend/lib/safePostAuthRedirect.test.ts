import { describe, expect, it } from "vitest";
import { safePostAuthRedirect } from "./safePostAuthRedirect";

describe("safePostAuthRedirect", () => {
  it("allows same-origin paths", () => {
    expect(safePostAuthRedirect("/feedback")).toBe("/feedback");
    expect(safePostAuthRedirect("/credits")).toBe("/credits");
  });

  it("rejects open redirects and falls back to default", () => {
    expect(safePostAuthRedirect("//evil.com")).toBe("/credits");
    expect(safePostAuthRedirect("https://evil.com")).toBe("/credits");
    expect(safePostAuthRedirect(null)).toBe("/credits");
    expect(safePostAuthRedirect("")).toBe("/credits");
    expect(safePostAuthRedirect("relative")).toBe("/credits");
  });

  it("respects custom default", () => {
    expect(safePostAuthRedirect(null, "/")).toBe("/");
  });
});
