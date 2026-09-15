"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import MobileNav from "./MobileNav";

// Hides the header when scrolling down (so it never sits over content the
// visitor is trying to read), reveals it again on scroll up, and gives it
// a solid, blurred background once the page has scrolled past the very
// top — instead of staying fully transparent over whatever's behind it.
function useHeaderScrollState() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    let raf = 0;

    function update() {
      const y = window.scrollY;
      setScrolled(y > 24);
      if (y < 120) {
        setHidden(false);
      } else if (y > lastY.current + 4) {
        setHidden(true);
      } else if (y < lastY.current - 4) {
        setHidden(false);
      }
      lastY.current = y;
    }
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return { hidden, scrolled };
}

const navItems = [
  { key: "nav.about", href: "/#nosotros" },
  { key: "nav.menu", href: "/carta" },
  { key: "nav.events", href: "/#eventos" },
  { key: "nav.gallery", href: "/#galeria" },
  { key: "nav.location", href: "/#ubicacion" },
] as const;

export default function Header({
  cartaActive = false,
}: {
  cartaActive?: boolean;
}) {
  const { lang, setLang, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { hidden, scrolled } = useHeaderScrollState();

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[100] px-6 py-5 transition-[transform,background-color,box-shadow,border-color] duration-300 ${
          hidden ? "-translate-y-full" : "translate-y-0"
        } ${
          scrolled
            ? "border-b border-white/10 bg-[rgba(11,13,16,0.85)] shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5">
          <Link href="/" aria-label="PON Lounge">
            <Image
              src="/pon-logo.png"
              alt="PON Lounge"
              width={657}
              height={240}
              priority
              className="h-9 w-auto sm:h-10"
            />
          </Link>

          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-7 md:flex"
          >
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                aria-current={
                  cartaActive && item.href === "/carta" ? "page" : undefined
                }
                className="text-cream-muted hover:text-brass-light aria-[current=page]:text-brass-light text-xs tracking-[0.06em] uppercase transition-colors"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3.5">
            <div
              role="group"
              aria-label="Idioma / Language"
              className="hidden overflow-hidden rounded-full border border-white/15 sm:flex"
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
            <Link
              href="/#reservas"
              className="from-brass-light to-brass text-obsidian hidden rounded-full bg-gradient-to-br px-6 py-3 text-sm font-semibold sm:inline-flex"
            >
              {t("nav.reserveCta")}
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              className="text-cream flex h-[42px] w-[42px] items-center justify-center rounded-[10px] border border-white/15 md:hidden"
            >
              <span className="relative block h-[2px] w-[18px] bg-current before:absolute before:-top-1.5 before:block before:h-[2px] before:w-[18px] before:bg-current before:content-[''] after:absolute after:top-1.5 after:block after:h-[2px] after:w-[18px] after:bg-current after:content-['']" />
            </button>
          </div>
        </div>
      </header>

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        cartaActive={cartaActive}
      />
    </>
  );
}
