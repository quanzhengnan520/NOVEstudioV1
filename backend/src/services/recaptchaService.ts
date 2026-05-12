import { env } from "../config/env.js";
import { HttpError } from "../lib/httpError.js";

type SiteVerifyResponse = {
  success: boolean;
  score?: number;
  action?: string;
  "error-codes"?: string[];
};

export async function verifyRecaptchaToken(token: string | undefined, remoteIp: string): Promise<void> {
  if (!env.recaptchaSecretKey) {
    if (env.isProd) {
      throw new HttpError(500, "RECAPTCHA_FAILED");
    }
    console.warn("[recaptcha] RECAPTCHA_SECRET_KEY not set; skipping verification (development only)");
    return;
  }
  if (!token || typeof token !== "string" || token.length < 10) {
    throw new HttpError(400, "RECAPTCHA_FAILED");
  }

  const body = new URLSearchParams();
  body.set("secret", env.recaptchaSecretKey);
  body.set("response", token);
  if (remoteIp && remoteIp !== "unknown") {
    body.set("remoteip", remoteIp);
  }

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new HttpError(502, "RECAPTCHA_FAILED");
  }

  const data = (await res.json()) as SiteVerifyResponse;
  if (!data.success) {
    throw new HttpError(400, "RECAPTCHA_FAILED");
  }

  if (typeof data.score === "number") {
    if (data.score < env.recaptchaMinScore) {
      throw new HttpError(400, "RECAPTCHA_FAILED");
    }
  }
}
