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

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
      <path
        d="M14.5 8.5H16.5V5.5H14.5C12.29 5.5 10.5 7.29 10.5 9.5V11.5H8.5V14.5H10.5V19.5H13.5V14.5H15.7L16.5 11.5H13.5V9.5C13.5 8.95 13.95 8.5 14.5 8.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
      <path
        d="M15.5 4c.3 1.9 1.5 3.2 3.5 3.4v2.6c-1.3 0-2.5-.4-3.5-1.1v5.6c0 2.6-2.1 4.5-4.6 4.5S6.3 17.1 6.3 14.5s2.1-4.5 4.6-4.5c.3 0 .6 0 .9.1v2.7a1.9 1.9 0 1 0 1.3 1.8V4h2.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
      <path
        d="M12 3.5a8.5 8.5 0 0 0-7.3 12.9L3.5 20.5l4.2-1.1A8.5 8.5 0 1 0 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M9.2 9.3c-.2.5-.6 1.6.1 2.9.7 1.4 2.3 3 3.7 3.7 1.3.7 2.2.4 2.7.1.4-.2.7-.9.5-1.3-.1-.3-1.3-1.1-1.6-1.2-.3-.1-.5-.1-.7.1l-.4.5c-.1.2-.3.2-.5.1-.5-.2-1.2-.6-1.8-1.2-.6-.6-1-1.3-1.2-1.8-.1-.2-.1-.4.1-.5l.5-.4c.2-.2.2-.4.1-.7-.1-.3-.9-1.5-1.2-1.6-.4-.2-.1-.2-.3.3Z"
        fill="currentColor"
      />
    </svg>
  );
}

const socialLinks = [
  { label: "Instagram", icon: InstagramIcon, href: INSTAGRAM_URL },
  { label: "Facebook", icon: FacebookIcon, href: FACEBOOK_URL },
  { label: "TikTok", icon: TikTokIcon, href: TIKTOK_URL },
  {
    label: "WhatsApp",
    icon: WhatsAppIcon,
    href: `https://wa.me/${WHATSAPP_NUMBER}`,
  },
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
                .map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="hover:border-brass hover:text-brass-light flex h-9 w-9 items-center justify-center rounded-full border border-white/15"
                    >
                      <Icon />
                    </a>
                  );
                })}
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
