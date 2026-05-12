import { env } from "../config/env.js";

import { isProviderNetworkEnabled } from "./networkGate.js";

import { reportProviderOutcome } from "./providerTelemetry.js";

import { recordProviderFailure, recordProviderSuccess, isProviderCircuitOpen } from "../services/providerCircuit.js";

import { getVideoArkApiKeysOrdered } from "../services/providerFallbackConfig.js";



export type VolcengineVideoOptions = {

  image_url?: string;

  duration?: number;

  resolution?: string;

};



function buildPromptWithHints(prompt: string, opts: VolcengineVideoOptions): string {

  let p = prompt;

  if (opts.duration && !/--duration\b/i.test(p) && !/--dur\b/i.test(p)) {

    p += ` --duration ${opts.duration}`;

  }

  if (opts.resolution && !/--resolution\b/i.test(p)) {

    p += ` --resolution ${opts.resolution}`;

  }

  return p;

}



export function extractVideoUrl(data: Record<string, unknown>): string | null {

  const content = data.content as Record<string, unknown> | undefined;

  const u =

    (content?.video_url as string | undefined) ||

    (data.video_url as string | undefined) ||

    ((data.output as Record<string, unknown> | undefined)?.video_url as string | undefined);

  return typeof u === "string" && u.length > 0 ? u : null;

}



/** POST Ark create task; throws on HTTP / missing id. */

async function postArkCreateTask(

  apiKey: string,

  prompt: string,

  options: VolcengineVideoOptions,

): Promise<{ vendorTaskId: string }> {

  const base = env.volcengineArkBaseUrl;

  const model = env.volcengineArkVideoModel;

  const text = buildPromptWithHints(prompt, options);

  const content: Record<string, unknown>[] = [{ type: "text", text }];

  if (options.image_url) {

    content.push({ type: "image_url", image_url: { url: options.image_url } });

  }

  const create = await fetch(`${base}/contents/generations/tasks`, {

    method: "POST",

    headers: {

      "Content-Type": "application/json",

      Authorization: `Bearer ${apiKey}`,

    },

    body: JSON.stringify({ model, content }),

  });

  const createJson = (await create.json()) as Record<string, unknown>;

  if (!create.ok) {

    throw new Error(`Ark create HTTP ${create.status}: ${JSON.stringify(createJson).slice(0, 1200)}`);

  }

  const vendorTaskId = String(createJson.id ?? "");

  if (!vendorTaskId) throw new Error("Ark create: missing task id");

  return { vendorTaskId };

}



/** Create remote Ark video task (no polling). Keys order: DB `provider_fallbacks` + env. */

export async function createVideoRemote(

  prompt: string,

  options: VolcengineVideoOptions = {},

): Promise<{ vendorTaskId: string; usedFallback?: boolean }> {

  const name = "volcengine-ark";

  if (!isProviderNetworkEnabled() || !env.volcengineArkApiKey) {

    reportProviderOutcome(name, true);

    recordProviderSuccess(name, 0);

    return { vendorTaskId: `mock-${crypto.randomUUID()}` };

  }

  if (await isProviderCircuitOpen(name)) {

    const err = new Error("Video provider temporarily unavailable (circuit open)");

    reportProviderOutcome(name, false, err);

    throw err;

  }

  const keys = await getVideoArkApiKeysOrdered();

  if (keys.length === 0) {

    const err = new Error("No Volcengine Ark API keys configured");

    reportProviderOutcome(name, false, err);

    throw err;

  }

  const t0 = Date.now();

  let last: unknown;

  for (let i = 0; i < keys.length; i++) {

    try {

      const r = await postArkCreateTask(keys[i]!, prompt, options);

      recordProviderSuccess(name, Date.now() - t0);

      reportProviderOutcome(name, true);

      return { ...r, usedFallback: i > 0 };

    } catch (e) {

      last = e;

    }

  }

  recordProviderFailure(name, last);

  reportProviderOutcome(name, false, last);

  throw last instanceof Error ? last : new Error(String(last));

}



/** Single poll of remote Ark video task. */

export async function fetchVideoRemoteStatus(vendorTaskId: string): Promise<{

  status: "queued" | "running" | "succeeded" | "failed" | "unknown";

  videoUrl?: string;

  errorMessage?: string;

}> {

  if (vendorTaskId.startsWith("mock-")) {

    return { status: "succeeded", videoUrl: "https://example.com/mock-video-placeholder.mp4" };

  }

  if (await isProviderCircuitOpen("volcengine-ark")) {

    return { status: "failed", errorMessage: "circuit open" };

  }

  if (!isProviderNetworkEnabled() || !env.volcengineArkApiKey) {

    return { status: "failed", errorMessage: "Provider disabled" };

  }

  const keys = await getVideoArkApiKeysOrdered();

  if (keys.length === 0) {

    return { status: "failed", errorMessage: "No API keys" };

  }

  const base = env.volcengineArkBaseUrl;

  let lastErr = "poll failed";

  for (const apiKey of keys) {

    const st = await fetch(`${base}/contents/generations/tasks/${vendorTaskId}`, {

      headers: { Authorization: `Bearer ${apiKey}` },

    });

    const data = (await st.json()) as Record<string, unknown>;

    if (!st.ok) {

      lastErr = `poll HTTP ${st.status}`;

      continue;

    }

    const status = String(data.status ?? "").toLowerCase();

    if (status === "succeeded") {

      const videoUrl = extractVideoUrl(data) ?? undefined;

      return { status: "succeeded", videoUrl };

    }

    if (status === "failed" || status === "canceled" || status === "cancelled") {

      const err = (data.error as Record<string, unknown> | undefined)?.message ?? data.error ?? status;

      return { status: "failed", errorMessage: String(err) };

    }

    if (status === "queued" || status === "running" || status === "processing") {

      return { status: "running" };

    }

    return { status: "unknown" };

  }

  return { status: "failed", errorMessage: lastErr };

}


