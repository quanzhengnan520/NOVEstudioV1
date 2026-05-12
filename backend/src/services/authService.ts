import type { PoolClient } from "pg";
import { env } from "../config/env.js";
import { getPool } from "../db/pool.js";
import { HttpError } from "../lib/httpError.js";
import { signAccessToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { randomToken, sha256Hex } from "../lib/tokens.js";
import {
  createEmailVerification,
  verifyEmailToken as consumeEmailVerificationToken,
} from "./emailVerificationService.js";
import { grantCredits } from "./creditsService.js";
import { verifyRecaptchaToken } from "./recaptchaService.js";
import { assertRegistrationIpAllowed, recordRegistrationIp } from "./registrationIpService.js";

async function insertRefreshToken(client: PoolClient, userId: string, raw: string): Promise<void> {
  const tokenHash = sha256Hex(raw);
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlSec * 1000);
  await client.query(
    `
    insert into refresh_tokens (user_id, token_hash, expires_at)
    values ($1, $2, $3)
    `,
    [userId, tokenHash, expiresAt.toISOString()],
  );
}

async function issueAccessForUser(
  client: PoolClient,
  userId: string,
): Promise<{ email: string; isAdmin: boolean; creditsBalance: number; emailVerified: boolean }> {
  const u = await client.query<{
    email: string;
    is_admin: boolean;
    credits_balance: number;
    email_verified: boolean;
  }>(
    `
    select email, is_admin, credits_balance, (email_verified_at is not null) as email_verified
    from users
    where id = $1
    `,
    [userId],
  );
  if (u.rowCount === 0) throw new HttpError(401, "User not found");
  const row = u.rows[0];
  return {
    email: row.email,
    isAdmin: row.is_admin,
    creditsBalance: row.credits_balance,
    emailVerified: row.email_verified,
  };
}

export async function registerUser(
  emailRaw: string,
  password: string,
  opts: { captchaToken?: string; ip: string },
): Promise<{
  accessToken: string;
  refreshRaw: string;
  user: {
    id: string;
    email: string;
    isAdmin: boolean;
    creditsBalance: number;
    emailVerified: boolean;
  };
  emailVerificationSent: boolean;
}> {
  const email = emailRaw.trim().toLowerCase();
  if (!email || !email.includes("@")) throw new HttpError(400, "Invalid email");
  if (password.length < 8) throw new HttpError(400, "Password must be at least 8 characters");

  await verifyRecaptchaToken(opts.captchaToken, opts.ip);

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    await assertRegistrationIpAllowed(client, opts.ip);

    const isBootstrapAdmin =
      env.bootstrapAdminEmail.length > 0 && email === env.bootstrapAdminEmail;

    const created = await client.query<{ id: string }>(
      `
      insert into users (email, password_hash, is_admin, credits_balance, email_verified_at)
      values ($1, $2, $3, 0, CASE WHEN $4::boolean THEN now() ELSE null END)
      returning id
      `,
      [email, await hashPassword(password), isBootstrapAdmin, isBootstrapAdmin],
    );
    const userId = created.rows[0].id;

    await grantCredits(client, userId, env.initialSignupCredits, "initial_signup", {
      initial: env.initialSignupCredits,
    });

    const refreshRaw = randomToken(48);
    await insertRefreshToken(client, userId, refreshRaw);

    let emailVerificationSent = false;
    if (!isBootstrapAdmin) {
      await createEmailVerification(client, userId, email);
      emailVerificationSent = true;
    }

    await recordRegistrationIp(client, opts.ip);

    const profile = await issueAccessForUser(client, userId);
    const accessToken = signAccessToken({
      sub: userId,
      email: profile.email,
      adm: profile.isAdmin,
      ev: profile.emailVerified,
    });

    await client.query("commit");
    return {
      accessToken,
      refreshRaw,
      emailVerificationSent,
      user: {
        id: userId,
        email: profile.email,
        isAdmin: profile.isAdmin,
        creditsBalance: profile.creditsBalance,
        emailVerified: profile.emailVerified,
      },
    };
  } catch (e: unknown) {
    await client.query("rollback");
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "23505") {
      throw new HttpError(409, "Email already registered");
    }
    throw e;
  } finally {
    client.release();
  }
}

export async function loginUser(
  emailRaw: string,
  password: string,
): Promise<{
  accessToken: string;
  refreshRaw: string;
  user: {
    id: string;
    email: string;
    isAdmin: boolean;
    creditsBalance: number;
    emailVerified: boolean;
  };
}> {
  const email = emailRaw.trim().toLowerCase();
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const u = await client.query<{
      id: string;
      password_hash: string;
    }>(`select id, password_hash from users where email = $1 for update`, [email]);
    if (u.rowCount === 0) throw new HttpError(401, "Invalid email or password");
    const row = u.rows[0];
    const ok = await verifyPassword(password, row.password_hash);
    if (!ok) throw new HttpError(401, "Invalid email or password");

    const refreshRaw = randomToken(48);
    await insertRefreshToken(client, row.id, refreshRaw);

    const profile = await issueAccessForUser(client, row.id);
    const accessToken = signAccessToken({
      sub: row.id,
      email: profile.email,
      adm: profile.isAdmin,
      ev: profile.emailVerified,
    });

    await client.query("commit");
    return {
      accessToken,
      refreshRaw,
      user: {
        id: row.id,
        email: profile.email,
        isAdmin: profile.isAdmin,
        creditsBalance: profile.creditsBalance,
        emailVerified: profile.emailVerified,
      },
    };
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

export async function refreshSession(refreshRaw: string | undefined): Promise<{
  accessToken: string;
  refreshRaw: string;
  user: {
    id: string;
    email: string;
    isAdmin: boolean;
    creditsBalance: number;
    emailVerified: boolean;
  };
}> {
  if (!refreshRaw) throw new HttpError(401, "Missing refresh token");

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const hash = sha256Hex(refreshRaw);
    const cur = await client.query<{ id: string; user_id: string }>(
      `
      select id, user_id
      from refresh_tokens
      where token_hash = $1
        and revoked_at is null
        and expires_at > now()
      for update
      `,
      [hash],
    );
    if (cur.rowCount === 0) throw new HttpError(401, "Invalid refresh token");

    const tokenId = cur.rows[0].id;
    const userId = cur.rows[0].user_id;

    await client.query(`update refresh_tokens set revoked_at = now() where id = $1`, [tokenId]);

    const newRefresh = randomToken(48);
    await insertRefreshToken(client, userId, newRefresh);

    const profile = await issueAccessForUser(client, userId);
    const accessToken = signAccessToken({
      sub: userId,
      email: profile.email,
      adm: profile.isAdmin,
      ev: profile.emailVerified,
    });

    await client.query("commit");
    return {
      accessToken,
      refreshRaw: newRefresh,
      user: {
        id: userId,
        email: profile.email,
        isAdmin: profile.isAdmin,
        creditsBalance: profile.creditsBalance,
        emailVerified: profile.emailVerified,
      },
    };
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  const pool = getPool();
  await pool.query(`update refresh_tokens set revoked_at = now() where user_id = $1 and revoked_at is null`, [
    userId,
  ]);
}

export async function findUserIdByActiveRefresh(refreshRaw: string | undefined): Promise<string | null> {
  if (!refreshRaw) return null;
  const pool = getPool();
  const hash = sha256Hex(refreshRaw);
  const r = await pool.query<{ user_id: string }>(
    `
    select user_id
    from refresh_tokens
    where token_hash = $1
      and revoked_at is null
      and expires_at > now()
    limit 1
    `,
    [hash],
  );
  if (r.rowCount === 0) return null;
  return r.rows[0].user_id;
}

export async function resendVerificationEmail(userId: string): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const u = await client.query<{ email: string; email_verified: boolean }>(
      `
      select email, (email_verified_at is not null) as email_verified
      from users
      where id = $1
      for update
      `,
      [userId],
    );
    if (u.rowCount === 0) throw new HttpError(404, "User not found");
    if (u.rows[0].email_verified) {
      throw new HttpError(400, "EMAIL_ALREADY_VERIFIED");
    }
    await client.query(
      `update email_verification_tokens set used_at = now() where user_id = $1 and used_at is null`,
      [userId],
    );
    await createEmailVerification(client, userId, u.rows[0].email);
    await client.query("commit");
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

export async function verifyEmailWithToken(rawToken: string): Promise<{ userId: string }> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await consumeEmailVerificationToken(client, rawToken);
    await client.query("commit");
    return result;
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}
