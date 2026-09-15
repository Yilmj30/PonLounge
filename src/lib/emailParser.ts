// Parses incoming customer emails sent via the "reservar por correo" mailto
// fallback (ReservationWizard.tsx -> buildReservationMessage()). That
// button always fills a fixed template — this parser reads exactly that
// template back out, in either language, using labeled fields rather than
// trying to understand free-form writing. If the customer edits the
// template heavily, parsing fails cleanly rather than guessing.
//
// Also detects a confirmation code (PON-XXXXXX) anywhere in the email —
// used to route cancellation requests sent by email.

export type ParsedReservationRequest = {
  lang: "es" | "en";
  name: string;
  partySize: number;
  date: string;
  time: string;
  notes: string | null;
  depositAmount: number | null;
  depositReference: string | null;
};

// Same alphabet/shape as generated in localStore.ts: PON- followed by 6
// characters, no 0/O/1/I.
const CODE_PATTERN = /\bPON-[A-Z0-9]{6}\b/i;

export function extractConfirmationCode(text: string): string | null {
  const match = text.match(CODE_PATTERN);
  return match ? match[0].toUpperCase() : null;
}

// Field labels, matched case-insensitively at the start of a line (after
// stripping common email-client quoting like "> "). Order in the email
// doesn't matter — each field is searched independently.
const FIELD_PATTERNS = {
  es: {
    name: /^[ \t]*nombre[ \t]*:[ \t]*(.+)$/im,
    partySize: /^[ \t]*personas[ \t]*:[ \t]*(\d+)/im,
    date: /^[ \t]*fecha[ \t]*:[ \t]*(\d{4}-\d{2}-\d{2})/im,
    time: /^[ \t]*hora[ \t]*:[ \t]*(\d{1,2}:\d{2})/im,
    notes: /^[ \t]*notas[ \t]*:[ \t]*(.+)$/im,
    depositAmount:
      /^[ \t]*dep[oó]sito transferido[ \t]*:[ \t]*\$?[ \t]*([\d.,]+)/im,
    depositReference: /^[ \t]*referencia[ \t]*:[ \t]*(\S+)/im,
  },
  en: {
    name: /^[ \t]*name[ \t]*:[ \t]*(.+)$/im,
    partySize: /^[ \t]*guests[ \t]*:[ \t]*(\d+)/im,
    date: /^[ \t]*date[ \t]*:[ \t]*(\d{4}-\d{2}-\d{2})/im,
    time: /^[ \t]*time[ \t]*:[ \t]*(\d{1,2}:\d{2})/im,
    notes: /^[ \t]*notes[ \t]*:[ \t]*(.+)$/im,
    depositAmount:
      /^[ \t]*deposit transferred[ \t]*:[ \t]*\$?[ \t]*([\d.,]+)/im,
    depositReference: /^[ \t]*reference[ \t]*:[ \t]*(\S+)/im,
  },
} as const;

function stripQuoting(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*>+\s?/, ""))
    .join("\n");
}

function normalizeTime(raw: string): string {
  const [h, m] = raw.split(":");
  return `${(h ?? "").padStart(2, "0")}:${m ?? ""}`;
}

// Tries Spanish labels first, then English. Returns null if the required
// fields (name, partySize, date, time) aren't all present and valid —
// notes is optional. A caller with a null result should treat this as
// "couldn't parse automatically" and fall back to a human.
export function parseReservationRequest(
  rawText: string,
): ParsedReservationRequest | null {
  const text = stripQuoting(rawText);

  for (const lang of ["es", "en"] as const) {
    const patterns = FIELD_PATTERNS[lang];
    const nameMatch = text.match(patterns.name);
    const partySizeMatch = text.match(patterns.partySize);
    const dateMatch = text.match(patterns.date);
    const timeMatch = text.match(patterns.time);

    if (
      !nameMatch?.[1] ||
      !partySizeMatch?.[1] ||
      !dateMatch?.[1] ||
      !timeMatch?.[1]
    ) {
      continue;
    }

    const name = nameMatch[1].trim();
    const partySize = Number(partySizeMatch[1]);
    const date = dateMatch[1];
    const time = normalizeTime(timeMatch[1]);
    const notesMatch = text.match(patterns.notes);
    const depositAmountMatch = text.match(patterns.depositAmount);
    const depositReferenceMatch = text.match(patterns.depositReference);

    if (!name) continue;
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 30) {
      continue;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (!/^\d{2}:\d{2}$/.test(time)) continue;

    const depositAmount = depositAmountMatch?.[1]
      ? Number(depositAmountMatch[1].replace(/[.,]/g, ""))
      : null;

    return {
      lang,
      name,
      partySize,
      date,
      time,
      notes: notesMatch?.[1] ? notesMatch[1].trim() : null,
      depositAmount:
        depositAmount != null && Number.isFinite(depositAmount)
          ? depositAmount
          : null,
      depositReference: depositReferenceMatch?.[1]?.trim() ?? null,
    };
  }

  return null;
}
