"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const navItems = [
  { key: "nav.about", href: "/#nosotros" },
  { key: "nav.menu", href: "/carta" },
  { key: "nav.events", href: "/#eventos" },
  { key: "nav.gallery", href: "/#galeria" },
  { key: "nav.location", href: "/#ubicacion" },
  { key: "nav.reservations", href: "/#reservas" },
] as const;

export default function MobileNav({
  open,
  onClose,
  cartaActive = false,
}: {
  open: boolean;
  onClose: () => void;
  cartaActive?: boolean;
}) {
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      id="mobile-nav"
      aria-hidden={!open}
      inert={!open}
      className={`fixed inset-0 z-[103] flex flex-col items-center justify-center gap-7 bg-[rgba(10,10,12,0.98)] transition-transform duration-300 ${
        open ? "translate-y-0" : "pointer-events-none -translate-y-full"
      }`}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar menú"
        className="text-cream absolute top-6 right-6 flex h-[42px] w-[42px] items-center justify-center rounded-[10px] border border-white/15"
      >
        ✕
      </button>

      {navItems.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          onClick={onClose}
          aria-current={
            cartaActive && item.href === "/carta" ? "page" : undefined
          }
          className="font-display text-cream aria-[current=page]:text-brass-light text-2xl"
        >
          {t(item.key)}
        </Link>
      ))}

      <div
        role="group"
        aria-label="Idioma / Language"
        className="mt-2.5 flex overflow-hidden rounded-full border border-white/15"
      >
        <button
          type="button"
          onClick={() => setLang("es")}
          aria-pressed={lang === "es"}
          className="aria-pressed:bg-brass aria-pressed:text-obsidian text-cream-muted px-3.5 py-1.5 text-xs font-semibold tracking-[0.08em]"
        >
          ES
        </button>
        <button
          type="button"
          onClick={() => setLang("en")}
          aria-pressed={lang === "en"}
          className="aria-pressed:bg-brass aria-pressed:text-obsidian text-cream-muted px-3.5 py-1.5 text-xs font-semibold tracking-[0.08em]"
        >
          EN
        </button>
      </div>
    </div>
  );
}
