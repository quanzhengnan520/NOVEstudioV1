"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useState } from "react";
import { AuthSplitShell } from "@/components/auth/AuthSplitShell";
import { NeonButton } from "@/components/nove/NeonButton";
import { ApiError, apiFetch } from "@/lib/api";
import { mapApiErrorMessage } from "@/lib/errors";
import { useI18n } from "@/lib/i18n/context";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [emailSent, setEmailSent] = useState(true);
  const [scriptReady, setScriptReady] = useState(!SITE_KEY);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (SITE_KEY && !scriptReady) {
      setError(t("auth.recaptchaWait"));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      let captchaToken: string | undefined;
      if (SITE_KEY && window.grecaptcha) {
        captchaToken = await window.grecaptcha.execute(SITE_KEY, { action: "register" });
      }
      const envelope = await apiFetch<{ emailVerificationSent: boolean }>("auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, captchaToken }),
      });
      setEmailSent(Boolean(envelope.data?.emailVerificationSent));
      setDone(true);
    } catch (err) {
      const raw = err instanceof ApiError ? String(err.body.error ?? err.message) : String(err);
      setError(mapApiErrorMessage(raw));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthSplitShell
        footer={
          <Link href="/login" className="text-teal-300/90 hover:text-teal-200">
            {t("auth.loginLink")}
          </Link>
        }
      >
        {emailSent ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-white">{t("auth.verifySentTitle")}</h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              {t("auth.verifySentBody")} <span className="text-teal-200/90">{email}</span>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-white">{t("auth.doneRegisterTitle")}</h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">{t("auth.verifySkipBody")}</p>
          </>
        )}
        <div className="mt-10 flex flex-col gap-3">
          <NeonButton type="button" variant="primary" size="xl" className="w-full" onClick={() => router.push("/credits")}>
            {t("auth.goStudio")}
          </NeonButton>
        </div>
      </AuthSplitShell>
    );
  }

  return (
    <AuthSplitShell
      footer={
        <span>
          {t("auth.hasAccount")}{" "}
          <Link href="/login" className="text-teal-300/90 hover:text-teal-200">
            {t("auth.loginLink")}
          </Link>
        </span>
      }
    >
      {SITE_KEY ? (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}`}
          strategy="afterInteractive"
          onLoad={() => {
            window.grecaptcha?.ready(() => setScriptReady(true));
          }}
        />
      ) : null}

      <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">NOVE Studio</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">{t("auth.registerWelcome")}</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{t("auth.registerLead")}</p>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">{t("auth.registerHint")}</p>

      <form className="mt-8 space-y-5" onSubmit={(e) => void onSubmit(e)}>
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{t("auth.email")}</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder={t("auth.emailPlaceholder")}
            className="mt-2 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-teal-400/35 focus:outline-none focus:ring-1 focus:ring-teal-400/25"
            required
          />
        </div>
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{t("auth.password")}</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            placeholder={t("auth.passwordHint")}
            className="mt-2 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-teal-400/35 focus:outline-none focus:ring-1 focus:ring-teal-400/25"
            required
            minLength={8}
          />
        </div>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <NeonButton
          type="submit"
          variant="primary"
          size="xl"
          className="w-full"
          disabled={loading || (SITE_KEY ? !scriptReady : false)}
          loading={loading}
        >
          {loading ? t("auth.registerLoading") : t("auth.registerTitle")}
        </NeonButton>
      </form>
    </AuthSplitShell>
  );
}
