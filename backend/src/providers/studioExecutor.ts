import type { StudioTaskRow } from "./types.js";
import { generateChatCompletion, type ChatMessage } from "./deepseekChat.js";
import { generateImage } from "./dashscopeImage.js";
import { createVideoRemote } from "./volcengineArkVideo.js";
import { runOpenAICompatImage } from "./openaiCompat.js";
import { runReplicateImage } from "./replicateImage.js";

function messagesFromPayload(p: Record<string, unknown>): ChatMessage[] {
  const raw = p.messages as unknown;
  if (Array.isArray(raw)) {
    return raw
      .filter((m): m is ChatMessage => typeof m === "object" && m !== null && "role" in m && "content" in m)
      .map((m) => {
        const o = m as { role: string; content: string };
        const role = o.role === "system" || o.role === "assistant" || o.role === "user" ? o.role : "user";
        return { role, content: String(o.content ?? "") };
      });
  }
  return [{ role: "user", content: String(p.message ?? "") }];
}

export async function runStudioChat(task: StudioTaskRow): Promise<Record<string, unknown>> {
  const p = task.payload;
  const messages = messagesFromPayload(p);
  const { content } = await generateChatCompletion(messages, {
    model: typeof p.model === "string" ? p.model : undefined,
    temperature: typeof p.temperature === "number" ? p.temperature : 0.7,
    max_tokens: typeof p.max_tokens === "number" ? p.max_tokens : undefined,
  });
  return { reply: content, provider: "deepseek" };
}

export async function runStudioPrompt(task: StudioTaskRow): Promise<Record<string, unknown>> {
  const p = task.payload;
  const userPrompt = String(p.prompt ?? "");
  const system = String(
    p.system ?? "You are a prompt engineer. Return only the improved prompt text, no preamble.",
  );
  const { content: enhanced } = await generateChatCompletion(
    [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
    {
      model: typeof p.model === "string" ? p.model : undefined,
      temperature: typeof p.temperature === "number" ? p.temperature : 0.4,
      max_tokens: typeof p.max_tokens === "number" ? p.max_tokens : 2048,
    },
  );
  return { enhanced, provider: "deepseek" };
}

export async function runStudioImage(task: StudioTaskRow): Promise<Record<string, unknown>> {
  const p = task.payload;
  const engine = String(p.engine ?? "dashscope").toLowerCase();
  if (engine === "replicate") {
    return runReplicateImage(task);
  }
  if (engine === "openai-compat" || engine === "openai") {
    return runOpenAICompatImage(task);
  }
  const prompt = String(p.prompt ?? "abstract");
  const { urls, taskId } = await generateImage(prompt, {
    size: typeof p.size === "string" ? p.size : undefined,
    style: typeof p.style === "string" ? p.style : undefined,
    negative_prompt: typeof p.negative_prompt === "string" ? p.negative_prompt : undefined,
  });
  return { urls, dashscopeTaskId: taskId, provider: "dashscope" };
}

export async function runStudioVideo(task: StudioTaskRow): Promise<Record<string, unknown>> {
  const p = task.payload;
  const prompt = String(p.prompt ?? "cinematic");
  const { vendorTaskId } = await createVideoRemote(prompt, {
    image_url: typeof p.image_url === "string" ? p.image_url : undefined,
    duration: typeof p.duration === "number" ? p.duration : undefined,
    resolution: typeof p.resolution === "string" ? p.resolution : undefined,
  });
  return {
    polling: true,
    vendorTaskId,
    provider: "volcengine-ark",
  };
}

export async function executeStudioTask(task: StudioTaskRow): Promise<Record<string, unknown>> {
  switch (task.task_type) {
    case "chat":
      return runStudioChat(task);
    case "prompt":
      return runStudioPrompt(task);
    case "image":
      return runStudioImage(task);
    case "video":
      return runStudioVideo(task);
    default:
      throw new Error(`Unknown task_type: ${(task as StudioTaskRow).task_type}`);
  }
}
