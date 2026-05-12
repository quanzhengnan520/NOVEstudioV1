import { describe, expect, it } from "vitest";
import { fail, ok } from "./apiResponse.js";

describe("apiResponse", () => {
  it("builds success envelope", () => {
    expect(ok("rid-1", { a: 1 })).toEqual({
      success: true,
      data: { a: 1 },
      error: null,
      requestId: "rid-1",
    });
  });

  it("builds failure envelope", () => {
    expect(fail("rid-2", "nope")).toEqual({
      success: false,
      data: null,
      error: "nope",
      requestId: "rid-2",
    });
  });
});
