import { Resend } from "resend";
import { formatDate, formatTime } from "./reservation";
import { formatCOP } from "./currency";
import type { Lang } from "./i18n/dictionaries";

const FROM_ADDRESS = "PON Lounge <reservas@ponlounge.com>";

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY env var");
  }
  resendClient ??= new Resend(apiKey);
  return resendClient;
}

export async function sendReservationConfirmation({
  to,
  code,
  name,
  partySize,
  date,
  time,
  lang,
}: {
  to: string;
  code: string;
  name: string;
  partySize: number;
  date: string;
  time: string;
  lang: Lang;
}) {
  const resend = getResendClient();

  const subject =
    lang === "es"
      ? `Reserva confirmada — PON Lounge, ${formatDate(date, lang)}`
      : `Reservation confirmed — PON Lounge, ${formatDate(date, lang)}`;

  const html = renderConfirmationHtml({
    code,
    name,
    partySize,
    date,
    time,
    lang,
  });

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

function renderConfirmationHtml({
  code,
  name,
  partySize,
  date,
  time,
  lang,
}: {
  code: string;
  name: string;
  partySize: number;
  date: string;
  time: string;
  lang: Lang;
}) {
  const t =
    lang === "es"
      ? {
          heading: "Tu reserva está confirmada",
          greeting: `Hola ${name},`,
          body: "Te esperamos en PON Lounge. Aquí el resumen de tu reserva:",
          people: "Personas",
          date: "Fecha",
          time: "Hora",
          codeLabel: "Código de reserva",
          codeNote:
            "Lo necesitas para cancelar por tu cuenta si no puedes venir.",
          cancelButton: "Cancelar mi reserva",
          footer:
            "¿Necesitas cambiar algo o cancelar? Usa el botón de arriba, escríbenos por WhatsApp, o responde a este correo.",
        }
      : {
          heading: "Your reservation is confirmed",
          greeting: `Hi ${name},`,
          body: "We look forward to seeing you at PON Lounge. Here's your reservation summary:",
          people: "Guests",
          date: "Date",
          time: "Time",
          codeLabel: "Confirmation code",
          codeNote:
            "You'll need it to cancel on your own if you can't make it.",
          cancelButton: "Cancel my reservation",
          footer:
            "Need to change something or cancel? Use the button above, message us on WhatsApp, or just reply to this email.",
        };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100";
  const cancelUrl = `${siteUrl}/cancelar/${code}`;

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#0b0d10;padding:32px;color:#f2ece0;">
    <div style="max-width:480px;margin:0 auto;background:#14181d;border:1px solid rgba(242,236,224,0.12);border-radius:16px;padding:32px;">
      <p style="color:#b98d4b;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">PON Lounge</p>
      <h1 style="font-size:22px;margin:0 0 20px;color:#f2ece0;">${t.heading}</h1>
      <p style="margin:0 0 8px;">${t.greeting}</p>
      <p style="margin:0 0 24px;color:#c9c0ae;">${t.body}</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#c9c0ae;border-bottom:1px dashed rgba(242,236,224,0.15);">${t.people}</td>
          <td style="padding:8px 0;text-align:right;font-weight:bold;border-bottom:1px dashed rgba(242,236,224,0.15);">${partySize}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#c9c0ae;border-bottom:1px dashed rgba(242,236,224,0.15);">${t.date}</td>
          <td style="padding:8px 0;text-align:right;font-weight:bold;border-bottom:1px dashed rgba(242,236,224,0.15);">${formatDate(date, lang)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#c9c0ae;">${t.time}</td>
          <td style="padding:8px 0;text-align:right;font-weight:bold;">${formatTime(time)}</td>
        </tr>
      </table>
      <div style="margin:20px 0 0;padding:14px;border:1px dashed rgba(185,141,75,0.5);border-radius:10px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#b98d4b;">${t.codeLabel}</p>
        <p style="margin:0;font-size:18px;font-weight:bold;letter-spacing:2px;color:#f2ece0;">${code}</p>
        <p style="margin:6px 0 0;font-size:11px;color:#c9c0ae;">${t.codeNote}</p>
      </div>
      <a href="${cancelUrl}" style="display:block;text-align:center;margin:16px 0 0;padding:12px 20px;border-radius:999px;border:1px dashed rgba(185,141,75,0.55);color:#d9b578;text-decoration:none;font-size:13px;font-weight:bold;">${t.cancelButton}</a>
      <p style="margin:16px 0 0;font-size:13px;color:#c9c0ae;">${t.footer}</p>
    </div>
  </div>`;
}

export async function sendCancellationEmail({
  to,
  name,
  date,
  time,
  lang,
}: {
  to: string;
  name: string;
  date: string;
  time: string;
  lang: Lang;
}) {
  const resend = getResendClient();

  const subject =
    lang === "es"
      ? `Reserva cancelada — PON Lounge, ${formatDate(date, lang)}`
      : `Reservation cancelled — PON Lounge, ${formatDate(date, lang)}`;

  const t =
    lang === "es"
      ? {
          heading: "Tu reserva fue cancelada",
          greeting: `Hola ${name},`,
          body: "Confirmamos que tu reserva fue cancelada. Ese horario ya quedó libre para otras personas.",
          date: "Fecha",
          time: "Hora",
          footer:
            "Si fue un error o quieres reservar de nuevo, entra a la página de reservas cuando quieras.",
        }
      : {
          heading: "Your reservation was cancelled",
          greeting: `Hi ${name},`,
          body: "This confirms your reservation was cancelled. That time slot is now open for others.",
          date: "Date",
          time: "Time",
          footer:
            "If this was a mistake or you'd like to book again, visit the reservations page anytime.",
        };

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#0b0d10;padding:32px;color:#f2ece0;">
    <div style="max-width:480px;margin:0 auto;background:#14181d;border:1px solid rgba(242,236,224,0.12);border-radius:16px;padding:32px;">
      <p style="color:#b98d4b;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">PON Lounge</p>
      <h1 style="font-size:22px;margin:0 0 20px;color:#f2ece0;">${t.heading}</h1>
      <p style="margin:0 0 8px;">${t.greeting}</p>
      <p style="margin:0 0 24px;color:#c9c0ae;">${t.body}</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#c9c0ae;border-bottom:1px dashed rgba(242,236,224,0.15);">${t.date}</td>
          <td style="padding:8px 0;text-align:right;font-weight:bold;border-bottom:1px dashed rgba(242,236,224,0.15);">${formatDate(date, lang)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#c9c0ae;">${t.time}</td>
          <td style="padding:8px 0;text-align:right;font-weight:bold;">${formatTime(time)}</td>
        </tr>
      </table>
      <p style="margin:24px 0 0;font-size:13px;color:#c9c0ae;">${t.footer}</p>
    </div>
  </div>`;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

// Sent to the customer when their "reservar por correo" email couldn't be
// read automatically (missing/malformed fields). Reassures them the
// email was received and that staff will follow up, rather than leaving
// them wondering if it went into a void.
export async function sendEmailParseFailureNotice({
  to,
  lang,
}: {
  to: string;
  lang: Lang;
}) {
  const resend = getResendClient();

  const t =
    lang === "es"
      ? {
          subject: "Recibimos tu correo — PON Lounge",
          heading: "Recibimos tu solicitud",
          body: "No pudimos leer automáticamente los datos de tu reserva (nombre, personas, fecha y hora). Nuestro equipo la va a revisar y te contactamos pronto para confirmar los detalles.",
          footer:
            "Si prefieres, también puedes reservar directamente en nuestra página web o escribirnos por WhatsApp.",
        }
      : {
          subject: "We received your email — PON Lounge",
          heading: "We received your request",
          body: "We couldn't automatically read your reservation details (name, guests, date, and time). Our team will review it and reach out shortly to confirm.",
          footer:
            "You're also welcome to book directly on our website or message us on WhatsApp.",
        };

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#0b0d10;padding:32px;color:#f2ece0;">
    <div style="max-width:480px;margin:0 auto;background:#14181d;border:1px solid rgba(242,236,224,0.12);border-radius:16px;padding:32px;">
      <p style="color:#b98d4b;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">PON Lounge</p>
      <h1 style="font-size:20px;margin:0 0 16px;color:#f2ece0;">${t.heading}</h1>
      <p style="margin:0 0 16px;color:#c9c0ae;">${t.body}</p>
      <p style="margin:0;font-size:13px;color:#c9c0ae;">${t.footer}</p>
    </div>
  </div>`;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: t.subject,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

// Internal alert to staff (CONTACT_EMAIL) when an incoming "reservar por
// correo" email couldn't be parsed automatically and needs a human to
// read the original message and follow up manually.
export async function sendManualReviewAlert({
  staffEmail,
  fromAddress,
  subject,
  rawText,
}: {
  staffEmail: string;
  fromAddress: string;
  subject: string;
  rawText: string;
}) {
  const resend = getResendClient();

  const escapedText = rawText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#0b0d10;padding:32px;color:#f2ece0;">
    <div style="max-width:560px;margin:0 auto;background:#14181d;border:1px solid rgba(242,236,224,0.12);border-radius:16px;padding:32px;">
      <p style="color:#b98d4b;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Correo de reserva sin leer automáticamente</p>
      <p style="margin:0 0 4px;color:#c9c0ae;font-size:13px;">De: <strong style="color:#f2ece0;">${fromAddress}</strong></p>
      <p style="margin:0 0 16px;color:#c9c0ae;font-size:13px;">Asunto: ${subject || "(sin asunto)"}</p>
      <pre style="white-space:pre-wrap;background:#0b0d10;border-radius:10px;padding:16px;font-size:13px;color:#f2ece0;border:1px solid rgba(242,236,224,0.1);">${escapedText}</pre>
      <p style="margin:16px 0 0;font-size:12px;color:#c9c0ae;">Este cliente ya recibió un aviso automático de que su solicitud está en revisión — contáctalo directamente para confirmar los detalles.</p>
    </div>
  </div>`;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: staffEmail,
    subject: `Reserva por correo sin leer — ${fromAddress}`,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

// Sent to the customer right after they submit a reservation with a
// deposit — NOT a confirmation. Their code is included so they can look
// up the status later, but the copy is deliberately non-celebratory:
// the reservation isn't final until staff verifies the transfer.
export async function sendDepositPendingNotice({
  to,
  code,
  name,
  partySize,
  date,
  time,
  lang,
}: {
  to: string;
  code: string;
  name: string;
  partySize: number;
  date: string;
  time: string;
  lang: Lang;
}) {
  const resend = getResendClient();

  const t =
    lang === "es"
      ? {
          subject: `Recibimos tu solicitud — PON Lounge, ${formatDate(date, lang)}`,
          heading: "Recibimos tu solicitud de reserva",
          greeting: `Hola ${name},`,
          body: "Estamos verificando tu depósito. En cuanto lo confirmemos, te llega un correo con la reserva ya lista.",
          people: "Personas",
          date: "Fecha",
          time: "Hora",
          codeLabel: "Código de referencia",
          codeNote:
            "Guárdalo — lo puedes usar para consultar el estado de tu solicitud.",
          footer: "¿Dudas? Escríbenos por WhatsApp.",
        }
      : {
          subject: `We received your request — PON Lounge, ${formatDate(date, lang)}`,
          heading: "We received your reservation request",
          greeting: `Hi ${name},`,
          body: "We're verifying your deposit. Once confirmed, you'll get an email with your reservation all set.",
          people: "Guests",
          date: "Date",
          time: "Time",
          codeLabel: "Reference code",
          codeNote: "Keep it — you can use it to check your request's status.",
          footer: "Questions? Message us on WhatsApp.",
        };

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#0b0d10;padding:32px;color:#f2ece0;">
    <div style="max-width:480px;margin:0 auto;background:#14181d;border:1px solid rgba(242,236,224,0.12);border-radius:16px;padding:32px;">
      <p style="color:#b98d4b;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">PON Lounge</p>
      <h1 style="font-size:20px;margin:0 0 16px;color:#f2ece0;">${t.heading}</h1>
      <p style="margin:0 0 8px;">${t.greeting}</p>
      <p style="margin:0 0 20px;color:#c9c0ae;">${t.body}</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#c9c0ae;border-bottom:1px dashed rgba(242,236,224,0.15);">${t.people}</td>
          <td style="padding:8px 0;text-align:right;font-weight:bold;border-bottom:1px dashed rgba(242,236,224,0.15);">${partySize}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#c9c0ae;border-bottom:1px dashed rgba(242,236,224,0.15);">${t.date}</td>
          <td style="padding:8px 0;text-align:right;font-weight:bold;border-bottom:1px dashed rgba(242,236,224,0.15);">${formatDate(date, lang)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#c9c0ae;">${t.time}</td>
          <td style="padding:8px 0;text-align:right;font-weight:bold;">${formatTime(time)}</td>
        </tr>
      </table>
      <div style="margin:20px 0 0;padding:14px;border:1px dashed rgba(185,141,75,0.5);border-radius:10px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#b98d4b;">${t.codeLabel}</p>
        <p style="margin:0;font-size:18px;font-weight:bold;letter-spacing:2px;color:#f2ece0;">${code}</p>
        <p style="margin:6px 0 0;font-size:11px;color:#c9c0ae;">${t.codeNote}</p>
      </div>
      <p style="margin:16px 0 0;font-size:13px;color:#c9c0ae;">${t.footer}</p>
    </div>
  </div>`;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: t.subject,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

// Sent to the customer once staff APPROVES the deposit — this is the
// real, celebratory confirmation (equivalent to what used to be sent
// immediately before the review step existed).
export async function sendDepositApprovedEmail({
  to,
  code,
  name,
  partySize,
  date,
  time,
  lang,
}: {
  to: string;
  code: string;
  name: string;
  partySize: number;
  date: string;
  time: string;
  lang: Lang;
}) {
  await sendReservationConfirmation({
    to,
    code,
    name,
    partySize,
    date,
    time,
    lang,
  });
}

// Sent to the customer if staff REJECTS the deposit (couldn't verify the
// transfer). Invites them to try again or reach out.
export async function sendDepositRejectedEmail({
  to,
  name,
  date,
  time,
  lang,
}: {
  to: string;
  name: string;
  date: string;
  time: string;
  lang: Lang;
}) {
  const resend = getResendClient();

  const t =
    lang === "es"
      ? {
          subject: "No pudimos verificar tu depósito — PON Lounge",
          heading: "No pudimos confirmar tu reserva",
          greeting: `Hola ${name},`,
          body: "No logramos verificar el depósito para la reserva que solicitaste. Si crees que fue un error, o si quieres intentar de nuevo, escríbenos por WhatsApp y te ayudamos.",
          footer:
            "Puedes hacer una nueva solicitud desde la página cuando quieras.",
        }
      : {
          subject: "We couldn't verify your deposit — PON Lounge",
          heading: "We couldn't confirm your reservation",
          greeting: `Hi ${name},`,
          body: "We weren't able to verify the deposit for the reservation you requested. If you think this is a mistake, or you'd like to try again, message us on WhatsApp and we'll help.",
          footer:
            "You're welcome to submit a new request from the website anytime.",
        };

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#0b0d10;padding:32px;color:#f2ece0;">
    <div style="max-width:480px;margin:0 auto;background:#14181d;border:1px solid rgba(242,236,224,0.12);border-radius:16px;padding:32px;">
      <p style="color:#b98d4b;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">PON Lounge</p>
      <h1 style="font-size:20px;margin:0 0 16px;color:#f2ece0;">${t.heading}</h1>
      <p style="margin:0 0 8px;">${t.greeting}</p>
      <p style="margin:0 0 20px;color:#c9c0ae;">${t.body}</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;color:#c9c0ae;">
        <tr><td style="padding:4px 0;">${date} · ${time}</td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#c9c0ae;">${t.footer}</p>
    </div>
  </div>`;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: t.subject,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

// Internal alert sent to staff for EVERY pending deposit — not gated by
// whether the customer's own confirmation succeeded, since this is what
// tells a human "go check /admin".
export async function sendStaffDepositReviewAlert({
  staffEmail,
  code,
  name,
  email,
  phone,
  partySize,
  date,
  time,
  occasion,
  notes,
  source,
  depositRequired,
  depositAmount,
  depositReference,
}: {
  staffEmail: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  partySize: number;
  date: string;
  time: string;
  occasion: string | null;
  notes: string | null;
  source: "web" | "email";
  depositRequired: number;
  depositAmount: number;
  depositReference: string | null;
}) {
  const resend = getResendClient();

  const sourceLabel =
    source === "web"
      ? "Formulario de la página"
      : "Correo (reservar por correo)";

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#0b0d10;padding:32px;color:#f2ece0;">
    <div style="max-width:520px;margin:0 auto;background:#14181d;border:1px solid rgba(242,236,224,0.12);border-radius:16px;padding:32px;">
      <p style="color:#e0b458;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Depósito pendiente de verificar</p>
      <h1 style="font-size:20px;margin:0 0 20px;color:#f2ece0;">${code}</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#c9c0ae;">Nombre</td><td style="padding:6px 0;text-align:right;font-weight:bold;">${name}</td></tr>
        <tr><td style="padding:6px 0;color:#c9c0ae;">Correo</td><td style="padding:6px 0;text-align:right;">${email ?? "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#c9c0ae;">Teléfono</td><td style="padding:6px 0;text-align:right;">${phone ?? "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#c9c0ae;">Personas</td><td style="padding:6px 0;text-align:right;">${partySize}</td></tr>
        <tr><td style="padding:6px 0;color:#c9c0ae;">Fecha</td><td style="padding:6px 0;text-align:right;">${formatDate(date, "es")}</td></tr>
        <tr><td style="padding:6px 0;color:#c9c0ae;">Hora</td><td style="padding:6px 0;text-align:right;">${formatTime(time)}</td></tr>
        ${occasion ? `<tr><td style="padding:6px 0;color:#c9c0ae;">Ocasión</td><td style="padding:6px 0;text-align:right;">${occasion}</td></tr>` : ""}
        ${notes ? `<tr><td style="padding:6px 0;color:#c9c0ae;">Notas</td><td style="padding:6px 0;text-align:right;">${notes}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#c9c0ae;">Origen</td><td style="padding:6px 0;text-align:right;">${sourceLabel}</td></tr>
      </table>
      <div style="margin:20px 0 0;padding:16px;border-radius:10px;background:rgba(224,180,88,0.1);border:1px solid rgba(224,180,88,0.35);">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#e0b458;">Depósito reportado por el cliente</p>
        <p style="margin:0;font-size:16px;font-weight:bold;">${formatCOP(depositAmount)} <span style="font-weight:normal;color:#c9c0ae;font-size:12px;">/ ${formatCOP(depositRequired)} requeridos</span></p>
        <p style="margin:8px 0 0;font-size:13px;color:#c9c0ae;">Referencia para buscar en el extracto: <strong style="color:#f2ece0;">${depositReference ?? "no dio ninguna"}</strong></p>
      </div>
      <p style="margin:16px 0 0;font-size:12px;color:#c9c0ae;">Revisa y aprueba/rechaza esta reserva en /admin.</p>
    </div>
  </div>`;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: staffEmail,
    subject: `Verificar depósito — ${code} (${name})`,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

// Internal alert sent to staff whenever a reservation gets cancelled —
// via the /cancelar page, the "cancel now" button right after booking,
// or the confirmation email's cancel link. Lets the team know a table
// just freed up without them having to check the system. Gated behind
// STAFF_NOTIFICATION_EMAIL the same way the other staff alerts are —
// callers should skip this entirely when it's unset rather than pass an
// empty string.
export async function sendStaffCancellationAlert({
  staffEmail,
  code,
  name,
  email,
  date,
  time,
  partySize,
}: {
  staffEmail: string;
  code: string;
  name: string;
  email: string | null;
  date: string;
  time: string;
  partySize: number | null;
}) {
  const resend = getResendClient();

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#0b0d10;padding:32px;color:#f2ece0;">
    <div style="max-width:520px;margin:0 auto;background:#14181d;border:1px solid rgba(242,236,224,0.12);border-radius:16px;padding:32px;">
      <p style="color:#e08a8a;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Reserva cancelada</p>
      <h1 style="font-size:20px;margin:0 0 20px;color:#f2ece0;">${code}</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#c9c0ae;">Nombre</td><td style="padding:6px 0;text-align:right;font-weight:bold;">${name}</td></tr>
        <tr><td style="padding:6px 0;color:#c9c0ae;">Correo</td><td style="padding:6px 0;text-align:right;">${email ?? "—"}</td></tr>
        ${partySize != null ? `<tr><td style="padding:6px 0;color:#c9c0ae;">Personas</td><td style="padding:6px 0;text-align:right;">${partySize}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#c9c0ae;">Fecha</td><td style="padding:6px 0;text-align:right;">${formatDate(date, "es")}</td></tr>
        <tr><td style="padding:6px 0;color:#c9c0ae;">Hora</td><td style="padding:6px 0;text-align:right;">${formatTime(time)}</td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#c9c0ae;">Ese horario ya quedó libre de nuevo para otros clientes.</p>
    </div>
  </div>`;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: staffEmail,
    subject: `Reserva cancelada — ${code} (${name})`,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
