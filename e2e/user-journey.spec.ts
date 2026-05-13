import path from "node:path";
import { test, expect } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "..", "backend", ".env") });

const E2E_BOOTSTRAP_EMAIL = "e2e-bootstrap@test.nove";
const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://127.0.0.1:4000";
const PASSWORD = process.env.E2E_PASSWORD ?? "E2E_N0ve_Test_Pass_12";

test.describe.serial("NOVE Studio — full user journey", () => {
  test("health + landing + register + verified session + studio + admin + logout + login", async ({ page }) => {
    const be = await page.request.get(`${BACKEND}/health`);
    if (!be.ok()) {
      test.skip(true, `Backend not reachable at ${BACKEND}/health — start Postgres/Redis, migrate, then npm run dev`);
    }

    await page.goto("/");
    await expect(page.getByText(/NOVE Studio|NOVE/i).first()).toBeVisible({ timeout: 30_000 });

    await page.goto("/register");
    await page.locator('input[type="email"]').fill(E2E_BOOTSTRAP_EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole("button", { name: /注册|Create account/i }).click();

    await expect(
      page.getByRole("heading", { name: /验证邮件已发送|注册成功|Account ready|Check your inbox/i }),
    ).toBeVisible({ timeout: 90_000 });

    await page.getByRole("button", { name: /进入 Credits|Open Credits/i }).click();
    await expect(page).toHaveURL(/\/credits/, { timeout: 30_000 });

    const me = await page.evaluate(async () => {
      const r = await fetch("/api/auth/me", { credentials: "include" });
      if (!r.ok) return { ok: false as const, status: r.status };
      const j = (await r.json()) as { data?: { emailVerified?: boolean; isAdmin?: boolean } };
      return {
        ok: true as const,
        emailVerified: Boolean(j.data?.emailVerified),
        isAdmin: Boolean(j.data?.isAdmin),
      };
    });
    expect(me.ok, "auth/me should succeed after register").toBe(true);
    if (!me.ok) return;
    expect(
      me.emailVerified,
      "Bootstrap user must be email-verified (backend BOOTSTRAP_ADMIN_EMAIL must match e2e-bootstrap@test.nove when the server starts)",
    ).toBe(true);
    expect(me.isAdmin, "Bootstrap user should be admin for /admin test").toBe(true);

    await page.goto("/video");
    await expect(page.getByRole("button", { name: /生成|Generate video/i })).toBeVisible();
    await page.getByRole("button", { name: /生成|Generate video/i }).click();
    await expect(page).toHaveURL(/\/tasks\/video\//, { timeout: 120_000 });
    await expect(page.getByText(/任务状态|Task/i).first()).toBeVisible();

    await page.goto("/history");
    await expect(page.locator("body")).toContainText(/历史|History|任务/i, { timeout: 30_000 });

    for (const path of ["/image", "/chat", "/prompt"] as const) {
      await page.goto(path);
      await expect(page.locator("body")).toBeVisible();
    }

    await page.goto("/feedback");
    await page.locator("textarea").first().fill("E2E feedback from Playwright.");
    await page.getByRole("button", { name: /提交|发送|送信|Send/i }).click();
    await expect(page.locator("body")).toContainText(/已提交|编号|受け付け|Received/i, { timeout: 30_000 });

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /管理后台/i })).toBeVisible({ timeout: 30_000 });

    await page.goto("/credits");
    const mockBtn = page.getByRole("button", { name: /\+100|mock credits|测试积分/i });
    if (await mockBtn.isVisible().catch(() => false)) {
      await mockBtn.click();
      await expect(page.locator("body")).toContainText(/Mock|测试积分|mock/i, { timeout: 20_000 });
    }

    await page.goto("/");
    const menuBtn = page.getByRole("button", { name: new RegExp(E2E_BOOTSTRAP_EMAIL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) });
    await expect(menuBtn).toBeVisible({ timeout: 15_000 });
    await menuBtn.click();
    await page.getByRole("button", { name: /退出|Log out|登出/i }).click();
    await expect(page).toHaveURL(/\//, { timeout: 15_000 });

    await page.goto("/login");
    await page.locator('input[type="email"]').fill(E2E_BOOTSTRAP_EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole("button", { name: /登录|Sign in|Log in/i }).click();
    await expect(page).toHaveURL(/\/credits/, { timeout: 45_000 });
  });
});
