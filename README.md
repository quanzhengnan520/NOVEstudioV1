# NOVE Studio — Monorepo

## 目录

- `frontend/` — Next.js 14 App Router + Tailwind + TypeScript
- `backend/` — Express + TypeScript + BullMQ
- `docs/` — 架构与约定说明
- `infra/` — Docker Compose（dev / prod）与 nginx

## 前置要求

- Node.js 18.18+（推荐 20 LTS）
- npm 10+
- 本地或容器内的 PostgreSQL 与 Redis（或使用 `infra/docker-compose.dev.yml`）

## 安装

在仓库根目录：

```bash
npm install
```

## 环境变量

复制后端示例环境文件并按需修改：

```bash
cp backend/.env.example backend/.env
```

前端可选：

```bash
cp frontend/.env.example frontend/.env.local
```

在 `frontend/.env.local` 配置 `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`（与后端 `RECAPTCHA_SECRET_KEY` 为同一组 reCAPTCHA 密钥的 Site key / Secret）。开发环境若未配置 Secret，后端会跳过人机校验（仅非生产）。

未配置 SMTP 时，验证邮件链接会打印在后端控制台（`DEV_LOG_EMAILS` 默认为开发环境开启日志）。

## 本地开发

1. 启动 PostgreSQL 与 Redis（示例使用开发 Compose，仅基础设施）：

```bash
docker compose -f infra/docker-compose.dev.yml up -d
```

> 若本机 **5432 / 6379** 已被占用，开发 Compose 默认将 **Postgres 映射到 15432**、**Redis 映射到 16379**（见 `infra/docker-compose.dev.yml`）；`backend/.env.example` 已与之对齐。

2. 运行数据库迁移（包含邮箱验证与 IP 记录表）：

```bash
npm run migrate:up
```

3. 同时启动前后端：

```bash
npm run dev
```

- 前端：<http://localhost:3000>
- 后端：<http://localhost:4000>，`GET /health` 探活；业务 API 前缀 `/v1/...`（前端开发期通过 Next `rewrites` 走同源 `/api/...` 以便携带 Cookie）。

### 注册防刷与邮箱验证（要点）

- **reCAPTCHA v3**：注册页在提交时 `execute` 获取 token，随 `POST /v1/auth/register` 的 `captchaToken` 发送。
- **IP 限流**：单 IP 滚动 24 小时内成功注册次数上限见 `REGISTER_MAX_PER_IP_24H`（默认 5）。
- **邮箱验证**：注册后发送验证链接（`FRONTEND_ORIGIN/verify-email?token=...`）；未验证前 **不可消费积分**（`POST /v1/auth/verify-email` 后请再 `POST /v1/auth/refresh` 刷新 JWT）。`POST /v1/auth/resend-verification` 可重发邮件（需登录）。

### 认证与积分（开发）

- 复制 `backend/.env.example` → `backend/.env`，确保 `DATABASE_URL` / `REDIS_URL` 指向 Docker 映射端口（默认 `15432` / `16379`）。
- 可选：设置 `BOOTSTRAP_ADMIN_EMAIL=you@example.com`，首次注册该邮箱即自动 `is_admin=true` 且 **跳过邮箱验证**。
- 页面：`/register`、`/verify-email`、`/login`、`/credits`、`/admin`（管理员）。
- **Mock 充值**：`POST /v1/credits/recharge-mock` 生产环境默认关闭；开发环境默认开启（见 `NOVE_MOCK_RECHARGE`）。
- **调试扣款接口** `POST /v1/credits/consume`：生产环境默认关闭，仅当 `NOVE_ENABLE_CREDITS_CONSUME_API=1` 时开启；本地可用 `NOVE_ENABLE_CREDITS_CONSUME_API=0` 关闭。
- **实时连接**：生产构建下积分页等使用同源 `wss://…/api/ws`；本地 `next dev` 仍直连后端端口（默认 `4000`）。可用 `NEXT_PUBLIC_WS_URL` 覆盖。

## 构建与生产启动

```bash
npm run build
npm run start -w backend
npm run start -w frontend
```

生产环境更推荐使用 `infra/docker-compose.prod.yml` 与配套镜像。

### Docker Compose（生产示例）

在仓库根目录执行：

```bash
docker compose -f infra/docker-compose.prod.yml up -d --build
```

默认对外 HTTP 端口为 `8080`（可通过环境变量 `HTTP_PORT` 修改）。`infra/nginx/nginx.conf` 将 `/` 转发到 Next.js，将 `/health`、`/api/*`（含 WebSocket：`/api/ws` → 后端 `/v1/ws`）与 `/v1/*` 转发到 Express。

数据库密码通过 `POSTGRES_PASSWORD` 注入（`docker-compose.prod.yml` 中默认占位为 `changeme`，上线前务必替换）。首次连接生产库后，在能访问该库的环境中运行 `npm run migrate:up` 完成迁移。

## 数据库迁移（node-pg-migrate）

迁移文件位于 `backend/migrations/`。确保已设置 `DATABASE_URL`（可在 `backend/.env` 中配置）。

```bash
# 应用全部待执行迁移
npm run migrate:up

# 回滚上一批次
npm run migrate:down

# 新建迁移（交互式命名）
npm run migrate:create -- my_change_name
```

也可在后端包内执行：

```bash
cd backend && npm run migrate:up
```

## 测试（Vitest）

```bash
npm test
```

## 端到端（Playwright）

覆盖从**打开首页 → 注册 → Credits → 各工作室页 → 提交视频任务 → 历史 → 反馈 → 管理端 → Mock 充值（若开启）→ 退出 → 再登录**的完整链路。

**前置**：PostgreSQL、Redis 已启动，并已执行 `npm run migrate:up`；`backend/.env` 中 `DATABASE_URL`、`REDIS_URL` 正确。

**推荐**（由 Playwright 启动 `npm run dev`，并自动注入 `BOOTSTRAP_ADMIN_EMAIL=e2e-bootstrap@test.nove` 与空的 `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`，避免注册页等待 reCAPTCHA）：

```bash
npm install
npm run test:e2e:install
npm run test:e2e
```

若你已在本地运行 `npm run dev`，可设置环境变量 `PLAYWRIGHT_SKIP_WEBSERVER=1` 后只执行 `npm run test:e2e`，并确保**当前后端进程**的环境变量包含 `BOOTSTRAP_ADMIN_EMAIL=e2e-bootstrap@test.nove`（与测试固定邮箱一致），否则视频生成会因未验证邮箱失败。

HTML 报告输出在 `playwright-report/`。

## 品牌与命名

- 对外统一品牌：**NOVE Studio**
- 仓库与包短名：**NOVE**（npm workspace 包名 `nove-frontend` / `nove-backend`）

## 许可

[MIT](LICENSE)
