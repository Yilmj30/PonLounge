"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Accepts either a bare reservation id or a full link pasted from the
// confirmation email (".../cancelar/<id>") — takes the last non-empty path
// segment either way, so it doesn't matter which one the customer copies.
function extractReservationId(input: string): string {
  const trimmed = input.trim();
  const segments = trimmed.split("/").filter(Boolean);
  return segments.at(-1) ?? trimmed;
}

export default function CancelLookupForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [showError, setShowError] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const id = extractReservationId(value);
    if (!id) {
      setShowError(true);
      return;
    }
    router.push(`/cancelar/${id}`);
  }

  return (
    <div className="relative mx-auto max-w-lg text-center">
      <div className="text-brass mb-3.5 inline-flex items-center justify-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase">
        <span className="bg-brass h-px w-6" />
        {t("cancelLookup.eyebrow")}
      </div>
      <h1 className="font-display text-cream mb-3 text-[clamp(28px,5vw,40px)]">
        {t("cancelLookup.title")}
      </h1>
      <p className="text-cream-muted mb-6 text-sm">{t("cancelLookup.lead")}</p>

      <form onSubmit={handleSubmit} className="text-left">
        <label
          htmlFor="reservationCode"
          className="text-cream-muted mb-2 block text-xs tracking-[0.06em] uppercase"
        >
          {t("cancelLookup.inputLabel")}
        </label>
        <input
          id="reservationCode"
          type="text"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setShowError(false);
          }}
          placeholder={t("cancelLookup.inputPlaceholder")}
          className="focus-visible:border-brass text-cream w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm"
        />
        {showError && (
          <p className="mt-2 text-xs text-[#e08a8a]">
            {t("cancelLookup.errorEmpty")}
          </p>
        )}

        <button
          type="submit"
          className="from-brass-light to-brass text-obsidian mt-4 flex w-full justify-center rounded-full bg-gradient-to-br px-6.5 py-3.5 text-sm font-semibold"
        >
          {t("cancelLookup.submitButton")}
        </button>
      </form>

      <p className="text-cream-muted mt-6 text-xs">{t("cancelLookup.hint")}</p>
    </div>
  );
}
