/** Redact secrets from error strings before persisting or returning to admin. */
export function sanitizeErrorMessage(raw: string): string {
  let s = raw;
  s = s.replace(/Bearer\s+[^\s]+/gi, "Bearer [REDACTED]");
  s = s.replace(/sk-[a-zA-Z0-9]{10,}/gi, "sk-[REDACTED]");
  s = s.replace(/ksk-[a-zA-Z0-9_-]{10,}/gi, "ksk-[REDACTED]");
  s = s.replace(/ark-[a-zA-Z0-9_-]{10,}/gi, "ark-[REDACTED]");
  s = s.replace(/keark-[a-zA-Z0-9_-]{10,}/gi, "keark-[REDACTED]");
  return s.slice(0, 2000);
}
