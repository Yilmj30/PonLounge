"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function SkipLink() {
  const { t } = useLanguage();
  return (
    <a
      href="#main-content"
      className="bg-brass-light fixed top-[-100px] left-4 z-[200] rounded-lg px-4.5 py-3 text-sm font-bold text-[#201203] transition-[top] duration-200 focus:top-4"
    >
      {t("a11y.skipLink")}
    </a>
  );
}
