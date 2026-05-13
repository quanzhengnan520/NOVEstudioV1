import { describe, expect, it } from "vitest";
import { getMiddlewareRedirectTarget, stripLocalePrefix } from "./middlewareRedirects.js";

describe("middlewareRedirects", () => {
  it("aliases workspace and studio to /video", () => {
    expect(getMiddlewareRedirectTarget("/workspace")).toBe("/video");
    expect(getMiddlewareRedirectTarget("/studio")).toBe("/video");
    expect(getMiddlewareRedirectTarget("/video")).toBeNull();
  });

  it("strips locale prefix without eating /english", () => {
    expect(stripLocalePrefix("/english")).toBeNull();
    expect(getMiddlewareRedirectTarget("/english")).toBeNull();
  });

  it("strips /zh-tw before /zh", () => {
    expect(getMiddlewareRedirectTarget("/zh-tw")).toBe("/");
    expect(getMiddlewareRedirectTarget("/zh-tw/video")).toBe("/video");
    expect(getMiddlewareRedirectTarget("/zh/video")).toBe("/video");
    expect(getMiddlewareRedirectTarget("/en/history")).toBe("/history");
  });
});
