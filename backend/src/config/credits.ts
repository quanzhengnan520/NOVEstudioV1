export const CREDIT_COSTS = {
  chat: 1,
  prompt_enhance: 2,
  image: 12,
  video: { min: 20, max: 80 },
} as const;

export type VideoTier = 1 | 2 | 3 | 4;

export function videoCreditsForTier(tier: number): number {
  const t = Math.min(4, Math.max(1, Math.floor(tier))) as VideoTier;
  const map: Record<VideoTier, number> = { 1: 20, 2: 40, 3: 60, 4: 80 };
  return map[t];
}

export function videoCreditsForAmount(amount: number): number {
  const n = Math.floor(amount);
  if (!Number.isFinite(n)) return CREDIT_COSTS.video.min;
  return Math.min(CREDIT_COSTS.video.max, Math.max(CREDIT_COSTS.video.min, n));
}
