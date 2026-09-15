"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { PHONE_DISPLAY, CONTACT_EMAIL } from "@/lib/config";

export default function CartaFooter() {
  const { t } = useLanguage();
  return (
    <footer className="text-cream-muted border-t border-white/10 bg-[#08080a] px-6 py-10 text-center text-sm">
      <p>
        PON Lounge · {PHONE_DISPLAY} · {CONTACT_EMAIL}
      </p>
      <p className="mt-2">
        <Link href="/" className="hover:text-brass-light">
          {t("cartaPage.back")}
        </Link>
      </p>
    </footer>
  );
}
