/**
 * Studio task WebSocket (backend `/v1/ws`). Production nginx maps `/api/ws` → `/v1/ws` with Upgrade headers.
 *
 * - Set `NEXT_PUBLIC_WS_URL` to override (e.g. `next start` without reverse proxy: `ws://127.0.0.1:4000/v1/ws`).
 * - `next dev`: defaults to same hostname and `NEXT_PUBLIC_WS_PORT` (default 4000), path `/v1/ws`.
 * - Production build: same-origin `/api/ws` (TLS → `wss:`).
 */
export function resolveStudioWebSocketUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (explicit) return explicit;

  if (typeof window === "undefined") return "";

  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  if (process.env.NODE_ENV === "development") {
    const port = process.env.NEXT_PUBLIC_WS_PORT ?? "4000";
    return `${proto}://${window.location.hostname}:${port}/v1/ws`;
  }

  return `${proto}://${window.location.host}/api/ws`;
}
