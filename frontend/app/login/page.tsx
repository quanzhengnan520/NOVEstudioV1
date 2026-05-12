"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthSplitShell } from "@/components/auth/AuthSplitShell";
import { NeonButton } from "@/components/nove/NeonButton";
import { ApiError, apiFetch } from "@/lib/api";
import { mapApiErrorMessage } from "@/lib/errors";
import { useI18n } from "@/lib/i18n/context";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch<{ user: { id: string; email: string; isAdmin: boolean; creditsBalance: number; emailVerified: boolean } }>(
        "auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) },
      );
      router.push("/credits");
      router.refresh();
    } catch (err) {
      const raw = err instanceof ApiError ? String(err.body.error ?? err.message) : String(err);
      setError(mapApiErrorMessage(raw));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitShell
      footer={
        <span>
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="text-teal-300/90 hover:text-teal-200">
            {t("auth.registerLink")}
          </Link>
          {" · "}
          <Link href="/" className="text-teal-300/90 hover:text-teal-200">
            {t("auth.backHome")}
          </Link>
        </span>
      }
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">NOVE Studio</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">{t("auth.loginWelcome")}</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{t("auth.loginLead")}</p>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">{t("auth.hintLogin")}</p>

      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
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
            autoComplete="current-password"
            placeholder={t("auth.passwordHint")}
            className="mt-2 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-teal-400/35 focus:outline-none focus:ring-1 focus:ring-teal-400/25"
            required
            minLength={8}
          />
        </div>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <NeonButton type="submit" variant="primary" size="xl" className="w-full" disabled={loading} loading={loading}>
          {loading ? t("auth.signInLoading") : t("auth.signIn")}
        </NeonButton>
      </form>
    </AuthSplitShell>
  );
}
