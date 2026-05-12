/** POST /api/studio/chat/stream — reads SSE `data: {...}` lines (DeepSeek stream). */
export async function streamStudioChat(
  body: { message?: string; messages?: { role: string; content: string }[]; temperature?: number; max_tokens?: number },
  onEvent: (ev: { type: string; [k: string]: unknown }) => void,
): Promise<void> {
  const res = await fetch("/api/studio/chat/stream", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j?.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (value) buf += dec.decode(value, { stream: !done });
    const blocks = buf.split("\n\n");
    buf = blocks.pop() ?? "";
    for (const block of blocks) {
      for (const line of block.split("\n")) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const raw = t.slice(5).trim();
        if (!raw) continue;
        try {
          const ev = JSON.parse(raw) as { type: string; [k: string]: unknown };
          onEvent(ev);
        } catch {
          /* ignore */
        }
      }
    }
    if (done) break;
  }
}
