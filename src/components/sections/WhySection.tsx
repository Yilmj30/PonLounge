"use client";

import ParallaxImage from "@/components/ParallaxImage";
import ScrollReveal from "@/components/ScrollReveal";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const cards = [
  { icon: "✦", titleKey: "why.f1Title", descKey: "why.f1Desc" },
  { icon: "◆", titleKey: "why.f2Title", descKey: "why.f2Desc" },
  { icon: "♛", titleKey: "why.f3Title", descKey: "why.f3Desc" },
  { icon: "⚜", titleKey: "why.f4Title", descKey: "why.f4Desc" },
] as const;

export default function WhySection() {
  const { t } = useLanguage();

  return (
    <section className="bg-obsidian-soft relative overflow-hidden px-6 py-24">
      <ParallaxImage
        src="/photos/reloj-engranajes.png"
        alt=""
        className="absolute inset-0 opacity-40"
        strength={16}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(20,24,29,0.6), rgba(20,24,29,0.9))",
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <ScrollReveal className="mx-auto mb-12 max-w-xl text-center">
          <div className="text-brass mb-3 inline-flex items-center justify-center gap-2 text-5xl font-semibold tracking-[0.04em] uppercase">
            <span className="bg-brass h-px w-6" />
            {t("why.eyebrow")}
          </div>
          <h2 className="font-display text-cream text-3xl sm:text-4xl">
            {t("why.title")}
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <ScrollReveal key={card.titleKey} delay={i * 90}>
              <div className="hover:border-brass/35 bg-obsidian rounded-2xl border border-white/10 p-7 text-center transition-transform hover:-translate-y-1">
                <div className="font-display text-brass mb-3.5 text-2xl">
                  {card.icon}
                </div>
                <h4 className="text-cream text-base">{t(card.titleKey)}</h4>
                <p className="text-cream-muted mt-2 text-sm">
                  {t(card.descKey)}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
