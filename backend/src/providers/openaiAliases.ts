/** OpenAI-compatible API base URLs by provider alias (nove-studio). */
export const OPENAI_COMPAT_BASES: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  deepseek: "https://api.deepseek.com/v1",
  moonshot: "https://api.moonshot.cn/v1",
  qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  dashscope: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  together: "https://api.together.xyz/v1",
  openrouter: "https://openrouter.ai/api/v1",
  "openai-compat": "",
};

export function resolveCompatBaseUrl(alias: string, overrideBase?: string): string {
  const a = alias.toLowerCase().trim();
  if (overrideBase && overrideBase.length > 0) {
    return overrideBase.replace(/\/$/, "");
  }
  const mapped = OPENAI_COMPAT_BASES[a];
  if (mapped === "") {
    throw new Error("openai-compat requires baseUrl in payload");
  }
  if (!mapped) {
    throw new Error(`Unknown provider alias: ${alias}`);
  }
  return mapped;
}
