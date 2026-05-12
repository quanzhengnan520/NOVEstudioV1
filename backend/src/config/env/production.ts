/** Default tuning when `STUDIO_VIDEO_POLL_INTERVAL_MS` is unset (production). */
export const productionEnvDefaults = {
  studioVideoPollIntervalMs: 5000,
  studioTaskTimeoutSweepIntervalMs: 60_000,
} as const;
