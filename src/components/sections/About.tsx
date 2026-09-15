"use client";

import Link from "next/link";
import ParallaxImage from "@/components/ParallaxImage";
import ScrollReveal from "@/components/ScrollReveal";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function About() {
  const { t } = useLanguage();

  return (
    <section id="nosotros" className="bg-obsidian-soft px-6 py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 md:grid-cols-[0.9fr_1.1fr]">
        <ScrollReveal className="border-brass/35 relative flex aspect-4/5 items-end overflow-hidden rounded-2xl border p-5.5 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
          <ParallaxImage
            src="/photos/salon-barra-reloj.png"
            alt={t("about.visualCaption")}
            className="absolute inset-0"
            sizes="(max-width: 768px) 100vw, 520px"
            strength={20}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(160deg, rgba(11,13,16,0), rgba(11,13,16,0.55))",
            }}
          />
          <span className="text-cream relative rounded-full bg-[rgba(11,13,16,0.6)] px-3.5 py-2 text-xs tracking-[0.08em] uppercase backdrop-blur-[6px]">
            {t("about.visualCaption")}
          </span>
        </ScrollReveal>

        <ScrollReveal delay={120}>
          <div className="text-brass mb-3 inline-flex items-center gap-2 text-5xl font-semibold tracking-[0.05em] uppercase">
            <span className="bg-brass h-px w-6" />
            {t("about.eyebrow")}
          </div>
          <h2 className="font-display text-cream text-3xl sm:text-4xl">
            {t("about.title")}
          </h2>
          <p className="text-cream-muted mt-4 max-w-lg text-base">
            {t("about.lead")}
          </p>
          <Link
            href="/carta"
            className="hover:border-brass text-cream mt-7 inline-flex rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold transition-colors"
          >
            {t("about.cta")}
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
