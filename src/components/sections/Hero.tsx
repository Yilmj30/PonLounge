"use client";

import ParallaxImage from "@/components/ParallaxImage";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section
      id="top"
      className="bg-obsidian relative flex min-h-screen items-center overflow-hidden"
    >
      <ParallaxImage
        src="/photos/hero-reloj-tiempo.png"
        alt=""
        priority
        className="absolute inset-0 opacity-55"
        strength={18}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, rgba(11,13,16,0.94) 0%, rgba(11,13,16,0.8) 40%, rgba(11,13,16,0.4) 75%, rgba(11,13,16,0.15) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 15% 20%, rgba(185,141,75,0.14), transparent 55%), radial-gradient(ellipse at 85% 75%, rgba(22,52,43,0.35), transparent 55%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl px-6 pt-40 pb-20">
        <div className="max-w-2xl">
          <div className="text-brass mb-6 inline-flex items-center gap-2 text-5xl font-semibold tracking-[0.01em] uppercase">
            <span className="bg-brass h-px w-6" />
            {t("hero.eyebrow")}
          </div>

          <h1 className="font-display text-cream text-4xl leading-[1.08] sm:text-5xl md:text-6xl">
            {t("hero.title")}
            <br />
            <em className="text-brass-light italic not-italic">
              {t("hero.titleEm")}
            </em>
          </h1>

          <p className="text-cream-muted mt-6 max-w-lg text-lg">
            {t("hero.lead")}
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="/carta"
              className="from-brass-light to-brass text-obsidian shadow-brass-deep/30 rounded-full bg-gradient-to-br px-7 py-3.5 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5"
            >
              {t("hero.ctaPrimary")}
            </a>
            <a
              href="#reservas"
              className="text-cream hover:border-brass rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold transition-colors"
            >
              {t("hero.ctaSecondary")}
            </a>
          </div>

          <div className="mt-18 grid max-w-[620px] grid-cols-3 gap-10 border-t border-white/10 pt-7">
            <div>
              <strong className="font-display text-brass-light block text-2xl">
                4.9★
              </strong>
              <span className="text-cream-muted text-xs tracking-[0.05em] uppercase">
                {t("hero.statReviews")}
              </span>
            </div>
            <div>
              <strong className="font-display text-brass-light block text-2xl">
                +30
              </strong>
              <span className="text-cream-muted text-xs tracking-[0.05em] uppercase">
                {t("hero.statCapacity")}
              </span>
            </div>
            <div>
              <strong className="font-display text-brass-light block text-2xl">
                16:00–00:00
              </strong>
              <span className="text-cream-muted text-xs tracking-[0.05em] uppercase">
                {t("hero.statHours")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
