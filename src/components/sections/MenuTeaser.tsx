"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { MenuItem } from "@/data/menu";
import MenuItemPhoto from "@/components/MenuItemPhoto";
import ParallaxImage from "@/components/ParallaxImage";
import ScrollReveal from "@/components/ScrollReveal";

export default function MenuTeaser({ items }: { items: MenuItem[] }) {
  const { lang, t } = useLanguage();

  return (
    <section
      id="carta-teaser"
      className="bg-obsidian relative overflow-hidden px-6 py-24"
    >
      <ParallaxImage
        src="/photos/pared-relojes-noche.png"
        alt=""
        className="absolute inset-0 opacity-35"
        strength={16}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, rgba(11,13,16,0.92), rgba(11,13,16,0.65) 55%, rgba(11,13,16,0.9))",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 md:grid-cols-[1.05fr_0.95fr]">
        <ScrollReveal>
          <div className="text-brass mb-3 inline-flex items-center gap-2 text-5xl font-semibold tracking-[0.05em] uppercase">
            <span className="bg-brass h-px w-6" />
            {t("menu.eyebrow")}
          </div>
          <h2 className="font-display text-cream text-3xl sm:text-4xl">
            {t("menu.title")}
          </h2>
          <p className="text-cream-muted mt-3.5 max-w-lg">{t("menu.lead")}</p>

          <Link
            href="/carta"
            className="from-brass-light to-brass text-obsidian mt-6.5 inline-flex rounded-full bg-gradient-to-br px-7 py-3.5 text-sm font-semibold"
          >
            {t("menu.ctaFull")}
          </Link>

          <div className="border-brass/35 bg-brass/[0.06] text-cream-muted mt-6 flex items-start gap-3 rounded-2xl border border-dashed p-4.5 text-[13px]">
            <span
              aria-hidden="true"
              className="border-brass/35 grid h-[30px] w-[30px] flex-none grid-cols-3 grid-rows-3 gap-0.5 rounded-md border p-[3px]"
            >
              {Array.from({ length: 9 }, (_, i) => (
                <span
                  key={i}
                  className={i % 2 === 0 ? "bg-brass-light rounded-[1px]" : ""}
                />
              ))}
            </span>
            <span>{t("menu.qrNote")}</span>
          </div>
        </ScrollReveal>

        <div className="grid gap-4.5">
          {items.map((item, i) => (
            <ScrollReveal key={item.id ?? item.name_es} delay={120 + i * 90}>
              <div className="bg-obsidian-soft flex items-center gap-4.5 rounded-2xl border border-white/10 p-4.5">
                <MenuItemPhoto
                  image={item.image}
                  alt={item[`name_${lang}`]}
                  className="aspect-square w-[76px] flex-none"
                />
                <div>
                  <div className="font-display text-cream text-[17px]">
                    {item[`name_${lang}`]}
                  </div>
                  <div className="text-cream-muted mt-1 text-[13px]">
                    {item[`desc_${lang}`]}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
