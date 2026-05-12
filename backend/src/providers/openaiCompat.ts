import { env } from "../config/env.js";
import { isProviderNetworkEnabled } from "./networkGate.js";
import { resolveCompatBaseUrl } from "./openaiAliases.js";
import type { ProviderResult, StudioTaskRow } from "./types.js";

async function postChatCompletions(
  baseUrl: string,
  apiKey: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI-compat HTTP ${res.status}: ${t.slice(0, 500)}`);
  }
  return res.json();
}

export async function runOpenAICompatChat(task: StudioTaskRow): Promise<ProviderResult> {
  const p = task.payload;
  const messages = (p.messages as unknown[]) ?? [{ role: "user", content: String(p.message ?? "") }];
  const provider = String(p.provider ?? "openai");
  const baseUrl = resolveCompatBaseUrl(provider, String(p.baseUrl ?? env.openaiBaseUrl ?? ""));
  const model = String(p.model ?? env.defaultChatModel);
  const apiKey = String(p.apiKey ?? env.openaiApiKey);

  if (!isProviderNetworkEnabled() || !apiKey) {
    return {
      mock: true,
      reply: `[nove-studio mock chat] echo: ${JSON.stringify(messages).slice(0, 800)}`,
    };
  }

  const json = (await postChatCompletions(baseUrl, apiKey, {
    model,
    messages,
    temperature: typeof p.temperature === "number" ? p.temperature : 0.7,
  })) as { choices?: { message?: { content?: string } }[] };
  const reply = json.choices?.[0]?.message?.content ?? "";
  return { reply, raw: json };
}

export async function runOpenAICompatPrompt(task: StudioTaskRow): Promise<ProviderResult> {
  const p = task.payload;
  const userPrompt = String(p.prompt ?? "");
  const system = String(p.system ?? "You are a prompt engineer. Return an improved prompt only.");
  const provider = String(p.provider ?? "openai");
  const baseUrl = resolveCompatBaseUrl(provider, String(p.baseUrl ?? env.openaiBaseUrl ?? ""));
  const model = String(p.model ?? env.defaultChatModel);
  const apiKey = String(p.apiKey ?? env.openaiApiKey);

  if (!isProviderNetworkEnabled() || !apiKey) {
    return { mock: true, enhanced: `[nove-studio mock prompt] ${userPrompt}` };
  }

  const json = (await postChatCompletions(baseUrl, apiKey, {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
  })) as { choices?: { message?: { content?: string } }[] };
  const enhanced = json.choices?.[0]?.message?.content ?? "";
  return { enhanced, raw: json };
}

export async function runOpenAICompatImage(task: StudioTaskRow): Promise<ProviderResult> {
  const p = task.payload;
  const prompt = String(p.prompt ?? "abstract art");
  const provider = String(p.provider ?? "openai");
  const baseUrl = resolveCompatBaseUrl(provider, String(p.baseUrl ?? env.openaiBaseUrl ?? ""));
  const model = String(p.model ?? env.defaultImageModel);
  const apiKey = String(p.apiKey ?? env.openaiApiKey);

  if (!isProviderNetworkEnabled() || !apiKey) {
    return { mock: true, urls: [`https://placehold.co/1024x1024/png?text=nove-studio+mock`] };
  }

  const res = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, prompt, n: 1, size: p.size ?? "1024x1024" }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Image gen HTTP ${res.status}: ${t.slice(0, 500)}`);
  }
  const json = (await res.json()) as { data?: { url?: string }[] };
  const urls = (json.data ?? []).map((d) => d.url).filter(Boolean) as string[];
  return { urls, raw: json };
}
