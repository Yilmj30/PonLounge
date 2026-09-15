import { NextRequest, NextResponse } from "next/server";
import { cancelReservation } from "@/db/reservationsStore";
import { sendCancellationEmail, sendStaffCancellationAlert } from "@/lib/email";
import { STAFF_NOTIFICATION_EMAIL } from "@/lib/config";

export const dynamic = "force-dynamic";

// PON-XXXXXX — 6 chars from an alphabet that skips 0/O/1/I to avoid
// confusion when read aloud or typed by hand.
const CODE_PATTERN = /^PON-[A-Z0-9]{6}$/i;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const normalizedCode = decodeURIComponent(code).trim().toUpperCase();

  if (!CODE_PATTERN.test(normalizedCode)) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }

  let lang: "es" | "en" = "es";
  try {
    const body = (await req.json()) as { lang?: string };
    if (body?.lang === "en") lang = "en";
  } catch {
    // No body (or invalid JSON) sent — default to "es" is fine.
  }

  let result: Awaited<ReturnType<typeof cancelReservation>>;
  try {
    result = await cancelReservation(normalizedCode);
  } catch (err) {
    console.error("POST /api/reservations/[code]/cancel failed:", err);
    return NextResponse.json(
      { error: "reservations_unavailable" },
      { status: 503 },
    );
  }

  if (result.status === "not_found") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (result.status === "already_cancelled" || result.status === "too_late") {
    return NextResponse.json(
      { error: result.status, date: result.date, time: result.time },
      { status: 409 },
    );
  }

  // Best-effort: the cancellation already succeeded in the database — an
  // email hiccup shouldn't change that or fail the response.
  if (result.email && result.name && result.date && result.time) {
    try {
      await sendCancellationEmail({
        to: result.email,
        name: result.name,
        date: result.date,
        time: result.time,
        lang,
      });
    } catch (err) {
      console.error("Failed to send cancellation email:", err);
    }
  }

  // Best-effort internal notification — inactive until
  // STAFF_NOTIFICATION_EMAIL is set (same gate the other staff alerts
  // use, see config.ts).
  if (STAFF_NOTIFICATION_EMAIL && result.name && result.date && result.time) {
    try {
      await sendStaffCancellationAlert({
        staffEmail: STAFF_NOTIFICATION_EMAIL,
        code: normalizedCode,
        name: result.name,
        email: result.email ?? null,
        date: result.date,
        time: result.time,
        partySize: result.partySize ?? null,
      });
    } catch (err) {
      console.error("Failed to send staff cancellation alert:", err);
    }
  }

  return NextResponse.json(
    { status: "cancelled", date: result.date, time: result.time },
    { status: 200 },
  );
}
