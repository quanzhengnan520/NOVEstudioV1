"use client";

import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "./api";
import { mapApiErrorMessage } from "./errors";

export type StudioTaskView = {
  id: string;
  task_type: string;
  status: string;
  bullmq_job_id: string | null;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error_message: string | null;
  credits_amount: number;
  credits_charged: boolean;
  credits_reserved?: boolean;
  order_id: string | null;
  remote_task_id?: string | null;
  processing_deadline?: string | null;
  created_at: string;
  updated_at: string;
};

export async function createStudioTask(
  taskType: "chat" | "prompt" | "image" | "video",
  payload: Record<string, unknown>,
): Promise<{ id: string; status: string; creditsAmount: number }> {
  const env = await apiFetch<{
    task: {
      id: string;
      taskType: string;
      status: string;
      creditsAmount: number;
    };
  }>("studio/tasks", {
    method: "POST",
    body: JSON.stringify({ taskType, payload }),
  });
  const t = env.data?.task;
  if (!t) throw new Error("Missing task in response");
  return { id: t.id, status: t.status, creditsAmount: t.creditsAmount };
}

export async function fetchStudioTask(id: string): Promise<StudioTaskView> {
  const env = await apiFetch<{ task: StudioTaskView }>(`studio/tasks/${id}`, { method: "GET" });
  if (!env.data?.task) throw new Error("Missing task");
  return env.data.task;
}

export function usePollStudioTask(taskId: string | null): {
  task: StudioTaskView | null;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [task, setTask] = useState<StudioTaskView | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!taskId) return;
    try {
      const t = await fetchStudioTask(taskId);
      setTask(t);
      setError(null);
    } catch (e) {
      const raw = e instanceof ApiError ? String(e.body.error ?? e.message) : String(e);
      setError(mapApiErrorMessage(raw));
    }
  }

  useEffect(() => {
    if (!taskId) return;
    const id = taskId;
    let stopped = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    async function tick() {
      try {
        const t = await fetchStudioTask(id);
        if (stopped) return;
        setTask(t);
        setError(null);
        if (t.status === "completed" || t.status === "succeeded" || t.status === "failed") return;
      } catch (e) {
        if (stopped) return;
        const raw = e instanceof ApiError ? String(e.body.error ?? e.message) : String(e);
        setError(mapApiErrorMessage(raw));
      }
      if (stopped) return;
      const baseMs = 1800;
      const maxMs = 28000;
      const delay = Math.min(maxMs, Math.round(baseMs * Math.pow(1.55, attempt)));
      attempt += 1;
      timeoutId = setTimeout(() => void tick(), delay);
    }

    void tick();
    return () => {
      stopped = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [taskId]);

  return { task, error, refresh };
}
