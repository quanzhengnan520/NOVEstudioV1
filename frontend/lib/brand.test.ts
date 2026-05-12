import { describe, expect, it } from "vitest";
import { brand } from "./brand";

describe("brand", () => {
  it("exposes NOVE Studio as display name", () => {
    expect(brand.displayName).toBe("NOVE Studio");
    expect(brand.shortName).toBe("NOVE");
  });
});
