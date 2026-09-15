"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { WHATSAPP_NUMBER } from "@/lib/config";

export default function WhatsAppFloat() {
  const { t } = useLanguage();

  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-6 bottom-6 z-[90] flex items-center gap-2.5 rounded-full bg-[#1fae5a] px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(31,174,90,0.4)] transition-transform hover:-translate-y-0.5"
    >
      <span>{t("wa.float")}</span>
    </a>
  );
}
