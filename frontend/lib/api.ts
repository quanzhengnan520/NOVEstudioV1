export type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
  requestId: string;
};

function buildUrl(path: string): string {
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `/api/${p}`;
}

async function parseEnvelope<T>(res: Response): Promise<ApiEnvelope<T>> {
  return (await res.json()) as ApiEnvelope<T>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly requestId: string;
  readonly body: ApiEnvelope<unknown>;

  constructor(message: string, status: number, requestId: string, body: ApiEnvelope<unknown>) {
    super(message);
    this.status = status;
    this.requestId = requestId;
    this.body = body;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit, retried = false): Promise<ApiEnvelope<T>> {
  const url = buildUrl(path);
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const env = await parseEnvelope<T>(res);

  if (res.status === 401 && !retried && !path.startsWith("auth/refresh")) {
    const refreshRes = await fetch(buildUrl("auth/refresh"), { method: "POST", credentials: "include" });
    const refreshEnv = await parseEnvelope<unknown>(refreshRes);
    if (refreshRes.ok && refreshEnv.success) {
      return apiFetch<T>(path, init, true);
    }
  }

  if (!res.ok || !env.success) {
    throw new ApiError(env.error ?? "Request failed", res.status, env.requestId, env as ApiEnvelope<unknown>);
  }

  return env;
}
