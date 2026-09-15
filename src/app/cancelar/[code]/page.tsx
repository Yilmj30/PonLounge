import type { Metadata } from "next";
import Header from "@/components/Header";
import CartaFooter from "@/components/CartaFooter";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import SkipLink from "@/components/SkipLink";
import CancelReservationPanel, {
  type CancelPageStatus,
} from "@/components/CancelReservationPanel";
import { getReservationByCode } from "@/db/reservationsStore";
import { isPastCancellationCutoff } from "@/lib/reservation";

export const dynamic = "force-dynamic";

// PON-XXXXXX — 6 chars from an alphabet that skips 0/O/1/I to avoid
// confusion when read aloud or typed by hand.
const CODE_PATTERN = /^PON-[A-Z0-9]{6}$/i;

export const metadata: Metadata = {
  title: "Cancelar reserva",
  // Personal, reservation-specific link shared via email — never index it.
  robots: { index: false, follow: false },
};

export default async function CancelReservationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalizedCode = decodeURIComponent(code).trim().toUpperCase();
  const isValidFormat = CODE_PATTERN.test(normalizedCode);

  const reservation = isValidFormat
    ? await getReservationByCode(normalizedCode)
    : null;

  let status: CancelPageStatus;
  if (!reservation) {
    status = "not_found";
  } else if (reservation.status === "cancelled") {
    status = "already_cancelled";
  } else if (isPastCancellationCutoff(reservation.date, reservation.time)) {
    status = "too_late";
  } else {
    status = "confirmed";
  }

  return (
    <>
      <SkipLink />
      <Header />
      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden px-6 pt-40 pb-24">
          <CancelReservationPanel
            code={normalizedCode}
            status={status}
            reservation={
              reservation
                ? {
                    name: reservation.name,
                    date: reservation.date,
                    time: reservation.time,
                    partySize: reservation.partySize,
                  }
                : null
            }
          />
        </section>
      </main>
      <CartaFooter />
      <WhatsAppFloat />
    </>
  );
}
