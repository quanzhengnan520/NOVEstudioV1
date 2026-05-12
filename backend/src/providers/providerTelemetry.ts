import { env } from "../config/env.js";
import { isProviderNetworkEnabled } from "./networkGate.js";
import { sanitizeErrorMessage } from "./sanitize.js";

export type ProviderHealthEntry = {
  name: string;
  enabled: boolean;
  healthy: boolean;
  lastError: string | null;
};

type Row = { healthy: boolean; lastError: string | null; attempts: number };

const state = new Map<string, Row>();

export function reportProviderOutcome(name: string, ok: boolean, err?: unknown): void {
  const prev = state.get(name);
  const lastError = ok
    ? null
    : sanitizeErrorMessage(err instanceof Error ? err.message : String(err ?? "unknown error"));
  state.set(name, {
    healthy: ok,
    lastError,
    attempts: (prev?.attempts ?? 0) + 1,
  });
}

function entry(name: string, keyConfigured: boolean): ProviderHealthEntry {
  const network = isProviderNetworkEnabled();
  const enabled = network && keyConfigured;
  const row = state.get(name);
  return {
    name,
    enabled,
    healthy: !enabled ? true : row ? row.healthy : false,
    lastError: enabled ? row?.lastError ?? null : null,
  };
}

export function getProviderHealthList(): { providers: ProviderHealthEntry[] } {
  return {
    providers: [
      entry("deepseek", Boolean(env.deepseekApiKey)),
      entry("dashscope", Boolean(env.dashscopeApiKey)),
      entry("volcengine-ark", Boolean(env.volcengineArkApiKey)),
      entry("openai-compat", Boolean(env.openaiApiKey)),
      entry("replicate", Boolean(env.replicateApiToken)),
    ],
  };
}
