import type { IncomingMessage, Server as HttpServer } from "node:http";
import type { Duplex } from "node:stream";
import { randomUUID } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";
import { getPool } from "../db/pool.js";
import { tryUserIdFromUpgradeRequest } from "./wsAuth.js";

const WS_PATH = "/v1/ws";

let wss: WebSocketServer | null = null;
let upgradeHandler:
  | ((req: IncomingMessage, socket: Duplex, head: Buffer) => void)
  | null = null;

type Client = WebSocket & { __noveUserId?: string; __noveRowId?: string };

export function attachStudioWebSocket(server: HttpServer): void {
  if (wss) return;
  wss = new WebSocketServer({ noServer: true });

  upgradeHandler = (req, socket, head) => {
    try {
      const host = req.headers.host ?? "localhost";
      const path = new URL(req.url ?? "/", `http://${host}`).pathname;
      if (path !== WS_PATH) return;
      const userId = tryUserIdFromUpgradeRequest(req);
      if (!userId) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }
      wss!.handleUpgrade(req, socket, head, (ws) => {
        wss!.emit("connection", ws as Client, req);
      });
    } catch {
      try {
        socket.destroy();
      } catch {
        /* ignore */
      }
    }
  };

  server.on("upgrade", upgradeHandler);

  wss.on("connection", (socket: Client, req) => {
    const userId = tryUserIdFromUpgradeRequest(req);
    if (!userId) {
      socket.close(1008, "unauthorized");
      return;
    }
    const socketId = randomUUID();
    socket.__noveUserId = userId;
    void (async () => {
      try {
        const pool = getPool();
        const ins = await pool.query<{ id: string }>(
          `insert into ws_connections (user_id, socket_id, last_ping) values ($1, $2, now()) returning id`,
          [userId, socketId],
        );
        socket.__noveRowId = ins.rows[0]?.id;
      } catch {
        /* table may be missing */
      }
    })();

    socket.send(JSON.stringify({ event: "connected", userId, path: WS_PATH }));

    socket.on("message", (raw) => {
      try {
        const t = JSON.parse(String(raw)) as { type?: string };
        if (t?.type === "ping") {
          socket.send(JSON.stringify({ event: "pong", t: Date.now() }));
          const rowId = socket.__noveRowId;
          if (rowId) {
            void getPool().query(`update ws_connections set last_ping = now() where id = $1`, [rowId]);
          }
        }
      } catch {
        /* ignore bad frames */
      }
    });

    socket.on("close", () => {
      const rowId = socket.__noveRowId;
      if (rowId) {
        void getPool().query(`delete from ws_connections where id = $1`, [rowId]);
      }
    });
  });
}

export function closeStudioWebSocket(server: HttpServer): Promise<void> {
  return new Promise((resolve) => {
    if (upgradeHandler) {
      server.removeListener("upgrade", upgradeHandler);
      upgradeHandler = null;
    }
    if (!wss) {
      resolve();
      return;
    }
    wss.close(() => {
      wss = null;
      resolve();
    });
  });
}

/** Push JSON to all sockets for a user (best-effort; used by studio / tasks later). */
export function broadcastToUser(userId: string, payload: Record<string, unknown>): void {
  if (!wss) return;
  const msg = JSON.stringify(payload);
  for (const c of wss.clients) {
    const s = c as Client;
    if (s.__noveUserId === userId && s.readyState === WebSocket.OPEN) s.send(msg);
  }
}

export type StudioWsCreditsPhase = "freeze" | "capture" | "release";

export type StudioWsEventV1 = {
  type: "task_queued" | "task_processing" | "task_completed" | "task_failed" | "credits_updated";
  taskId: string;
  taskType: string;
  status: string;
  credits?: { phase: StudioWsCreditsPhase; amount: number };
  timestamp: string;
  error?: string;
};

/** R9 unified envelope; includes legacy `{ event: "studio_task", ... }` mirror for older clients. */
export function broadcastStudioWsV1(userId: string, payload: StudioWsEventV1): void {
  broadcastToUser(userId, {
    event: "studio",
    version: 1,
    ...payload,
    legacy: {
      event: "studio_task",
      taskId: payload.taskId,
      taskType: payload.taskType,
      status: payload.status,
    },
  });
}
