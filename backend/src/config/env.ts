import dotenv from "dotenv";
import { developmentEnvDefaults } from "./env/development.js";
import { productionEnvDefaults } from "./env/production.js";

dotenv.config();

const port = Number(process.env.PORT ?? 4000);
const nodeEnv = process.env.NODE_ENV ?? "development";
const isProd = nodeEnv === "production";
const envDefaults = isProd ? productionEnvDefaults : developmentEnvDefaults;

export const env = {
  nodeEnv,
  isProd,
  port,
  databaseUrl: process.env.DATABASE_URL ?? "",
  redisUrl: process.env.REDIS_URL ?? "redis://127.0.0.1:16379",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-change-me",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-me",
  accessTokenTtlSec: Number(process.env.ACCESS_TOKEN_TTL_SEC ?? 900),
  refreshTokenTtlSec: Number(process.env.REFRESH_TOKEN_TTL_SEC ?? 60 * 60 * 24 * 14),
  cookieSecure: process.env.COOKIE_SECURE === "true" || (process.env.COOKIE_SECURE !== "false" && isProd),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
  frontendOrigins: [
    ...(process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    ...(process.env.FRONTEND_URL ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ].filter((v, i, a) => a.indexOf(v) === i),
  initialSignupCredits: Number(process.env.INITIAL_SIGNUP_CREDITS ?? 40),
  bootstrapAdminEmail: (process.env.BOOTSTRAP_ADMIN_EMAIL ?? "").toLowerCase().trim(),
  recaptchaSecretKey: (process.env.RECAPTCHA_SECRET_KEY ?? "").trim(),
  recaptchaMinScore: Number(process.env.RECAPTCHA_MIN_SCORE ?? 0.5),
  registerMaxPerIp24h: Number(process.env.REGISTER_MAX_PER_IP_24H ?? 5),
  emailVerificationTtlHours: Number(process.env.EMAIL_VERIFICATION_TTL_HOURS ?? 48),
  smtpHost: (process.env.SMTP_HOST ?? "").trim(),
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: (process.env.SMTP_USER ?? "").trim(),
  smtpPass: (process.env.SMTP_PASS ?? "").trim(),
  smtpFrom: (process.env.SMTP_FROM ?? "").trim(),
  devLogEmails: process.env.DEV_LOG_EMAILS === "true" || (!isProd && process.env.DEV_LOG_EMAILS !== "false"),
  noveProvidersEnableNetwork:
    process.env.NOVE_PROVIDERS_ENABLE_NETWORK === "1",
  noveWorkerConcurrency: Number(process.env.NOVE_WORKER_CONCURRENCY ?? 2),
  openaiApiKey: (process.env.OPENAI_API_KEY ?? "").trim(),
  openaiBaseUrl: (process.env.OPENAI_BASE_URL ?? "").trim(),
  replicateApiToken: (process.env.REPLICATE_API_TOKEN ?? "").trim(),
  defaultChatModel: process.env.NOVE_DEFAULT_CHAT_MODEL ?? "gpt-4o-mini",
  defaultImageModel: process.env.NOVE_DEFAULT_IMAGE_MODEL ?? "dall-e-3",
  deepseekApiKey: (process.env.DEEPSEEK_API_KEY ?? "").trim(),
  deepseekBaseUrl: (process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com").replace(/\/$/, ""),
  deepseekChatModel: process.env.DEEPSEEK_CHAT_MODEL ?? "deepseek-chat",
  dashscopeApiKey: (process.env.DASHSCOPE_API_KEY ?? "").trim(),
  volcengineArkApiKey: (process.env.VOLCENGINE_ARK_API_KEY ?? "").trim(),
  volcengineArkBaseUrl: (process.env.VOLCENGINE_ARK_BASE_URL ?? "https://ark.cn-beijing.volces.com/api/v3").replace(
    /\/$/,
    "",
  ),
  volcengineArkVideoModel: process.env.VOLCENGINE_ARK_VIDEO_MODEL ?? "doubao-seedance-1-0-pro-250528",
  /** Optional second Ark API key: used if primary create fails (same base URL / model). */
  volcengineArkFallbackApiKey: (process.env.VOLCENGINE_ARK_FALLBACK_API_KEY ?? "").trim(),
  r2AccountId: (process.env.R2_ACCOUNT_ID ?? "").trim(),
  r2AccessKeyId: (process.env.R2_ACCESS_KEY_ID ?? "").trim(),
  r2SecretAccessKey: (process.env.R2_SECRET_ACCESS_KEY ?? "").trim(),
  r2Bucket: (process.env.R2_BUCKET ?? "").trim(),
  r2PublicUrl: (process.env.R2_PUBLIC_URL ?? "").trim().replace(/\/$/, ""),
  /** Max bytes when downloading a provider asset into R2 (per file). */
  r2MaxDownloadBytes: Number(process.env.R2_MAX_DOWNLOAD_BYTES ?? 120_000_000),
  studioVideoRateLimitPerHour: Number(process.env.STUDIO_VIDEO_RATE_LIMIT_PER_HOUR ?? 3),
  studioVideoRateLimitPerDay: Number(process.env.STUDIO_VIDEO_RATE_LIMIT_PER_DAY ?? 20),
  studioImageRateLimitPerMinute: Number(process.env.STUDIO_IMAGE_RATE_LIMIT_PER_MINUTE ?? 8),
  providerCircuitFailureThreshold: Number(process.env.PROVIDER_CIRCUIT_FAILURE_THRESHOLD ?? 5),
  providerCircuitCooldownMs: Number(process.env.PROVIDER_CIRCUIT_COOLDOWN_MS ?? 300_000),
  studioVideoPollIntervalMs: Number(
    process.env.STUDIO_VIDEO_POLL_INTERVAL_MS ?? envDefaults.studioVideoPollIntervalMs,
  ),
  studioTaskTimeoutSweepIntervalMs: Number(
    process.env.STUDIO_TASK_TIMEOUT_SWEEP_INTERVAL_MS ?? envDefaults.studioTaskTimeoutSweepIntervalMs,
  ),
  requestJsonBodyLimitMb: Number(process.env.REQUEST_JSON_BODY_LIMIT_MB ?? 4),
  /**
   * Mock recharge API (`POST /v1/credits/recharge-mock`). Production: set `NOVE_MOCK_RECHARGE=1` explicitly.
   * Development: enabled unless `NOVE_MOCK_RECHARGE=0`.
   */
  noveMockRechargeEnabled:
    isProd ? process.env.NOVE_MOCK_RECHARGE === "1" : process.env.NOVE_MOCK_RECHARGE !== "0",
  /**
   * Debug-only `POST /v1/credits/consume` (burn credits without a studio task). Off in production unless
   * `NOVE_ENABLE_CREDITS_CONSUME_API=1`. Development: on unless `NOVE_ENABLE_CREDITS_CONSUME_API=0`.
   */
  noveCreditsConsumeApiEnabled:
    isProd
      ? process.env.NOVE_ENABLE_CREDITS_CONSUME_API === "1"
      : process.env.NOVE_ENABLE_CREDITS_CONSUME_API !== "0",
};

export function assertEnvForMigrations(): void {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required for migrations");
  }
}

export function assertAuthEnvForProd(): void {
  if (!isProd) return;
  if (env.jwtAccessSecret.includes("change-me") || env.jwtRefreshSecret.includes("change-me")) {
    throw new Error("JWT secrets must be set for production");
  }
  if (!env.recaptchaSecretKey) {
    throw new Error("RECAPTCHA_SECRET_KEY is required in production");
  }
}
