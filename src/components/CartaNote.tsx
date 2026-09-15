"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function CartaNote() {
  const { t } = useLanguage();
  return <>{t("cartaPage.note")}</>;
}
