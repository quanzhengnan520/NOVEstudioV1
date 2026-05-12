import { env } from "../config/env.js";
import { isProviderNetworkEnabled } from "./networkGate.js";
import type { ProviderResult, StudioTaskRow } from "./types.js";

export async function runReplicateImage(task: StudioTaskRow): Promise<ProviderResult> {
  const p = task.payload;
  const prompt = String(p.prompt ?? "a photo");
  const model = String(p.replicateModel ?? "black-forest-labs/flux-schnell");

  if (!isProviderNetworkEnabled() || !env.replicateApiToken) {
    return { mock: true, provider: "replicate", urls: [`https://placehold.co/512x512/png?text=replicate+mock`] };
  }

  const res = await fetch("https://api.replicate.com/v1/models/" + model + "/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.replicateApiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: { prompt } }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Replicate HTTP ${res.status}: ${t.slice(0, 400)}`);
  }
  const json = (await res.json()) as { urls?: string[]; output?: string[] };
  const urls = json.output ?? json.urls ?? [];
  return { urls, prediction: json };
}
