"use client";

import Link from "next/link";
import { GlassCard } from "@/components/nove/GlassCard";
import { HeroFloatingStage } from "@/components/landing/HeroFloatingStage";
import { LanguageSwitcher } from "@/components/nove/LanguageSwitcher";
import { ModelChipBar } from "@/components/nove/ModelChipBar";
import { NeonButton } from "@/components/nove/NeonButton";
import { SectionHeading } from "@/components/nove/SectionHeading";
import { UserMenu } from "@/components/nove/UserMenu";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/translations";

const nav = [
  { href: "#showcase", key: "landing.navProducts" },
  { href: "#workflow", key: "landing.navWorkflow" },
  { href: "#pricing", key: "landing.navPricing" },
  { href: "/feedback", key: "landing.navFeedback" },
  { href: "#faq", key: "landing.navFaq" },
] as const;

type ShowcaseKind = "video" | "image" | "prompt" | "credits";

function ShowcaseArt({
  kind,
  previewBadge,
  creditsBadge,
}: {
  kind: Exclude<ShowcaseKind, "prompt">;
  previewBadge: string;
  creditsBadge: string;
}) {
  if (kind === "video") {
    return (
      <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-2xl border border-white/[0.08] bg-black/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/25 via-violet-900/35 to-black" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0, transparent 3px, rgba(255,255,255,0.06) 3px, rgba(255,255,255,0.06) 4px)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(94,234,212,0.25),transparent_55%)]" />
        <div className="absolute inset-0 flex items-center justify-center transition duration-500 group-hover:scale-[1.02]">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/10 shadow-[0_0_40px_-8px_rgba(94,234,212,0.55)] backdrop-blur-md transition group-hover:border-teal-300/40 group-hover:shadow-[0_0_48px_-6px_rgba(94,234,212,0.7)]">
            <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 text-white" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          </span>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black via-black/70 to-transparent" />
        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-teal-200/90">
          {previewBadge}
        </div>
      </div>
    );
  }
  if (kind === "image") {
    return (
      <div className="mb-5 grid aspect-[16/10] grid-cols-2 gap-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="rounded-xl bg-gradient-to-br from-violet-500/35 to-fuchsia-900/40 transition duration-500 group-hover:from-violet-400/40" />
        <div className="rounded-xl bg-gradient-to-br from-blue-500/25 to-slate-900/60 transition duration-500 group-hover:from-blue-400/35" />
        <div className="rounded-xl bg-gradient-to-br from-teal-500/20 to-slate-900/50 transition duration-500 group-hover:from-teal-400/30" />
        <div className="rounded-xl bg-gradient-to-br from-amber-500/15 to-violet-950/50 transition duration-500 group-hover:from-amber-400/25" />
      </div>
    );
  }
  return (
    <div className="relative mb-5 flex aspect-[16/10] items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-black/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div
        className="h-28 w-28 rounded-full border border-white/10 bg-[conic-gradient(from_200deg,rgba(94,234,212,0.55)_0deg,rgba(94,234,212,0.55)_110deg,rgba(255,255,255,0.06)_110deg,rgba(255,255,255,0.06)_360deg)] p-[3px] shadow-[0_0_40px_-10px_rgba(94,234,212,0.4)]"
        aria-hidden
      >
        <div className="flex h-full w-full items-center justify-center rounded-full bg-nove-graphite/90 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          {creditsBadge}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(94,234,212,0.12),transparent_50%)]" />
    </div>
  );
}

export function HomeLanding() {
  const { t } = useI18n();
  const en = (key: string) => translate("en", key);

  const chips = [
    t("landing.chipVideo"),
    t("landing.chipImage"),
    t("landing.chipChat"),
    t("landing.chipPrompt"),
    t("landing.chipFast"),
    t("landing.chipQuality"),
  ];

  const showcase: {
    kind: ShowcaseKind;
    titleKey: "landing.featVideoTitle" | "landing.featImageTitle" | "landing.featPromptTitle" | "landing.featCreditsTitle";
    descKey: "landing.featVideoDesc" | "landing.featImageDesc" | "landing.featPromptDesc" | "landing.featCreditsDesc";
    href: string;
  }[] = [
    { kind: "video", titleKey: "landing.featVideoTitle", descKey: "landing.featVideoDesc", href: "/video" },
    { kind: "image", titleKey: "landing.featImageTitle", descKey: "landing.featImageDesc", href: "/image" },
    { kind: "prompt", titleKey: "landing.featPromptTitle", descKey: "landing.featPromptDesc", href: "/prompt" },
    { kind: "credits", titleKey: "landing.featCreditsTitle", descKey: "landing.featCreditsDesc", href: "/credits" },
  ];

  const pipeline = [
    { n: "01", titleKey: "landing.pipe1t", bodyKey: "landing.pipe1b" },
    { n: "02", titleKey: "landing.pipe2t", bodyKey: "landing.pipe2b" },
    { n: "03", titleKey: "landing.pipe3t", bodyKey: "landing.pipe3b" },
    { n: "04", titleKey: "landing.pipe4t", bodyKey: "landing.pipe4b" },
  ] as const;

  const pricing: {
    nameKey: "landing.priceStarter" | "landing.priceCreator" | "landing.priceStudio";
    metaKey: "landing.priceStarterMeta" | "landing.priceCreatorMeta" | "landing.priceStudioMeta";
    descKey: "landing.priceStarterDesc" | "landing.priceCreatorDesc" | "landing.priceStudioDesc";
    cta: string;
    featured?: boolean;
  }[] = [
    { nameKey: "landing.priceStarter", metaKey: "landing.priceStarterMeta", descKey: "landing.priceStarterDesc", cta: "/register" },
    {
      nameKey: "landing.priceCreator",
      metaKey: "landing.priceCreatorMeta",
      descKey: "landing.priceCreatorDesc",
      cta: "/credits",
      featured: true,
    },
    { nameKey: "landing.priceStudio", metaKey: "landing.priceStudioMeta", descKey: "landing.priceStudioDesc", cta: "/credits" },
  ];

  const faqKeys = [
    { q: "landing.faq1q", a: "landing.faq1a" },
    { q: "landing.faq2q", a: "landing.faq2a" },
    { q: "landing.faq3q", a: "landing.faq3a" },
    { q: "landing.faq4q", a: "landing.faq4a" },
  ] as const;

  return (
    <div className="relative min-h-screen overflow-hidden bg-nove-ink">
      <div className="pointer-events-none absolute inset-0 nove-mesh-bg opacity-90" />
      <div className="pointer-events-none absolute -left-1/4 top-0 h-[min(80vh,720px)] w-[min(90vw,900px)] animate-aurora-shift rounded-full bg-gradient-to-br from-violet-600/30 via-transparent to-teal-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-1/4 bottom-0 h-[min(70vh,600px)] w-[min(85vw,800px)] animate-aurora-shift rounded-full bg-gradient-to-tl from-blue-600/25 via-transparent to-teal-400/15 blur-3xl [animation-delay:-6s]" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.5)_100%)]" />
      <div className="pointer-events-none absolute left-[12%] top-0 h-[70vh] w-px bg-gradient-to-b from-transparent via-white/[0.04] to-transparent" />
      <div className="pointer-events-none absolute right-[14%] top-0 h-[65vh] w-px bg-gradient-to-b from-transparent via-teal-300/[0.05] to-transparent" />

      <header className="relative z-20 border-b border-white/[0.06] bg-nove-ink/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-landing items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="group/logo flex items-center gap-2 transition duration-300 ease-out hover:opacity-95">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-violet-500 text-sm font-bold text-nove-ink shadow-glow transition duration-300 ease-out group-hover/logo:rotate-[2deg] group-hover/logo:shadow-[0_0_32px_-4px_rgba(94,234,212,0.55),0_0_36px_-6px_rgba(139,92,246,0.35)]">
              N
            </span>
            <span className="text-lg font-semibold tracking-tight text-white">
              NOVE <span className="text-slate-400">Studio</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-400 md:flex lg:gap-8">
            {nav.map((n) =>
              n.href.startsWith("/") ? (
                <Link key={n.href} href={n.href} className="transition hover:text-white">
                  {t(n.key)}
                </Link>
              ) : (
                <a key={n.href} href={n.href} className="transition hover:text-white">
                  {t(n.key)}
                </a>
              ),
            )}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto flex min-h-[92vh] max-w-landing flex-col justify-center gap-12 px-4 pb-20 pt-10 sm:gap-14 sm:px-6 sm:pb-24 sm:pt-12">
          <div className="mx-auto w-full max-w-5xl text-center">
            <p className="nove-eyebrow">{en("landing.heroEyebrow")}</p>
            <h1 className="nove-hero-title mx-auto mt-6 max-w-[22ch]">
              <span className="nove-text-gradient-neon">{en("landing.heroH1a")}</span>
              <br />
              <span className="nove-text-gradient">{en("landing.heroH1b")}</span>
            </h1>
            <p className="nove-description mx-auto mt-8 max-w-2xl text-base font-medium sm:text-lg">{t("landing.heroBulletsLine")}</p>
            <p className="nove-description mx-auto mt-4 max-w-2xl text-sm sm:text-base">{t("landing.heroHelp")}</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <NeonButton href="/video" variant="primary" className="min-w-[10rem] px-8 py-3 text-base">
                {t("landing.cta1Main")}
              </NeonButton>
              <NeonButton href="/history" variant="secondary" className="min-w-[10rem] px-8 py-3 text-base">
                {t("landing.cta2Main")}
              </NeonButton>
            </div>
            <div className="mt-12">
              <ModelChipBar chips={chips} />
            </div>
          </div>
          <HeroFloatingStage />
        </section>

        <div className="pointer-events-none relative -mt-4 h-28 overflow-hidden sm:h-36">
          <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-transparent via-violet-500/[0.07] to-transparent blur-3xl" />
          <div className="absolute inset-x-[10%] top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        </div>

        <section
          id="showcase"
          className="relative scroll-mt-24 bg-gradient-to-b from-nove-ink via-violet-950/[0.12] to-nove-ink py-28 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44 -translate-y-12 bg-gradient-to-b from-teal-500/[0.08] via-transparent to-transparent blur-3xl" />
          <div className="mx-auto max-w-landing px-4 sm:px-6">
            <SectionHeading eyebrow={t("landing.sceneEyebrow")} title={t("landing.sceneTitle")} subtitle={t("landing.sceneSubtitle")} />
            <div className="mt-14 grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
              {showcase.map((c) => (
                <Link key={c.titleKey} href={c.href} className="group block">
                  <div className="h-full rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.05] to-black/35 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur-xl transition duration-300 ease-out hover:-translate-y-[2px] hover:border-teal-400/25 hover:from-white/[0.09] hover:shadow-[0_32px_90px_-40px_rgba(94,234,212,0.3)]">
                    {c.kind === "prompt" ? (
                      <div className="mb-6 space-y-2 rounded-2xl border border-white/[0.06] bg-black/35 p-4 font-mono text-[11px] leading-relaxed sm:text-xs">
                        <p className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-slate-500 line-through decoration-slate-600">
                          {t("landing.peekBefore")}
                        </p>
                        <p className="rounded-xl border border-teal-400/15 bg-teal-500/10 px-3 py-2 text-teal-100/95">{t("landing.peekAfter")}</p>
                      </div>
                    ) : (
                      <ShowcaseArt kind={c.kind} previewBadge={t("landing.previewBadge")} creditsBadge={t("landing.creditsBadge")} />
                    )}
                    <h3 className="text-xl font-semibold tracking-tight text-white">{t(c.titleKey)}</h3>
                    <p className="nove-description mt-3 text-sm">{t(c.descKey)}</p>
                    <p className="mt-6 text-xs font-medium text-teal-300/90">{t("landing.featOpen")}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="relative scroll-mt-24 py-28">
          <div className="pointer-events-none absolute inset-x-0 -top-16 h-40 bg-gradient-to-b from-teal-500/[0.06] via-violet-500/[0.05] to-transparent blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-violet-500/[0.06] via-transparent to-transparent blur-2xl" />
          <div className="relative mx-auto max-w-landing px-4 sm:px-6">
            <SectionHeading
              eyebrow={t("landing.pipelineEyebrow")}
              title={t("landing.pipelineTitle")}
              subtitle={t("landing.pipelineSubtitle")}
              align="center"
            />
            <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {pipeline.map((s) => (
                <GlassCard
                  key={s.n}
                  className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 text-center shadow-[0_0_48px_-32px_rgba(94,234,212,0.2)]"
                >
                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-teal-400/10 blur-2xl" />
                  <p className="text-xs font-mono text-teal-400/80">{s.n}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{t(s.titleKey)}</h3>
                  <p className="mt-2 text-sm text-slate-400">{t(s.bodyKey)}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <div className="pointer-events-none relative h-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-transparent blur-2xl" />
        </div>

        <section id="pricing" className="relative scroll-mt-24 bg-gradient-to-b from-nove-ink via-black/40 to-nove-ink py-28">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-teal-500/[0.05] via-transparent to-transparent blur-3xl" />
          <div className="relative mx-auto max-w-landing px-4 sm:px-6">
            <SectionHeading eyebrow={t("landing.passEyebrow")} title={t("landing.passTitle")} subtitle={t("landing.passSubtitle")} align="center" />
            <div className="mx-auto mt-14 flex max-w-5xl flex-col items-stretch gap-6 md:flex-row md:items-stretch md:justify-center md:gap-5">
              {pricing.map((p) => (
                <GlassCard
                  key={p.nameKey}
                  className={`relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/[0.06] p-7 transition duration-300 md:min-w-0 md:max-w-[340px] ${
                    p.featured
                      ? "z-10 border-teal-400/20 shadow-[0_0_64px_-24px_rgba(94,234,212,0.38)] md:scale-[1.06] md:px-9 md:py-10"
                      : "opacity-[0.92] md:translate-y-2"
                  }`}
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent opacity-60" />
                  {p.featured ? (
                    <div className="absolute right-4 top-4 flex flex-col items-end gap-1">
                      <span className="rounded-full bg-teal-400/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-100">
                        {t("landing.pricePopular")}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">{t("landing.priceCreatorHeadline")}</span>
                    </div>
                  ) : null}
                  <h3 className={`relative font-semibold text-white ${p.featured ? "text-2xl" : "text-xl"}`}>{t(p.nameKey)}</h3>
                  <p className={`relative mt-2 text-teal-200/90 ${p.featured ? "text-base" : "text-sm"}`}>{t(p.metaKey)}</p>
                  <p className="relative mt-4 flex-1 text-sm leading-relaxed text-slate-400">{t(p.descKey)}</p>
                  <div className="relative mt-8">
                    <NeonButton href={p.cta} variant={p.featured ? "primary" : "secondary"} className="w-full">
                      {t("landing.priceCta")}
                    </NeonButton>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="relative scroll-mt-24 py-28 pb-32">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/50 via-transparent to-transparent blur-2xl" />
          <div className="relative mx-auto max-w-landing px-4 sm:px-6">
            <SectionHeading eyebrow={t("landing.faqEyebrow")} title={t("landing.faqTitle")} subtitle={t("landing.faqSubtitle")} align="center" />
            <div className="mx-auto mt-12 max-w-3xl space-y-4">
              {faqKeys.map((f) => (
                <GlassCard key={f.q} className="p-5" hover={false}>
                  <h3 className="font-medium text-white">{t(f.q)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{t(f.a)}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-white/[0.06] bg-black/30 py-10">
          <div className="mx-auto flex max-w-landing flex-col items-center justify-between gap-4 px-4 text-center text-sm text-slate-500 sm:flex-row sm:text-left sm:px-6">
            <p>
              © {new Date().getFullYear()} {t("landing.footerCopy")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/feedback" className="hover:text-teal-300">
                {t("landing.footerFeedback")}
              </Link>
              <Link href="/login" className="hover:text-teal-300">
                {t("landing.footerLogin")}
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
