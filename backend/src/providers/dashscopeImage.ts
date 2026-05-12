import { env } from "../config/env.js";
import { isProviderNetworkEnabled } from "./networkGate.js";
import { reportProviderOutcome } from "./providerTelemetry.js";

export type DashScopeImageOptions = {
  size?: string;
  style?: string;
  negative_prompt?: string;
  n?: number;
};

const SUBMIT_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";
const TASK_URL = (taskId: string) => `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type TaskBody = {
  output?: {
    task_id?: string;
    task_status?: string;
    results?: { url?: string; code?: string; message?: string }[];
    code?: string;
    message?: string;
  };
};

/** Submit async wanx job and poll until terminal state. */
export async function generateImage(
  prompt: string,
  options: DashScopeImageOptions = {},
): Promise<{ urls: string[]; taskId: string }> {
  const name = "dashscope";
  if (!isProviderNetworkEnabled() || !env.dashscopeApiKey) {
    reportProviderOutcome(name, true);
    return {
      urls: [`https://placehold.co/1024x1024/png?text=dashscope+mock`],
      taskId: "mock-task",
    };
  }
  try {
    const input: Record<string, unknown> = { prompt };
    if (options.negative_prompt) input.negative_prompt = options.negative_prompt;
    const parameters: Record<string, unknown> = {
      style: options.style ?? "<auto>",
      size: options.size ?? "1024*1024",
      n: options.n ?? 1,
    };
    const submit = await fetch(SUBMIT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.dashscopeApiKey}`,
        "X-DashScope-Async": "enable",
      },
      body: JSON.stringify({
        model: "wanx-v1",
        input,
        parameters,
      }),
    });
    const submitJson = (await submit.json()) as TaskBody & { message?: string };
    if (!submit.ok) {
      throw new Error(`DashScope submit HTTP ${submit.status}: ${JSON.stringify(submitJson).slice(0, 800)}`);
    }
    const taskId = submitJson.output?.task_id;
    if (!taskId) throw new Error("DashScope submit: missing task_id");

    const deadline = Date.now() + 8 * 60 * 1000;
    while (Date.now() < deadline) {
      await sleep(2500);
      const q = await fetch(TASK_URL(taskId), {
        headers: { Authorization: `Bearer ${env.dashscopeApiKey}` },
      });
      const qj = (await q.json()) as TaskBody;
      if (!q.ok) {
        throw new Error(`DashScope task HTTP ${q.status}: ${JSON.stringify(qj).slice(0, 800)}`);
      }
      const st = qj.output?.task_status?.toUpperCase();
      if (st === "SUCCEEDED") {
        const urls = (qj.output?.results ?? [])
          .map((r) => r.url)
          .filter((u): u is string => typeof u === "string" && u.length > 0);
        reportProviderOutcome(name, true);
        return { urls, taskId };
      }
      if (st === "FAILED") {
        const msg = qj.output?.message ?? qj.output?.code ?? "DashScope task failed";
        throw new Error(String(msg));
      }
    }
    throw new Error("DashScope image generation timed out");
  } catch (e) {
    reportProviderOutcome(name, false, e);
    throw e;
  }
}
