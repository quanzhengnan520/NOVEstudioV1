"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/nove/LanguageSwitcher";
import { NeonButton } from "@/components/nove/NeonButton";
import { ApiError, apiFetch } from "@/lib/api";
import { mapApiErrorMessage } from "@/lib/errors";
import { useI18n } from "@/lib/i18n/context";

type Me = { email: string; isAdmin: boolean };

const FEEDBACK_PATH = "/feedback";

export default function FeedbackPage() {
  const { t } = useI18n();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [auth, setAuth] = useState<"loading" | "guest" | "user">("loading");

  useEffect(() => {
    void (async () => {
      try {
        await apiFetch<Me>("auth/me", { method: "GET" });
        setAuth("user");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) setAuth("guest");
        else setAuth("guest");
      }
    })();
  }, []);

  const loginHref = `/login?next=${encodeURIComponent(FEEDBACK_PATH)}`;
  const registerHref = `/register?next=${encodeURIComponent(FEEDBACK_PATH)}`;

  async function submit() {
    const text = message.trim();
    if (!text || busy) return;
    setBusy(true);
    setErr(null);
    setDoneId(null);
    try {
      const env = await apiFetch<{ id: string }>("feedback", {
        method: "POST",
        body: JSON.stringify({ message: text, context: { source: "nove-studio-web" } }),
      });
      setDoneId(env.data?.id ?? "");
      setMessage("");
    } catch (e) {
      const raw = e instanceof ApiError ? String(e.body.error ?? e.message) : String(e);
      setErr(mapApiErrorMessage(raw));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-nove-ink">
      <div className="pointer-events-none absolute inset-0 nove-mesh-bg opacity-90" />
      <div className="pointer-events-none absolute -left-1/4 top-0 h-[min(70vh,560px)] w-[min(88vw,720px)] animate-aurora-shift rounded-full bg-gradient-to-br from-violet-600/25 via-transparent to-teal-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-1/4 bottom-0 h-[min(55vh,480px)] w-[min(80vw,640px)] animate-aurora-shift rounded-full bg-gradient-to-tl from-blue-600/18 via-transparent to-teal-400/10 blur-3xl [animation-delay:-5s]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(0,0,0,0.55)_100%)]" />

      <header className="relative z-20 border-b border-white/[0.06] bg-nove-graphite/95">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-medium text-slate-300 transition hover:text-white">
            ← {t("feedback.backHome")}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {auth === "user" ? (
              <Link
                href="/video"
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-teal-400/25 hover:text-white"
              >
                {t("feedback.toWorkspace")}
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-xl px-4 py-10 pb-24 sm:px-6 sm:py-14">
        <div className="rounded-2xl border border-white/[0.08] bg-nove-graphite/95 p-6 shadow-inner-glow ring-1 ring-white/[0.04] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-nove-mist">{t("feedback.pageEyebrow")}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{t("feedback.pageTitle")}</h1>

          {auth === "loading" ? <p className="mt-6 text-sm text-slate-500">{t("feedback.loading")}</p> : null}

          {auth === "guest" ? (
            <div className="mt-6">
              <p className="text-sm leading-relaxed text-slate-400">{t("feedback.guestBody")}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Link
                  href={loginHref}
                  className="inline-flex items-center justify-center rounded-full bg-nove-accent px-6 py-2.5 text-center text-sm font-semibold text-nove-ink transition hover:opacity-95"
                >
                  {t("feedback.goLogin")}
                </Link>
                <Link
                  href={registerHref}
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-6 py-2.5 text-center text-sm font-medium text-white transition hover:bg-white/[0.08]"
                >
                  {t("feedback.goRegister")}
                </Link>
              </div>
            </div>
          ) : null}

          {auth === "user" ? (
            <div className="mt-6">
              <p className="text-sm leading-relaxed text-slate-400">{t("feedback.pageLeadSigned")}</p>
              {err ? <p className="mt-4 text-sm text-red-300">{err}</p> : null}
              {doneId ? (
                <p className="mt-4 text-sm text-teal-200/95">
                  {t("feedback.successThanks")}{" "}
                  <span className="font-mono text-xs text-teal-100/90">{doneId || "—"}</span>
                </p>
              ) : null}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={7}
                maxLength={8000}
                className="mt-6 w-full resize-y rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm leading-relaxed text-white placeholder:text-slate-600 focus:border-teal-400/30 focus:outline-none focus:ring-1 focus:ring-teal-400/20"
                placeholder={t("feedback.placeholder")}
              />
              <p className="mt-2 text-right text-[11px] text-slate-600">{message.length} / 8000</p>
              <NeonButton
                type="button"
                variant="primary"
                className="mt-4 w-full sm:w-auto"
                disabled={busy || !message.trim()}
                loading={busy}
                onClick={() => void submit()}
              >
                {busy ? t("feedback.submitting") : t("feedback.submit")}
              </NeonButton>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
