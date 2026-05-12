import type { PoolClient } from "pg";
import { env } from "../config/env.js";
import { HttpError } from "../lib/httpError.js";
import { randomToken, sha256Hex } from "../lib/tokens.js";
import { sendVerificationEmail } from "./mailService.js";

export async function createEmailVerification(
  client: PoolClient,
  userId: string,
  email: string,
): Promise<{ rawToken: string }> {
  const rawToken = randomToken(32);
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + env.emailVerificationTtlHours * 60 * 60 * 1000);

  await client.query(
    `
    insert into email_verification_tokens (user_id, token_hash, expires_at)
    values ($1, $2, $3)
    `,
    [userId, tokenHash, expiresAt.toISOString()],
  );

  const verifyUrl = `${env.frontendOrigin.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(rawToken)}`;
  const subject = "请验证您的 NOVE Studio 邮箱";
  const html = `
    <p>您好，</p>
    <p>请点击以下链接完成邮箱验证（${env.emailVerificationTtlHours} 小时内有效）：</p>
    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    <p>验证前无法使用积分消费功能。</p>
  `;
  await sendVerificationEmail(email, subject, html);

  return { rawToken };
}

export async function verifyEmailToken(client: PoolClient, rawToken: string): Promise<{ userId: string }> {
  const tokenHash = sha256Hex(rawToken);
  const row = await client.query<{ id: string; user_id: string }>(
    `
    select id, user_id
    from email_verification_tokens
    where token_hash = $1
      and used_at is null
      and expires_at > now()
    for update
    `,
    [tokenHash],
  );
  if (row.rowCount === 0) {
    throw new HttpError(400, "INVALID_OR_EXPIRED_VERIFICATION_TOKEN");
  }

  const tokenId = row.rows[0].id;
  const userId = row.rows[0].user_id;

  await client.query(`update email_verification_tokens set used_at = now() where id = $1`, [tokenId]);
  await client.query(`update users set email_verified_at = now(), updated_at = now() where id = $1`, [userId]);

  return { userId };
}
