"use client";

import Link from "next/link";
import ParallaxImage from "@/components/ParallaxImage";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function CartaHero() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden px-6 pt-40 pb-10 text-center">
      <ParallaxImage
        src="/photos/salon-barra-reloj.png"
        alt=""
        className="absolute inset-0 opacity-30"
        strength={16}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,12,0.88), var(--color-obsidian))",
        }}
      />
      <div className="relative mx-auto max-w-3xl">
        <div className="text-brass mb-3.5 inline-flex items-center justify-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase">
          <span className="bg-brass h-px w-6" />
          {t("menu.eyebrow")}
        </div>
        <h1 className="font-display text-cream text-[clamp(32px,5vw,52px)]">
          {t("cartaPage.title")}
        </h1>
        <p className="text-cream-muted mx-auto mt-3.5 max-w-lg">
          {t("cartaPage.lead")}
        </p>
        <Link
          href="/"
          className="text-cream-muted hover:text-brass-light mt-5 inline-flex items-center gap-2 text-sm"
        >
          {t("cartaPage.back")}
        </Link>
      </div>
    </section>
  );
}
