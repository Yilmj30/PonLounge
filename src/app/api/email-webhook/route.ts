import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { bookReservation } from "@/db/reservationsStore";
import { parseReservationRequest } from "@/lib/emailParser";
import {
  hasProcessedWebhookEvent,
  markWebhookEventProcessed,
} from "@/lib/webhookDedupe";
import {
  sendDepositPendingNotice,
  sendEmailParseFailureNotice,
  sendManualReviewAlert,
  sendStaffDepositReviewAlert,
} from "@/lib/email";
import { STAFF_NOTIFICATION_EMAIL, calculateDeposit } from "@/lib/config";

export const dynamic = "force-dynamic";

// Minimal shape of what we read from the verified webhook payload and
// from the Receiving API response. Resend's inbound-email feature is
// still evolving (their own docs note the API "might change before GA"),
// so this is intentionally loose rather than importing SDK types that
// may not match the installed version exactly.
type InboundWebhookEvent = {
  type: string;
  data: { email_id: string };
};

type ReceivedEmail = {
  from: string;
  to: string[];
  subject: string | null;
  text: string | null;
};

function extractEmailAddress(fromHeader: string): string {
  const match = fromHeader.match(/<([^>]+)>/);
  return (match?.[1] ?? fromHeader).trim();
}

// Best-effort internal alert helper. Deliberately never sends to
// CONTACT_EMAIL: that address has Resend's inbound receiving configured
// (it's what triggers THIS webhook), so an automated email sent there
// would loop back into this same handler. STAFF_NOTIFICATION_EMAIL is a
// separate real inbox (e.g. a personal Gmail) with no such wiring — if
// it isn't set, we just log instead of emailing anyone.
async function alertStaff(fn: (staffEmail: string) => Promise<void>) {
  if (!STAFF_NOTIFICATION_EMAIL) {
    console.log(
      "No STAFF_NOTIFICATION_EMAIL configured — skipping staff email alert (check /admin instead).",
    );
    return;
  }
  await fn(STAFF_NOTIFICATION_EMAIL);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const apiKey = process.env.RESEND_API_KEY;
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!apiKey || !webhookSecret) {
    console.error(
      "Email webhook not configured: missing RESEND_API_KEY or RESEND_WEBHOOK_SECRET",
    );
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  let event: InboundWebhookEvent;
  try {
    // Signature verification per Resend's docs: raw body + the three
    // Svix headers, using the SDK's short key names (id/timestamp/
    // signature) rather than the literal header names.
    event = resend.webhooks.verify({
      payload: rawBody,
      headers: {
        id: req.headers.get("svix-id") ?? "",
        timestamp: req.headers.get("svix-timestamp") ?? "",
        signature: req.headers.get("svix-signature") ?? "",
      },
      webhookSecret,
    }) as InboundWebhookEvent;
  } catch (err) {
    console.error("Invalid Resend webhook signature:", err);
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  if (event.type !== "email.received") {
    // We only asked Resend to send us this event type, but ack anything
    // else harmlessly instead of erroring.
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  const emailId = event.data.email_id;

  // Idempotency: a retried webhook delivery for an email we've already
  // fully handled should be a no-op, not a second booking/cancellation.
  if (await hasProcessedWebhookEvent(emailId)) {
    return NextResponse.json({ status: "already_processed" }, { status: 200 });
  }

  let full: ReceivedEmail;
  try {
    const result = await resend.emails.receiving.get(emailId);
    if (result.error || !result.data) {
      throw result.error ?? new Error("Empty response from Receiving API");
    }
    full = result.data as ReceivedEmail;
  } catch (err) {
    // Don't mark as processed — nothing happened yet, so a genuine retry
    // from Resend is exactly what we want here.
    console.error("Failed to fetch inbound email content:", err);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }

  const fromAddress = extractEmailAddress(full.from);
  const subject = full.subject ?? "";
  const bodyText = full.text ?? "";

  // Emails via this channel only ever create a reservation — cancelling
  // is handled exclusively on the website (/cancelar), never by email.
  // A parser mismatch (including an email that just contains a code, or
  // free-form text) falls through to the manual-review path below.

  // New reservation: parse the fixed template produced by the "reservar
  // por correo" mailto button.
  const parsed = parseReservationRequest(bodyText);
  if (parsed) {
    const depositRequired = calculateDeposit(parsed.partySize);
    const depositAmount = parsed.depositAmount ?? 0;

    let result;
    try {
      result = await bookReservation({
        name: parsed.name,
        email: fromAddress,
        phone: null,
        partySize: parsed.partySize,
        date: parsed.date,
        time: parsed.time,
        occasion: null,
        notes: parsed.notes,
        depositRequired,
        depositAmount,
        depositReference: parsed.depositReference,
        source: "email",
        lang: parsed.lang,
      });
    } catch (err) {
      console.error("bookReservation from email webhook failed:", err);
      return NextResponse.json({ error: "book_failed" }, { status: 500 });
    }

    await markWebhookEventProcessed(emailId);

    if (result.status === "pending_deposit" && result.code) {
      try {
        await sendDepositPendingNotice({
          to: fromAddress,
          code: result.code,
          name: parsed.name,
          partySize: parsed.partySize,
          date: parsed.date,
          time: parsed.time,
          lang: parsed.lang,
        });
      } catch (err) {
        console.error(
          "Failed to send deposit-pending email (inbound flow):",
          err,
        );
      }

      // Every pending deposit needs a human to review it on /admin —
      // unlike the general notification, this always tries to alert
      // staff (subject to alertStaff()'s loop-avoidance guard above).
      try {
        await alertStaff((staffEmail) =>
          sendStaffDepositReviewAlert({
            staffEmail,
            code: result.code!,
            name: parsed.name,
            email: fromAddress,
            phone: null,
            partySize: parsed.partySize,
            date: parsed.date,
            time: parsed.time,
            occasion: null,
            notes: parsed.notes,
            source: "email",
            depositRequired,
            depositAmount,
            depositReference: parsed.depositReference,
          }),
        );
      } catch (err) {
        console.error("Failed to send staff deposit review alert:", err);
      }
    } else {
      // Most commonly "full" (that time just filled up) — could also be
      // unknown_slot/invalid_party_size, which the parser's own
      // validation should already prevent, but a human handles the edge
      // case either way rather than us guessing at next steps.
      try {
        await sendEmailParseFailureNotice({
          to: fromAddress,
          lang: parsed.lang,
        });
        await alertStaff((staffEmail) =>
          sendManualReviewAlert({
            staffEmail,
            fromAddress,
            subject,
            rawText: `[Solicitud de reserva por correo — resultado: ${result.status}]\n\n${bodyText}`,
          }),
        );
      } catch (err) {
        console.error("Failed to send booking follow-up emails:", err);
      }
    }

    return NextResponse.json({ status: "handled_booking" }, { status: 200 });
  }

  // Couldn't read anything usable (or the email wasn't a reservation
  // request at all, e.g. contained a code instead) — hand off to a
  // human, and let the customer know their email arrived and is being
  // looked at.
  await markWebhookEventProcessed(emailId);
  try {
    await sendEmailParseFailureNotice({ to: fromAddress, lang: "es" });
    await alertStaff((staffEmail) =>
      sendManualReviewAlert({
        staffEmail,
        fromAddress,
        subject,
        rawText: bodyText,
      }),
    );
  } catch (err) {
    console.error("Failed to send manual-review emails:", err);
  }

  return NextResponse.json(
    { status: "handled_manual_review" },
    { status: 200 },
  );
}
