"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { DictKey } from "@/lib/i18n/dictionaries";
import {
  buildReservationIcs,
  buildReservationMessage,
  formatDate,
  formatTime,
  generateDepositReference,
} from "@/lib/reservation";
import { useCancelReservation } from "@/lib/useCancelReservation";
import {
  PHONE_E164,
  PHONE_DISPLAY,
  CONTACT_EMAIL,
  WHATSAPP_NUMBER,
  DEPOSIT_PER_PERSON,
  calculateDeposit,
  BANK_NAME,
  BANK_ACCOUNT_TYPE,
  BANK_ACCOUNT_NUMBER,
  BANK_ACCOUNT_HOLDER,
} from "@/lib/config";
import { formatCOP } from "@/lib/currency";
import { VENUE_OPEN_TIME, LAST_RESERVATION_TIME } from "@/lib/hours";
import ParallaxImage from "@/components/ParallaxImage";

const STEPS = [
  { n: 1, key: "wizard.step1" },
  { n: 2, key: "wizard.step2" },
  { n: 3, key: "wizard.step3" },
  { n: 4, key: "wizard.step4" },
] as const satisfies { n: number; key: DictKey }[];

const OCCASIONS = [
  { value: "casual", key: "wizard.occasionCasual" },
  { value: "birthday", key: "wizard.occasionBirthday" },
  { value: "anniversary", key: "wizard.occasionAnniversary" },
  { value: "business", key: "wizard.occasionBusiness" },
  { value: "other", key: "wizard.occasionOther" },
] as const satisfies { value: string; key: DictKey }[];

type Channel = "whatsapp" | "call" | "email";
type Slot = { time: string; capacity: number; booked: number };
type SlotStatus = "open" | "low" | "full";
type BookingState = "idle" | "submitting" | "confirmed" | "full" | "error";

function slotStatus(slot: Slot): SlotStatus {
  const ratio = slot.booked / slot.capacity;
  if (ratio >= 1) return "full";
  if (ratio >= 0.75) return "low";
  return "open";
}

function Chip({
  selected,
  disabled,
  onClick,
  onKeyDown,
  children,
  ariaLabel,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className="aria-checked:border-brass aria-checked:bg-brass/[0.14] aria-checked:text-brass-light hover:border-brass hover:text-brass-light text-cream-muted rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[13px] transition-all disabled:cursor-not-allowed disabled:line-through disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function CancelBlock({ reservationCode }: { reservationCode: string }) {
  const { t, lang } = useLanguage();
  const { state, setState, requestCancel } = useCancelReservation(
    reservationCode,
    lang,
  );

  if (state === "cancelled") {
    return (
      <div className="mt-4 rounded-xl border border-[#8a5050]/40 bg-[#8a5050]/[0.08] p-4 text-center">
        <p className="text-cream text-sm font-semibold">
          {t("reserve.cancelledTitle")}
        </p>
        <p className="text-cream-muted mt-1 text-xs">
          {t("reserve.cancelledBody")}
        </p>
      </div>
    );
  }

  if (
    state === "tooLate" ||
    state === "alreadyCancelled" ||
    state === "error"
  ) {
    const message =
      state === "tooLate"
        ? t("reserve.cancelErrorTooLate")
        : t("reserve.cancelErrorGeneric");
    return (
      <p className="text-cream-muted mt-3.5 text-center text-xs italic">
        {message}
      </p>
    );
  }

  if (state === "cancelling") {
    return (
      <p className="text-cream-muted mt-3.5 text-center text-xs italic">
        {t("reserve.cancelling")}
      </p>
    );
  }

  if (state === "confirming") {
    return (
      <div className="mt-3.5 text-center">
        <p className="text-cream-muted text-xs">
          {t("reserve.cancelConfirmQuestion")}
        </p>
        <div className="mt-2 flex justify-center gap-4">
          <button
            type="button"
            onClick={requestCancel}
            className="text-xs font-semibold text-[#e08a8a] underline"
          >
            {t("reserve.cancelConfirmYes")}
          </button>
          <button
            type="button"
            onClick={() => setState("idle")}
            className="text-cream-muted text-xs underline"
          >
            {t("reserve.cancelConfirmNo")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3.5 text-center">
      <p className="text-cream-muted text-xs">{t("reserve.cancelPrompt")}</p>
      <button
        type="button"
        onClick={() => setState("confirming")}
        className="text-brass-light mt-1 text-xs font-semibold underline"
      >
        {t("reserve.cancelLink")}
      </button>
    </div>
  );
}

export default function ReservationWizard() {
  const { lang, t } = useLanguage();

  const [step, setStep] = useState(1);
  const [occasion, setOccasion] = useState("casual");
  const [people, setPeople] = useState(2);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [channel, setChannel] = useState<Channel>("whatsapp");

  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsFailed, setSlotsFailed] = useState(false);

  const [bookingState, setBookingState] = useState<BookingState>("idle");
  const [reservationCode, setReservationCode] = useState<string | null>(null);

  // Once the customer triggers "reservar por correo", we lock the rest of
  // the form for this browser session — without this, they could also
  // hit the automatic "Confirmar reserva" button (or send another email)
  // and end up with two reservations for the same request. Persisted in
  // sessionStorage so a page refresh doesn't quietly undo the lock, but a
  // closed tab/new session does — matching "same session" rather than
  // "forever".
  const EMAIL_LOCK_KEY = "pon_email_reservation_started";
  const [emailReservationLocked, setEmailReservationLocked] = useState(
    () =>
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(EMAIL_LOCK_KEY) === "1",
  );

  function lockAfterEmailReservation() {
    setEmailReservationLocked(true);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(EMAIL_LOCK_KEY, "1");
    }
  }

  function unlockEmailReservation() {
    setEmailReservationLocked(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(EMAIL_LOCK_KEY);
    }
  }

  const depositRequired = useMemo(() => calculateDeposit(people), [people]);
  const [depositAmountOverride, setDepositAmountOverride] = useState<
    number | null
  >(null);
  const depositAmount = depositAmountOverride ?? depositRequired;
  const [depositError, setDepositError] = useState<string | null>(null);
  // Generated once (stable across re-renders/party-size changes) so the
  // customer references the same code throughout — including if they
  // switch between the automatic and email paths.
  const [depositReference] = useState<string>(() => generateDepositReference());
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(
    null,
  );
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const timeGroupRef = useRef<HTMLDivElement>(null);
  const timeFallbackRef = useRef<HTMLInputElement>(null);

  // Live mode: we successfully loaded real availability for this date, so
  // the primary action is automatic confirmation against the database.
  // Fallback mode (slotsFailed): degrade gracefully to manual WhatsApp/
  // call/email, e.g. while the database isn't connected yet.
  const liveMode = !slotsFailed;

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect -- this effect's job
       is fetching availability for the selected date; loading/failed are
       reset synchronously right before the request starts. */
    setSlotsLoading(true);
    setSlotsFailed(false);
    /* eslint-enable react-hooks/set-state-in-effect */
    fetch(`/api/availability?date=${date}`)
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res.json();
      })
      .then((data: { slots: Slot[] }) => {
        if (cancelled) return;
        setSlots(data.slots);
        setTime((current) =>
          data.slots.some((s) => s.time === current) ? current : "",
        );
      })
      .catch(() => {
        if (cancelled) return;
        setSlots(null);
        setSlotsFailed(true);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const slotStatusLabel = {
    open: t("reserve.legendOpen"),
    low: t("reserve.legendLow"),
    full: t("reserve.legendFull"),
  };

  function moveTimeFocus(dir: 1 | -1, currentIdx: number) {
    if (!slots) return;
    const next = slots[(currentIdx + dir + slots.length) % slots.length];
    if (!next || slotStatus(next) === "full") return;
    setTime(next.time);
    document.getElementById(`time-chip-${next.time}`)?.focus();
  }

  function validateStep(n: number): boolean {
    if (n === 2) return Boolean(date && time);
    if (n === 3) return name.trim().length > 0;
    return true;
  }

  function goNext() {
    if (!validateStep(step)) {
      if (step === 2) {
        if (!date) {
          dateRef.current?.focus();
        } else if (slotsFailed) {
          timeFallbackRef.current?.focus();
        } else {
          timeGroupRef.current?.focus();
        }
      }
      if (step === 3) nameRef.current?.focus();
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  const peopleLabel =
    people === 1 ? t("reserve.personSingular") : t("reserve.personPlural");

  const previewRows = useMemo(() => {
    if (!name && !date && !time) return null;
    return [
      [t("reserve.previewName"), name || "—"],
      [t("reserve.previewPeople"), `${people} ${peopleLabel}`],
      [t("reserve.previewDate"), date ? formatDate(date, lang) : "—"],
      [t("reserve.previewTime"), time ? formatTime(time) : "—"],
    ];
  }, [name, date, time, people, peopleLabel, lang, t]);

  function downloadIcs() {
    if (!date || !time) return;
    const blob = buildReservationIcs({
      date,
      time,
      summary: t("reserve.icsSummary"),
      location: t("reserve.icsLocation"),
      description: `${people} ${peopleLabel}`,
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "reserva-pon-lounge.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function confirmAutomatically() {
    if (!name.trim() || !date || !time) {
      if (!name.trim()) {
        setStep(3);
        nameRef.current?.focus();
      } else {
        setStep(2);
      }
      return;
    }

    if (depositAmount < depositRequired) {
      setDepositError(t("reserve.depositTooLow"));
      return;
    }
    if (!receiptUploaded) {
      setDepositError(t("reserve.receiptRequired"));
      return;
    }
    setDepositError(null);

    setBookingState("submitting");

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          partySize: people,
          date,
          time,
          occasion,
          notes,
          lang,
          depositAmount,
          depositReference,
        }),
      });

      if (res.status === 201) {
        const body = (await res.json().catch(() => null)) as {
          id?: string;
          code?: string;
        } | null;
        setReservationCode(body?.code ?? null);
        setBookingState("confirmed");
        return;
      }
      if (res.status === 409) {
        setBookingState("full");
        return;
      }
      if (res.status === 400) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (body?.error === "deposit_too_low") {
          setDepositError(t("reserve.depositTooLow"));
          setBookingState("idle");
          return;
        }
      }
      setBookingState("error");
    } catch {
      setBookingState("error");
    }
  }

  const ACCEPTED_RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_RECEIPT_MB = 4;

  async function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptError(null);

    if (!ACCEPTED_RECEIPT_TYPES.includes(file.type)) {
      setReceiptError(t("reserve.receiptInvalidType"));
      return;
    }
    if (file.size > MAX_RECEIPT_MB * 1024 * 1024) {
      setReceiptError(t("reserve.receiptTooLarge"));
      return;
    }

    setReceiptUploading(true);
    setReceiptUploaded(false);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip the "data:image/...;base64," prefix — the server only
          // wants the raw base64 payload.
          resolve(result.split(",")[1] ?? "");
        };
        reader.onerror = () => reject(new Error("read_failed"));
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/deposit-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depositReference,
          mimeType: file.type,
          base64Data,
        }),
      });

      if (!res.ok) {
        setReceiptError(t("reserve.receiptUploadFailed"));
        setReceiptUploading(false);
        return;
      }

      setReceiptPreviewUrl(URL.createObjectURL(file));
      setReceiptUploaded(true);
    } catch {
      setReceiptError(t("reserve.receiptUploadFailed"));
    } finally {
      setReceiptUploading(false);
    }
  }

  function contactManually() {
    if (channel === "email" && depositAmount < depositRequired) {
      setDepositError(t("reserve.depositTooLow"));
      return;
    }
    if (channel === "email" && !receiptUploaded) {
      setDepositError(t("reserve.receiptRequired"));
      return;
    }
    setDepositError(null);

    const message = buildReservationMessage({
      lang,
      name,
      people,
      date,
      time,
      notes,
      depositAmount: channel === "email" ? depositAmount : undefined,
      depositReference: channel === "email" ? depositReference : undefined,
    });

    if (channel === "call") {
      window.location.href = `tel:${PHONE_E164}`;
    } else if (channel === "email") {
      const subject =
        lang === "es" ? "Reserva PON Lounge" : "PON Lounge reservation";
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      lockAfterEmailReservation();
    } else {
      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener",
      );
    }
  }

  const manualLabelKey: DictKey =
    channel === "call"
      ? "reserve.submitCall"
      : channel === "email"
        ? "reserve.submitEmail"
        : "reserve.submitWhatsapp";

  if (emailReservationLocked) {
    return (
      <section
        id="reservas"
        className="bg-obsidian relative overflow-hidden px-6 py-24"
      >
        <ParallaxImage
          src="/photos/coctel-de-autor.png"
          alt=""
          className="absolute inset-0 opacity-30"
          strength={16}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(11,13,16,0.6), rgba(11,13,16,0.92))",
          }}
        />
        <div className="relative mx-auto max-w-xl">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <p className="text-brass mb-3 text-[11px] font-bold tracking-[0.1em] uppercase">
              {t("reserve.emailLockTitle")}
            </p>
            <p className="text-cream-muted text-sm">
              {t("reserve.emailLockBody")}
            </p>
            <Link
              href="/cancelar"
              className="text-brass-light mt-4 inline-block text-[13px] underline underline-offset-2"
            >
              {t("reserve.emailLockManageLink")}
            </Link>
            <div className="mt-3">
              <button
                type="button"
                onClick={unlockEmailReservation}
                className="text-cream-muted text-[12px] underline underline-offset-2"
              >
                {t("reserve.emailLockReset")}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="reservas"
      className="bg-obsidian relative overflow-hidden px-6 py-24"
    >
      <ParallaxImage
        src="/photos/coctel-de-autor.png"
        alt=""
        className="absolute inset-0 opacity-30"
        strength={16}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(11,13,16,0.6), rgba(11,13,16,0.92))",
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <div className="text-brass mb-3 inline-flex items-center justify-center gap-2 text-5xl font-semibold tracking-[0.05em] uppercase">
            <span className="bg-brass h-px w-6" />
            {t("reserve.eyebrow")}
          </div>
          <h2 className="font-display text-cream text-3xl sm:text-4xl">
            {t("reserve.title")}
          </h2>
          <p className="text-cream-muted mt-3.5">{t("reserve.lead")}</p>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.45)] md:grid-cols-[260px_1fr]">
          <aside className="bg-obsidian-soft flex flex-col justify-between border border-white/10 p-7.5 md:border-r-0">
            <ol className="grid gap-5.5">
              {STEPS.map((s) => (
                <li
                  key={s.n}
                  aria-current={step === s.n ? "step" : undefined}
                  onClick={() => s.n < step && setStep(s.n)}
                  className={`text-cream-muted flex cursor-pointer items-center gap-3.5 text-sm transition-colors ${
                    step === s.n ? "text-cream font-semibold" : ""
                  } ${s.n < step ? "text-cream-muted" : ""}`}
                >
                  <span
                    className={`font-display flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full border text-sm transition-all ${
                      step === s.n
                        ? "bg-brass border-brass text-obsidian"
                        : s.n < step
                          ? "border-brass text-brass-light"
                          : "border-white/10"
                    }`}
                  >
                    {s.n}
                  </span>
                  <span>{t(s.key)}</span>
                </li>
              ))}
            </ol>

            <div className="mt-9 grid gap-2.5 border-t border-white/10 pt-5.5">
              <div className="text-cream-muted text-[11px] tracking-[0.06em] uppercase">
                {t("reserve.directTitle")}
              </div>
              <a
                href={`tel:${PHONE_E164}`}
                className="text-cream inline-flex w-fit items-center gap-2.5 text-sm"
              >
                <span className="text-brass">☎</span> {PHONE_DISPLAY}
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-cream inline-flex w-fit items-center gap-2.5 text-sm"
              >
                <span className="text-brass">✉</span> {CONTACT_EMAIL}
              </a>
            </div>
          </aside>

          <div className="bg-obsidian-soft border border-white/10 p-8.5">
            {step === 1 && (
              <div>
                <h3 className="font-display text-cream mb-5.5 text-xl">
                  {t("wizard.pane1Title")}
                </h3>
                <div
                  role="radiogroup"
                  aria-label="Ocasión"
                  className="flex flex-wrap gap-2"
                >
                  {OCCASIONS.map((o) => (
                    <Chip
                      key={o.value}
                      selected={occasion === o.value}
                      onClick={() => setOccasion(o.value)}
                    >
                      {t(o.key)}
                    </Chip>
                  ))}
                </div>

                <div className="mt-6.5">
                  <label
                    id="people-label"
                    className="text-cream-muted mb-2 block text-xs tracking-[0.06em] uppercase"
                  >
                    {t("reserve.people")}
                  </label>
                  <div
                    role="group"
                    aria-labelledby="people-label"
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] p-1.5"
                  >
                    <button
                      type="button"
                      aria-label="Disminuir número de personas"
                      onClick={() => setPeople((p) => Math.max(1, p - 1))}
                      disabled={people <= 1}
                      className="hover:border-brass hover:text-brass-light flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/10 text-lg disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      −
                    </button>
                    <output className="font-display min-w-[70px] text-center text-lg">
                      {people}
                    </output>
                    <button
                      type="button"
                      aria-label="Aumentar número de personas"
                      onClick={() => setPeople((p) => Math.min(30, p + 1))}
                      disabled={people >= 30}
                      className="hover:border-brass hover:text-brass-light flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/10 text-lg disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h3 className="font-display text-cream mb-5.5 text-xl">
                  {t("wizard.pane2Title")}
                </h3>
                <div className="mb-4">
                  <label
                    htmlFor="rDate"
                    className="text-cream-muted mb-2 block text-xs tracking-[0.06em] uppercase"
                  >
                    {t("reserve.date")}
                  </label>
                  <input
                    id="rDate"
                    ref={dateRef}
                    type="date"
                    value={date}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDate(value);
                      setTime("");
                      setSlots(null);
                      setSlotsFailed(false);
                    }}
                    className="focus-visible:border-brass text-cream w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm"
                  />
                </div>

                {!date && (
                  <p className="text-cream-muted text-sm italic">
                    {t("reserve.chooseDateFirst")}
                  </p>
                )}

                {date && slotsLoading && (
                  <p className="text-cream-muted text-sm italic">
                    {t("reserve.slotsLoading")}
                  </p>
                )}

                {date && !slotsLoading && liveMode && slots && (
                  <div>
                    <label
                      id="time-label"
                      className="text-cream-muted mb-2 block text-xs tracking-[0.06em] uppercase"
                    >
                      {t("reserve.time")}
                    </label>
                    <div
                      ref={timeGroupRef}
                      role="radiogroup"
                      aria-labelledby="time-label"
                      tabIndex={-1}
                      className="flex flex-wrap gap-2"
                    >
                      {slots.map((slot, idx) => {
                        const status = slotStatus(slot);
                        const dotClass =
                          status === "full"
                            ? "bg-[#8a5050]"
                            : status === "low"
                              ? "bg-brass"
                              : "bg-[#4caf7d]";
                        return (
                          <Chip
                            key={slot.time}
                            selected={time === slot.time}
                            disabled={status === "full"}
                            ariaLabel={`${formatTime(slot.time)} — ${slotStatusLabel[status]}`}
                            onClick={() => setTime(slot.time)}
                            onKeyDown={(e) => {
                              const dir =
                                e.key === "ArrowRight"
                                  ? 1
                                  : e.key === "ArrowLeft"
                                    ? -1
                                    : 0;
                              if (!dir) return;
                              e.preventDefault();
                              moveTimeFocus(dir, idx);
                            }}
                          >
                            <span
                              id={`time-chip-${slot.time}`}
                              className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${dotClass}`}
                              aria-hidden="true"
                            />
                            {formatTime(slot.time)}
                          </Chip>
                        );
                      })}
                    </div>
                    <div className="text-cream-muted mt-3 flex flex-wrap gap-4 text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <i className="h-2 w-2 rounded-full bg-[#4caf7d]" />
                        {t("reserve.legendOpen")}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <i className="bg-brass h-2 w-2 rounded-full" />
                        {t("reserve.legendLow")}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <i className="h-2 w-2 rounded-full bg-[#8a5050]" />
                        {t("reserve.legendFull")}
                      </span>
                    </div>
                  </div>
                )}

                {date && !slotsLoading && slotsFailed && (
                  <div>
                    <label
                      htmlFor="rTimeFallback"
                      className="text-cream-muted mb-2 block text-xs tracking-[0.06em] uppercase"
                    >
                      {t("reserve.time")}
                    </label>
                    <input
                      id="rTimeFallback"
                      ref={timeFallbackRef}
                      type="time"
                      min={VENUE_OPEN_TIME}
                      max={LAST_RESERVATION_TIME}
                      step={1800}
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="focus-visible:border-brass text-cream w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm"
                    />
                    <p className="text-cream-muted mt-2.5 text-xs italic">
                      {t("reserve.slotsUnavailable")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div>
                <h3 className="font-display text-cream mb-5.5 text-xl">
                  {t("wizard.pane3Title")}
                </h3>
                <div className="mb-4">
                  <label
                    htmlFor="rName"
                    className="text-cream-muted mb-2 block text-xs tracking-[0.06em] uppercase"
                  >
                    {t("reserve.name")}
                  </label>
                  <input
                    id="rName"
                    ref={nameRef}
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre y apellido"
                    className="focus-visible:border-brass text-cream w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm"
                  />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="rEmail"
                    className="text-cream-muted mb-2 block text-xs tracking-[0.06em] uppercase"
                  >
                    {t("reserve.email")}
                  </label>
                  <input
                    id="rEmail"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@correo.com"
                    className="focus-visible:border-brass text-cream w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="rNotes"
                    className="text-cream-muted mb-2 block text-xs tracking-[0.06em] uppercase"
                  >
                    {t("reserve.notes")}
                  </label>
                  <textarea
                    id="rNotes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Celebración, alergias, zona VIP..."
                    className="focus-visible:border-brass text-cream min-h-[80px] w-full resize-y rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h3 className="font-display text-cream mb-5.5 text-xl">
                  {t("wizard.pane4Title")}
                </h3>

                {bookingState === "confirmed" ? (
                  <div className="rounded-2xl border border-[#4caf7d]/40 bg-[#4caf7d]/[0.08] p-6 text-center">
                    <div className="mb-2 text-2xl">✓</div>
                    <p className="text-cream font-semibold">
                      {t("reserve.confirmedTitle")}
                    </p>
                    <p className="text-cream-muted mt-1.5 text-sm">
                      {t("reserve.confirmedBody")}
                    </p>
                    {reservationCode && (
                      <div className="border-brass/35 bg-brass/[0.08] mt-4 rounded-xl border border-dashed p-4">
                        <p className="text-brass mb-1 text-[11px] font-bold tracking-[0.1em] uppercase">
                          {t("reserve.codeLabel")}
                        </p>
                        <p className="font-display text-cream text-xl tracking-widest">
                          {reservationCode}
                        </p>
                        <p className="text-cream-muted mt-1.5 text-[12px]">
                          {t("reserve.codeNote")}
                        </p>
                      </div>
                    )}
                    {date && time && (
                      <button
                        type="button"
                        onClick={downloadIcs}
                        className="border-brass/35 text-brass-light hover:bg-brass/[0.08] mt-4 flex w-full justify-center rounded-full border border-dashed py-2.5 text-[13px] font-semibold"
                      >
                        {t("reserve.addToCalendar")}
                      </button>
                    )}
                    {reservationCode && (
                      <CancelBlock reservationCode={reservationCode} />
                    )}
                  </div>
                ) : (
                  <>
                    <div className="border-brass/35 bg-brass/[0.05] rounded-2xl border border-dashed p-5">
                      <div className="text-brass mb-2.5 text-[11px] font-bold tracking-[0.1em] uppercase">
                        {t("reserve.previewTitle")}
                      </div>
                      {previewRows ? (
                        <div>
                          {previewRows.map(([label, value]) => (
                            <div
                              key={label}
                              className="flex justify-between gap-3 border-b border-dashed border-white/10 py-1.5 text-sm last:border-b-0"
                            >
                              <span className="text-cream-muted">{label}</span>
                              <span className="text-cream text-right font-semibold">
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-cream-muted text-[13px] italic">
                          {t("reserve.previewEmpty")}
                        </p>
                      )}
                    </div>

                    {(liveMode || channel === "email") && (
                      <div className="border-brass/35 bg-brass/[0.05] mt-4 rounded-2xl border border-dashed p-5">
                        <div className="text-brass mb-2.5 text-[11px] font-bold tracking-[0.1em] uppercase">
                          {t("reserve.depositTitle")}
                        </div>
                        <p className="text-cream-muted text-[13px]">
                          {t("reserve.depositExplain")
                            .replace(
                              "{perPerson}",
                              formatCOP(DEPOSIT_PER_PERSON),
                            )
                            .replace("{people}", String(people))
                            .replace("{total}", formatCOP(depositRequired))}
                        </p>

                        <div className="mt-4 grid gap-2 text-[13px]">
                          <div className="flex justify-between border-b border-dashed border-white/10 py-1.5">
                            <span className="text-cream-muted">
                              {BANK_NAME} ({BANK_ACCOUNT_TYPE})
                            </span>
                            <span className="text-cream font-semibold">
                              {BANK_ACCOUNT_NUMBER}
                            </span>
                          </div>
                          <div className="text-cream-muted text-right text-[12px]">
                            {BANK_ACCOUNT_HOLDER}
                          </div>
                        </div>

                        <div className="border-brass/40 bg-brass/[0.1] mt-4 rounded-xl border border-dashed p-3.5 text-center">
                          <p className="text-brass mb-1 text-[10px] font-bold tracking-[0.1em] uppercase">
                            {t("reserve.depositReferenceLabel")}
                          </p>
                          <p className="font-display text-cream text-lg tracking-widest">
                            {depositReference}
                          </p>
                          <p className="text-cream-muted mt-1 text-[11px]">
                            {t("reserve.depositReferenceNote")}
                          </p>
                        </div>

                        <div className="mt-4">
                          <label
                            htmlFor="deposit-amount"
                            className="text-cream-muted mb-1.5 block text-xs tracking-[0.06em] uppercase"
                          >
                            {t("reserve.depositAmountLabel")}
                          </label>
                          <input
                            id="deposit-amount"
                            type="number"
                            min={0}
                            step={1000}
                            inputMode="numeric"
                            value={depositAmount || ""}
                            onChange={(e) => {
                              setDepositAmountOverride(
                                Number(e.target.value) || 0,
                              );
                              setDepositError(null);
                            }}
                            className="text-cream w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm outline-none focus:border-white/30"
                          />
                        </div>

                        {depositError && (
                          <p className="mt-3 text-[13px] text-[#e08a8a]">
                            {depositError}
                          </p>
                        )}

                        <div className="mt-4">
                          <label
                            htmlFor="deposit-receipt"
                            className="text-cream-muted mb-1.5 block text-xs tracking-[0.06em] uppercase"
                          >
                            {t("reserve.receiptLabel")}
                          </label>
                          <input
                            id="deposit-receipt"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleReceiptChange}
                            className="text-cream-muted file:border-brass/35 file:text-brass-light w-full text-[13px] file:mr-3 file:rounded-full file:border file:bg-transparent file:px-4 file:py-2 file:text-xs file:font-semibold"
                          />
                          {receiptUploading && (
                            <p className="text-cream-muted mt-2 text-[12px]">
                              {t("reserve.receiptUploading")}
                            </p>
                          )}
                          {receiptUploaded && receiptPreviewUrl && (
                            <div className="mt-3 flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not a static asset */}
                              <img
                                src={receiptPreviewUrl}
                                alt=""
                                className="h-14 w-14 rounded-lg object-cover"
                              />
                              <p className="text-[12px] text-[#8fd6ab]">
                                {t("reserve.receiptUploaded")}
                              </p>
                            </div>
                          )}
                          {receiptError && (
                            <p className="mt-2 text-[12px] text-[#e08a8a]">
                              {receiptError}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {liveMode && (
                      <div className="mt-5">
                        <button
                          type="button"
                          onClick={confirmAutomatically}
                          disabled={
                            bookingState === "submitting" || !receiptUploaded
                          }
                          className="from-brass-light to-brass text-obsidian flex w-full justify-center rounded-full bg-gradient-to-br px-6.5 py-3.5 text-sm font-semibold disabled:opacity-60"
                        >
                          {bookingState === "submitting"
                            ? t("reserve.confirming")
                            : t("reserve.confirmAuto")}
                        </button>
                        {bookingState === "full" && (
                          <div className="mt-3 text-center">
                            <p className="text-sm text-[#e08a8a]">
                              {t("reserve.errorFull")}
                            </p>
                            <button
                              type="button"
                              onClick={() => setStep(2)}
                              className="text-brass-light mt-1.5 text-sm underline"
                            >
                              {t("reserve.chooseAnotherTime")}
                            </button>
                          </div>
                        )}
                        {bookingState === "error" && (
                          <p className="mt-3 text-center text-sm text-[#e08a8a]">
                            {t("reserve.errorGeneric")}
                          </p>
                        )}
                      </div>
                    )}

                    <div
                      className={
                        liveMode ? "mt-7 border-t border-white/10 pt-6" : "mt-5"
                      }
                    >
                      {liveMode && (
                        <p className="text-cream-muted mb-4 text-center text-xs tracking-[0.05em] uppercase">
                          {t("reserve.orContactDirect")}
                        </p>
                      )}
                      <label
                        id="channel-label"
                        className="text-cream-muted mb-2 block text-xs tracking-[0.06em] uppercase"
                      >
                        {t("reserve.channelLabel")}
                      </label>
                      <div
                        role="radiogroup"
                        aria-labelledby="channel-label"
                        className="mb-4 flex flex-wrap gap-2"
                      >
                        <Chip
                          selected={channel === "whatsapp"}
                          onClick={() => setChannel("whatsapp")}
                        >
                          WhatsApp
                        </Chip>
                        <Chip
                          selected={channel === "call"}
                          onClick={() => setChannel("call")}
                        >
                          {t("reserve.channelCall")}
                        </Chip>
                        <Chip
                          selected={channel === "email"}
                          onClick={() => setChannel("email")}
                        >
                          {t("reserve.channelEmail")}
                        </Chip>
                      </div>
                      <button
                        type="button"
                        onClick={contactManually}
                        disabled={channel === "email" && !receiptUploaded}
                        className={
                          liveMode
                            ? "border-cream text-cream hover:border-brass flex w-full justify-center rounded-full border px-6.5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                            : "from-brass-light to-brass text-obsidian flex w-full justify-center rounded-full bg-gradient-to-br px-6.5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                        }
                      >
                        {t(manualLabelKey)}
                      </button>
                      {channel === "email" && !receiptUploaded && (
                        <p className="text-cream-muted mt-2 text-center text-[12px]">
                          {t("reserve.receiptRequiredHint")}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {bookingState !== "confirmed" && (
              <div className="mt-7.5 flex items-center justify-between gap-3.5 border-t border-white/10 pt-6">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="text-cream hover:border-brass rounded-full border border-white/15 px-6.5 py-3 text-sm font-semibold"
                  >
                    {t("wizard.back")}
                  </button>
                ) : (
                  <span />
                )}

                {step < 4 && (
                  <button
                    type="button"
                    onClick={goNext}
                    className="from-brass-light to-brass text-obsidian ml-auto rounded-full bg-gradient-to-br px-6.5 py-3 text-sm font-semibold"
                  >
                    {t("wizard.next")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-cream-muted mx-auto mt-7 max-w-3xl text-center text-[13px]">
          {t("reserve.p1")} <span aria-hidden="true"> · </span>
          {t("reserve.p2")} <span aria-hidden="true"> · </span>
          {t("reserve.p3")}
        </p>

        <p className="text-cream-muted mx-auto mt-4 text-center text-[13px]">
          {t("reserve.manageExisting")}{" "}
          <Link href="/cancelar" className="text-brass-light underline">
            {t("reserve.manageExistingLink")}
          </Link>
        </p>
      </div>
    </section>
  );
}
