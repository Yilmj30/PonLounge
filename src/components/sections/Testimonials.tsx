"use client";

import ParallaxImage from "@/components/ParallaxImage";
import ScrollReveal from "@/components/ScrollReveal";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const testimonials = [
  { qKey: "testimonials.q1", aKey: "testimonials.a1" },
  { qKey: "testimonials.q2", aKey: "testimonials.a2" },
  { qKey: "testimonials.q3", aKey: "testimonials.a3" },
] as const;

export default function Testimonials() {
  const { t } = useLanguage();

  return (
    <section className="bg-obsidian-soft relative overflow-hidden px-6 py-24">
      <ParallaxImage
        src="/photos/relojes-colgantes.png"
        alt=""
        className="absolute inset-0 opacity-35"
        strength={16}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(20,24,29,0.65), rgba(20,24,29,0.9))",
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <ScrollReveal className="mx-auto mb-12 max-w-xl text-center">
          <div className="text-brass mb-3 inline-flex items-center justify-center gap-2 text-5xl font-semibold tracking-[0.05em] uppercase">
            <span className="bg-brass h-px w-6" />
            {t("testimonials.eyebrow")}
          </div>
          <h2 className="font-display text-cream text-3xl sm:text-4xl">
            {t("testimonials.title")}
          </h2>
          <p className="text-cream-muted mt-3 text-[13px] italic opacity-70">
            {t("testimonials.sampleNote")}
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((item, i) => (
            <ScrollReveal key={item.qKey} delay={i * 90}>
              <blockquote className="border-brass bg-obsidian rounded-r-2xl border-l-[3px] p-6.5 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                <p className="text-cream text-[15px] italic">{t(item.qKey)}</p>
                <cite className="text-brass-light mt-4 block text-xs font-bold tracking-[0.04em] uppercase not-italic">
                  {t(item.aKey)}
                </cite>
              </blockquote>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
