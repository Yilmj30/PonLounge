"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  PHONE_DISPLAY,
  CONTACT_EMAIL,
  ADDRESS_LINE,
  WHATSAPP_NUMBER,
  INSTAGRAM_URL,
  FACEBOOK_URL,
  TIKTOK_URL,
} from "@/lib/config";

const socialLinks = [
  { label: "Instagram", short: "IG", href: INSTAGRAM_URL },
  { label: "Facebook", short: "FB", href: FACEBOOK_URL },
  { label: "TikTok", short: "TT", href: TIKTOK_URL },
  { label: "WhatsApp", short: "WA", href: `https://wa.me/${WHATSAPP_NUMBER}` },
] as const;

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#08080a] px-6 py-15 text-sm">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-10 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Image
              src="/pon-logo.png"
              alt="PON Lounge"
              width={657}
              height={240}
              className="mb-3.5 h-9 w-auto"
            />
            <p className="text-cream-muted">{t("footer.about")}</p>
          </div>
          <div>
            <h5 className="text-cream mb-4 text-xs tracking-[0.1em] uppercase">
              {t("footer.linksTitle")}
            </h5>
            <ul className="text-cream-muted grid gap-2">
              <li>
                <Link href="/#nosotros">{t("nav.about")}</Link>
              </li>
              <li>
                <Link href="/carta">{t("nav.menu")}</Link>
              </li>
              <li>
                <Link href="/#eventos">{t("nav.events")}</Link>
              </li>
              <li>
                <Link href="/#ubicacion">{t("nav.location")}</Link>
              </li>
              <li>
                <Link href="/#reservas">{t("nav.reservations")}</Link>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-cream mb-4 text-xs tracking-[0.1em] uppercase">
              {t("footer.contactTitle")}
            </h5>
            <p className="text-cream-muted mb-2">{ADDRESS_LINE}</p>
            <p className="text-cream-muted mb-2">{PHONE_DISPLAY}</p>
            <p className="text-cream-muted mb-2">{CONTACT_EMAIL}</p>
            <div className="mt-3 flex gap-3">
              {socialLinks
                .filter((social) => social.href)
                .map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="hover:border-brass hover:text-brass-light flex h-9 w-9 items-center justify-center rounded-full border border-white/15"
                  >
                    {social.short}
                  </a>
                ))}
            </div>
          </div>
        </div>
        <div className="text-cream-muted flex flex-wrap items-center justify-between gap-3 pt-6 text-xs">
          <span>
            © {new Date().getFullYear()} PON Lounge. {t("footer.rights")}
          </span>
          <span>{t("footer.credit")}</span>
        </div>
      </div>
    </footer>
  );
}
