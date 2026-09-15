import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { bookReservation, type BookResult } from "@/db/reservationsStore";
import {
  sendDepositPendingNotice,
  sendStaffDepositReviewAlert,
} from "@/lib/email";
import { STAFF_NOTIFICATION_EMAIL, calculateDeposit } from "@/lib/config";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  partySize: z.number().int().min(1).max(30),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "time must be HH:MM"),
  occasion: z.string().trim().max(60).optional(),
  notes: z.string().trim().max(1000).optional(),
  lang: z.enum(["es", "en"]).default("es"),
  // Self-declared deposit: what the customer says they transferred, plus
  // the reference code they were shown to put in the transfer's
  // description. The *required* amount is always recomputed server-side
  // from partySize — never trusted from the client — so it can't be
  // tampered with by sending a lower number.
  depositAmount: z.number().int().min(0),
  depositReference: z.string().trim().max(60).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    name,
    email,
    phone,
    partySize,
    date,
    time,
    occasion,
    notes,
    lang,
    depositAmount,
    depositReference,
  } = parsed.data;

  const depositRequired = calculateDeposit(partySize);

  if (depositAmount < depositRequired) {
    return NextResponse.json(
      { error: "deposit_too_low", depositRequired },
      { status: 400 },
    );
  }

  let result: BookResult;
  try {
    result = await bookReservation({
      name,
      email: email || null,
      phone: phone || null,
      partySize,
      date,
      time,
      occasion: occasion || null,
      notes: notes || null,
      depositRequired,
      depositAmount,
      depositReference: depositReference || null,
      source: "web",
      lang,
    });
  } catch (err) {
    console.error("POST /api/reservations failed:", err);
    return NextResponse.json(
      { error: "reservations_unavailable" },
      { status: 503 },
    );
  }

  // "pending_deposit" is the expected success outcome now — the slot
  // isn't held/confirmed until staff verifies the deposit on /admin.
  if (!result || result.status !== "pending_deposit") {
    const reason = result?.status ?? "unknown_error";
    const statusCode = reason === "full" ? 409 : 400;
    return NextResponse.json(
      {
        error: reason,
        remaining: result?.remaining ?? 0,
        depositRequired: result?.depositRequired ?? depositRequired,
      },
      { status: statusCode },
    );
  }

  if (email && result.code) {
    try {
      await sendDepositPendingNotice({
        to: email,
        code: result.code,
        name,
        partySize,
        date,
        time,
        lang,
      });
    } catch (err) {
      // The reservation is already saved — an email hiccup shouldn't
      // fail the booking. Log and let the client know via the response
      // so it can still show a success state.
      console.error("Failed to send deposit-pending email:", err);
    }
  }

  // Staff needs to know about every pending deposit so they can review
  // and approve/reject it on /admin. Sent only if STAFF_NOTIFICATION_EMAIL
  // is set — deliberately NOT falling back to CONTACT_EMAIL, since that
  // address is wired to Resend's inbound webhook: an automated email
  // sent there would trigger the webhook on itself and could loop.
  // Without it configured, the /admin panel (which lists every pending
  // deposit regardless of email) is the source of truth — staff can
  // check it directly.
  if (STAFF_NOTIFICATION_EMAIL) {
    try {
      await sendStaffDepositReviewAlert({
        staffEmail: STAFF_NOTIFICATION_EMAIL,
        code: result.code!,
        name,
        email: email || null,
        phone: phone || null,
        partySize,
        date,
        time,
        occasion: occasion || null,
        notes: notes || null,
        source: "web",
        depositRequired,
        depositAmount,
        depositReference: depositReference || null,
      });
    } catch (err) {
      console.error("Failed to send staff deposit review alert:", err);
    }
  } else {
    console.log(
      `New pending deposit ${result.code} — set STAFF_NOTIFICATION_EMAIL to get an email alert, or check /admin.`,
    );
  }

  return NextResponse.json(
    {
      id: result.id,
      code: result.code,
      status: "pending_deposit",
      remaining: result.remaining,
      depositRequired,
    },
    { status: 201 },
  );
}
