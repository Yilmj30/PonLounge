"use client";

import ParallaxImage from "@/components/ParallaxImage";
import ScrollReveal from "@/components/ScrollReveal";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { DictKey } from "@/lib/i18n/dictionaries";

const tiles = [
  {
    captionKey: "gallery.c1",
    image: "/photos/pared-relojes.png",
    span: "col-span-2 row-span-2",
  },
  {
    captionKey: "gallery.c2",
    image: "/photos/barra-mojitos.png",
    span: "",
  },
  { captionKey: "gallery.c3", image: "/photos/zona-lounge.png", span: "" },
  {
    captionKey: "gallery.c4",
    image: "/photos/barra-bartender.png",
    span: "row-span-2",
  },
  { captionKey: "gallery.c5", image: "/photos/coctel-de-autor.png", span: "" },
  {
    captionKey: "gallery.c6",
    image: "/photos/pared-relojes-noche.png",
    span: "",
  },
  { captionKey: "gallery.c7", image: "/photos/servicio-mesera.png", span: "" },
  { captionKey: "gallery.c8", image: "/photos/licores-premium.png", span: "" },
  {
    captionKey: "gallery.c9",
    image: "/photos/preparacion-mojitos.png",
    span: "",
  },
  {
    captionKey: "gallery.c10",
    image: "/photos/mojitos-listos.png",
    span: "",
  },
] satisfies { captionKey: DictKey; image: string; span: string }[];

export default function Gallery() {
  const { t } = useLanguage();

  return (
    <section id="galeria" className="bg-obsidian px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="mx-auto mb-12 max-w-xl text-center">
          <div className="text-brass mb-3 inline-flex items-center justify-center gap-2 text-5xl font-semibold tracking-[0.05em] uppercase">
            <span className="bg-brass h-px w-6" />
            {t("gallery.eyebrow")}
          </div>
          <h2 className="font-display text-cream text-3xl sm:text-4xl">
            {t("gallery.title")}
          </h2>
        </ScrollReveal>

        <div className="grid auto-rows-[160px] grid-cols-2 gap-3.5 md:grid-cols-4">
          {tiles.map((tile, i) => (
            <ScrollReveal
              key={tile.captionKey}
              delay={i * 60}
              className={tile.span}
            >
              <figure className="relative m-0 h-full overflow-hidden rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                <ParallaxImage
                  src={tile.image}
                  alt={t(tile.captionKey)}
                  className="absolute inset-0"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  strength={14}
                />
              </figure>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
