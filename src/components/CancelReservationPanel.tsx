"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { formatDate, formatTime } from "@/lib/reservation";
import { useCancelReservation } from "@/lib/useCancelReservation";
import { WHATSAPP_NUMBER } from "@/lib/config";

type ReservationInfo = {
  name: string;
  date: string;
  time: string;
  partySize: number;
};

export type CancelPageStatus =
  "not_found" | "already_cancelled" | "too_late" | "confirmed";

export default function CancelReservationPanel({
  code,
  status,
  reservation,
}: {
  code: string;
  status: CancelPageStatus;
  reservation: ReservationInfo | null;
}) {
  const { lang, t } = useLanguage();
  const { state, requestCancel } = useCancelReservation(code, lang);

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}`;

  if (status === "not_found") {
    return (
      <Panel eyebrow={t("cancelPage.eyebrow")} title={t("cancelPage.title")}>
        <Message
          title={t("cancelPage.notFoundTitle")}
          body={t("cancelPage.notFoundBody")}
          tone="neutral"
        />
        <Actions whatsappHref={whatsappHref} t={t} />
      </Panel>
    );
  }

  if (status === "already_cancelled" || state === "alreadyCancelled") {
    return (
      <Panel eyebrow={t("cancelPage.eyebrow")} title={t("cancelPage.title")}>
        <Message
          title={t("cancelPage.alreadyCancelledTitle")}
          body={t("cancelPage.alreadyCancelledBody")}
          tone="neutral"
        />
        <Actions whatsappHref={whatsappHref} t={t} showWhatsapp={false} />
      </Panel>
    );
  }

  if (status === "too_late" || state === "tooLate") {
    return (
      <Panel eyebrow={t("cancelPage.eyebrow")} title={t("cancelPage.title")}>
        <Message
          title={t("cancelPage.tooLateTitle")}
          body={t("cancelPage.tooLateBody")}
          tone="warning"
        />
        <Actions whatsappHref={whatsappHref} t={t} />
      </Panel>
    );
  }

  if (state === "cancelled") {
    return (
      <Panel eyebrow={t("cancelPage.eyebrow")} title={t("cancelPage.title")}>
        <Message
          title={t("cancelPage.successTitle")}
          body={t("cancelPage.successBody")}
          tone="success"
        />
        <Actions whatsappHref={whatsappHref} t={t} showWhatsapp={false} />
      </Panel>
    );
  }

  if (state === "error") {
    return (
      <Panel eyebrow={t("cancelPage.eyebrow")} title={t("cancelPage.title")}>
        <Message
          title={t("cancelPage.errorTitle")}
          body={t("cancelPage.errorBody")}
          tone="warning"
        />
        <Actions whatsappHref={whatsappHref} t={t} />
      </Panel>
    );
  }

  // status === "confirmed" && reservation is guaranteed non-null here.
  const r = reservation!;

  return (
    <Panel eyebrow={t("cancelPage.eyebrow")} title={t("cancelPage.title")}>
      <p className="text-cream-muted mb-6 text-sm">{t("cancelPage.lead")}</p>

      <div className="border-brass/35 bg-brass/[0.05] mb-6 rounded-2xl border border-dashed p-5 text-left">
        <Row label={t("cancelPage.name")} value={r.name} />
        <Row label={t("cancelPage.people")} value={String(r.partySize)} />
        <Row label={t("cancelPage.date")} value={formatDate(r.date, lang)} />
        <Row label={t("cancelPage.time")} value={formatTime(r.time)} last />
      </div>

      <button
        type="button"
        onClick={requestCancel}
        disabled={state === "cancelling"}
        className="flex w-full justify-center rounded-full border border-[#8a5050] px-6.5 py-3.5 text-sm font-semibold text-[#e08a8a] hover:bg-[#8a5050]/[0.1] disabled:opacity-60"
      >
        {state === "cancelling"
          ? t("cancelPage.cancelling")
          : t("cancelPage.confirmButton")}
      </button>

      <Link
        href="/"
        className="text-cream-muted hover:text-brass-light mt-4 inline-flex text-sm underline"
      >
        {t("cancelPage.keepButton")}
      </Link>
    </Panel>
  );
}

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto max-w-lg text-center">
      <div className="text-brass mb-3.5 inline-flex items-center justify-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase">
        <span className="bg-brass h-px w-6" />
        {eyebrow}
      </div>
      <h1 className="font-display text-cream mb-6 text-[clamp(28px,5vw,40px)]">
        {title}
      </h1>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-3 py-1.5 text-sm ${last ? "" : "border-b border-dashed border-white/10"}`}
    >
      <span className="text-cream-muted">{label}</span>
      <span className="text-cream text-right font-semibold">{value}</span>
    </div>
  );
}

function Message({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone: "neutral" | "warning" | "success";
}) {
  const toneClass =
    tone === "success"
      ? "border-[#4caf7d]/40 bg-[#4caf7d]/[0.08]"
      : tone === "warning"
        ? "border-[#8a5050]/40 bg-[#8a5050]/[0.08]"
        : "border-white/10 bg-white/[0.04]";

  return (
    <div className={`mb-6 rounded-2xl border p-6 ${toneClass}`}>
      <p className="text-cream font-semibold">{title}</p>
      <p className="text-cream-muted mt-1.5 text-sm">{body}</p>
    </div>
  );
}

function Actions({
  whatsappHref,
  t,
  showWhatsapp = true,
}: {
  whatsappHref: string;
  t: (key: DictKey) => string;
  showWhatsapp?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      {showWhatsapp && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="from-brass-light to-brass text-obsidian flex w-full justify-center rounded-full bg-gradient-to-br px-6.5 py-3.5 text-sm font-semibold"
        >
          {t("cancelPage.whatsappCta")}
        </a>
      )}
      <Link
        href="/"
        className="text-cream-muted hover:text-brass-light text-sm underline"
      >
        {t("cancelPage.backHome")}
      </Link>
    </div>
  );
}
