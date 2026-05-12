import type { Locale } from "./types";
import { isLocale } from "./types";

export const LOCALE_STORAGE_KEY = "nove_locale";
export const LOCALE_COOKIE_NAME = "nove_locale";

export function detectLocaleFromNavigator(): Locale {
  if (typeof navigator === "undefined") return "zh";
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const raw of langs) {
    const l = raw.toLowerCase();
    if (l.startsWith("zh-tw") || l === "zh-hant" || l.includes("hant")) return "zhTw";
    if (l.startsWith("zh")) return "zh";
    if (l.startsWith("ja")) return "ja";
  }
  return "en";
}

export function readLocaleCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]*)`));
  const v = m?.[1] ? decodeURIComponent(m[1]) : null;
  return isLocale(v) ? v : null;
}

export function persistLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
  const maxAge = 60 * 60 * 24 * 400;
  document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(locale)};path=/;max-age=${maxAge};SameSite=Lax`;
}
