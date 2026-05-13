/** Longer prefixes first so `/zh` does not eat `/zh-tw`. */
export const LOCALE_PREFIXES = ["/zh-tw", "/zh_tw", "/zhTw", "/zh", "/en", "/ja"] as const;

export const PATH_ALIASES: Readonly<Record<string, string>> = {
  "/workspace": "/video",
  "/studio": "/video",
};

export function stripLocalePrefix(pathname: string): string | null {
  for (const prefix of LOCALE_PREFIXES) {
    if (pathname === prefix) return "/";
    if (pathname.startsWith(`${prefix}/`)) {
      const rest = pathname.slice(prefix.length);
      return rest.startsWith("/") ? rest : `/${rest}`;
    }
  }
  return null;
}

/** Returns redirect pathname (with leading `/`) or null if no redirect. */
export function getMiddlewareRedirectTarget(pathname: string): string | null {
  const alias = PATH_ALIASES[pathname];
  if (alias) return alias;
  return stripLocalePrefix(pathname);
}
