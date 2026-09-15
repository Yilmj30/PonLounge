"use client";

import Image from "next/image";
import ScrollReveal from "@/components/ScrollReveal";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function EventsSection() {
  const { t } = useLanguage();

  return (
    <section
      id="eventos"
      className="overflow-hidden px-6 py-24"
      style={{
        background:
          "linear-gradient(135deg, #1b1310, var(--color-emerald) 130%)",
      }}
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 md:grid-cols-[1.1fr_0.9fr]">
        <ScrollReveal className="text-center md:text-left">
          <div className="text-brass mb-3 inline-flex items-center justify-center gap-2 text-5xl font-semibold tracking-[0.05em] uppercase md:justify-start">
            <span className="bg-brass h-px w-6" />
            {t("events.eyebrow")}
          </div>
          <h2 className="font-display text-cream text-3xl sm:text-4xl">
            {t("events.title")}
          </h2>
          <p className="text-cream-muted mt-4 text-base">{t("events.lead")}</p>
          <a
            href="#reservas"
            className="from-brass-light to-brass text-obsidian mt-7.5 inline-flex rounded-full bg-gradient-to-br px-7 py-3.5 text-sm font-semibold"
          >
            {t("events.cta")}
          </a>
        </ScrollReveal>

        {/* Aspect ratio matches the photo's natural ratio exactly, so it
            fills the column edge-to-edge with zero cropping — same
            treatment as the About photo, just proportioned for a
            portrait shot. */}
        <ScrollReveal
          delay={120}
          className="border-brass/35 relative mx-auto aspect-[941/1672] w-full max-w-sm overflow-hidden rounded-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
        >
          <Image
            src="/photos/celebracion-barman.png"
            alt={t("events.photoAlt")}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 90vw, 420px"
          />
        </ScrollReveal>
      </div>
    </section>
  );
}
