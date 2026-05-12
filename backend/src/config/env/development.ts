/** Default tuning when `STUDIO_VIDEO_POLL_INTERVAL_MS` is unset (development). */
export const developmentEnvDefaults = {
  studioVideoPollIntervalMs: 5000,
  studioTaskTimeoutSweepIntervalMs: 45_000,
} as const;
