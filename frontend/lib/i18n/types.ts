export type Locale = "zh" | "zhTw" | "en" | "ja";

export const LOCALES: Locale[] = ["zh", "zhTw", "en", "ja"];

export function isLocale(v: string | null | undefined): v is Locale {
  return v === "zh" || v === "zhTw" || v === "en" || v === "ja";
}

export function htmlLang(locale: Locale): string {
  if (locale === "zhTw") return "zh-Hant";
  if (locale === "zh") return "zh-Hans";
  return locale;
}
