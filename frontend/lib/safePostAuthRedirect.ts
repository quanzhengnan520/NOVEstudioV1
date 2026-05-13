/** Internal app path only; blocks open redirects. */
export function safePostAuthRedirect(next: string | null | undefined, defaultPath = "/credits"): string {
  if (!next || typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) return defaultPath;
  if (next.includes(":")) return defaultPath;
  return next;
}
