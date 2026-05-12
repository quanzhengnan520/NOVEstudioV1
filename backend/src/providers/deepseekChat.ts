import { env } from "../config/env.js";
import { isProviderNetworkEnabled } from "./networkGate.js";
import { reportProviderOutcome } from "./providerTelemetry.js";

export type ChatMessageRole = "system" | "user" | "assistant";
export type ChatMessage = { role: ChatMessageRole; content: string };

export type ChatCompletionOptions = {
  model?: string;
  temperature?: number;
  max_tokens?: number;
};

async function* readSseDeltas(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (value) buf += dec.decode(value, { stream: !done });
    const parts = buf.split("\n");
    buf = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const j = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
        const d = j.choices?.[0]?.delta?.content;
        if (d) yield d;
      } catch {
        /* ignore malformed JSON line */
      }
    }
    if (done) break;
  }
  const tail = buf.trim();
  if (tail.startsWith("data:")) {
    const data = tail.slice(5).trim();
    if (data && data !== "[DONE]") {
      try {
        const j = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
        const d = j.choices?.[0]?.delta?.content;
        if (d) yield d;
      } catch {
        /* ignore */
      }
    }
  }
}

/** Non-streaming chat completion (OpenAI-compatible DeepSeek). */
export async function generateChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {},
): Promise<{ content: string }> {
  const name = "deepseek";
  if (!isProviderNetworkEnabled() || !env.deepseekApiKey) {
    reportProviderOutcome(name, true);
    return { content: `[nove-studio mock] ${messages.at(-1)?.content ?? ""}`.slice(0, 800) };
  }
  try {
    const model = options.model ?? env.deepseekChatModel;
    const res = await fetch(`${env.deepseekBaseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens,
        stream: false,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`DeepSeek HTTP ${res.status}: ${t.slice(0, 800)}`);
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content ?? "";
    reportProviderOutcome(name, true);
    return { content };
  } catch (e) {
    reportProviderOutcome(name, false, e);
    throw e;
  }
}

/** Streaming chat completion; yields text deltas. */
export async function* generateChatCompletionStream(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {},
): AsyncGenerator<string, void, void> {
  const name = "deepseek";
  if (!isProviderNetworkEnabled() || !env.deepseekApiKey) {
    reportProviderOutcome(name, true);
    yield `[nove-studio mock stream] ${messages.at(-1)?.content ?? ""}`.slice(0, 400);
    return;
  }
  try {
    const model = options.model ?? env.deepseekChatModel;
    const res = await fetch(`${env.deepseekBaseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens,
        stream: true,
      }),
    });
    if (!res.ok || !res.body) {
      const t = await res.text();
      throw new Error(`DeepSeek stream HTTP ${res.status}: ${t.slice(0, 800)}`);
    }
    for await (const d of readSseDeltas(res.body)) {
      yield d;
    }
    reportProviderOutcome(name, true);
  } catch (e) {
    reportProviderOutcome(name, false, e);
    throw e;
  }
}
