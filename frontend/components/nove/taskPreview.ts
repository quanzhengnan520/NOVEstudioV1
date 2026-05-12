import type { StudioTaskView } from "@/lib/studio";

/** Thumbnail URL for history cards (image / video). */
export function taskThumbUrl(t: StudioTaskView): string | null {
  const r = t.result;
  if (!r) return null;
  if (t.task_type === "video") {
    const u = r.url;
    return typeof u === "string" && u.length > 0 ? u : null;
  }
  if (t.task_type === "image") {
    const urls = r.urls;
    if (Array.isArray(urls) && urls[0] && typeof urls[0] === "string") return urls[0];
    const one = r.url;
    return typeof one === "string" ? one : null;
  }
  return null;
}

export function taskTitlePreview(t: StudioTaskView): string {
  const p = t.payload;
  if (t.task_type === "chat") {
    const msgs = p.messages as { role?: string; content?: string }[] | undefined;
    if (Array.isArray(msgs) && msgs.length) {
      const last = [...msgs].reverse().find((m) => m.role === "user");
      if (last?.content) return last.content.slice(0, 120);
    }
    return String(p.message ?? "Chat").slice(0, 120);
  }
  if (t.task_type === "prompt") return String(p.prompt ?? "Prompt").slice(0, 120);
  if (t.task_type === "image" || t.task_type === "video") return String(p.prompt ?? t.task_type).slice(0, 120);
  return t.task_type;
}

export function taskTypeLabel(type: string): string {
  const m: Record<string, string> = {
    chat: "Chat",
    prompt: "Prompt",
    image: "Image",
    video: "Video",
  };
  return m[type] ?? type;
}
