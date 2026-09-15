"use client";

import ParallaxImage from "@/components/ParallaxImage";
import ScrollReveal from "@/components/ScrollReveal";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { PHONE_DISPLAY, CONTACT_EMAIL, ADDRESS_LINE } from "@/lib/config";

const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS_LINE)}&output=embed`;

export default function Location() {
  const { t } = useLanguage();

  return (
    <section
      id="ubicacion"
      className="bg-obsidian-soft relative overflow-hidden px-6 py-24"
    >
      <ParallaxImage
        src="/photos/zona-lounge.png"
        alt=""
        className="absolute inset-0 opacity-35"
        strength={16}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, rgba(20,24,29,0.92), rgba(20,24,29,0.6) 55%, rgba(20,24,29,0.9))",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-12.5 md:grid-cols-[0.9fr_1.1fr]">
        <ScrollReveal className="grid content-start gap-5.5">
          <div className="text-brass inline-flex items-center gap-2 text-5xl font-semibold tracking-[0.05em] uppercase">
            <span className="bg-brass h-px w-6" />
            {t("location.eyebrow")}
          </div>
          <h2 className="font-display text-cream text-3xl sm:text-4xl">
            {t("location.title")}
          </h2>

          <div className="bg-obsidian rounded-2xl border border-white/10 p-5.5">
            <h4 className="text-brass font-sans text-xs font-bold tracking-[0.1em] uppercase">
              {t("location.addressLabel")}
            </h4>
            <p className="text-cream mt-2 text-[15px]">{ADDRESS_LINE}</p>
          </div>
          <div className="bg-obsidian rounded-2xl border border-white/10 p-5.5">
            <h4 className="text-brass font-sans text-xs font-bold tracking-[0.1em] uppercase">
              {t("location.hoursLabel")}
            </h4>
            <p className="text-cream mt-2 text-[15px]">
              {t("location.hoursValue")}
            </p>
          </div>
          <div className="bg-obsidian rounded-2xl border border-white/10 p-5.5">
            <h4 className="text-brass font-sans text-xs font-bold tracking-[0.1em] uppercase">
              {t("location.contactLabel")}
            </h4>
            <p className="text-cream mt-2 text-[15px]">
              {PHONE_DISPLAY} · {CONTACT_EMAIL}
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal
          delay={150}
          className="min-h-[380px] overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
        >
          <iframe
            title="Mapa PON Lounge"
            loading="lazy"
            src={mapSrc}
            className="h-full min-h-[380px] w-full border-0 [filter:saturate(0.8)_contrast(1.05)_brightness(0.95)]"
          />
        </ScrollReveal>
      </div>
    </section>
  );
}
