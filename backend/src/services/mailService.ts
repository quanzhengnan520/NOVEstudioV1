import nodemailer from "nodemailer";
import { env } from "../config/env.js";

export async function sendVerificationEmail(to: string, subject: string, html: string): Promise<void> {
  if (!env.smtpHost) {
    if (env.devLogEmails || !env.isProd) {
      console.log(`[email] to=${to} subject=${subject}\n${html.replace(/<[^>]+>/g, " ").trim()}`);
    }
    if (env.isProd && !env.smtpHost) {
      throw new Error("SMTP_HOST is required in production to send verification emails");
    }
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth:
      env.smtpUser && env.smtpPass
        ? {
            user: env.smtpUser,
            pass: env.smtpPass,
          }
        : undefined,
  });

  await transporter.sendMail({
    from: env.smtpFrom || env.smtpUser,
    to,
    subject,
    html,
  });
}
