/**
 * Removes the fixed E2E bootstrap user so registration is repeatable.
 * Requires DATABASE_URL (loaded via playwright.config.ts dotenv).
 */
import pg from "pg";

const EMAIL = "e2e-bootstrap@test.nove";

export default async function globalSetup() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[e2e] DATABASE_URL not set — skipping DB cleanup (set backend/.env or export DATABASE_URL)");
    return;
  }
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    const r = await c.query("delete from users where email = $1", [EMAIL]);
    console.log(`[e2e] Cleaned bootstrap user rows: ${r.rowCount ?? 0}`);
  } finally {
    await c.end();
  }
}
