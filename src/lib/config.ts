// Single source of truth for contact details shown across the site. Reads
// from public env vars (safe to expose to the client) so the real business
// info can be updated in Vercel's dashboard without a code change.

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "573000000000";

export const PHONE_E164 = `+${WHATSAPP_NUMBER}`;

export const PHONE_DISPLAY =
  process.env.NEXT_PUBLIC_PHONE_DISPLAY ?? "+57 300 000 0000";

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_RESERVATIONS_EMAIL ?? "ponmusicalsound@gmail.com";

// Optional: a real inbox (e.g. the owner's Gmail) that gets a copy of
// every confirmed reservation, regardless of whether it came from the
// website form or the "reservar por correo" email flow. Server-only
// (no NEXT_PUBLIC_ prefix) since it's never read in client code — only
// used inside the API routes that confirm a booking. Left unset during
// development/testing so test reservations don't spam a real inbox;
// set it in .env.local once ready to go live.
export const STAFF_NOTIFICATION_EMAIL =
  process.env.STAFF_NOTIFICATION_EMAIL || null;

// --- Reservation deposit (manual bank transfer, verified by staff) ---
// There's no payment gateway wired up yet — the customer transfers this
// amount to the account below, using a reference code the wizard
// generates, and reports what they transferred. Staff matches that
// reference against the bank statement to verify it manually.
export const DEPOSIT_PER_PERSON = Number(
  process.env.NEXT_PUBLIC_DEPOSIT_PER_PERSON ?? "30000",
);

export function calculateDeposit(partySize: number): number {
  return DEPOSIT_PER_PERSON * Math.max(partySize, 0);
}

export const BANK_NAME = "Davivienda";
export const BANK_ACCOUNT_TYPE = "Ahorros";
export const BANK_ACCOUNT_NUMBER = "0550108900878373";
export const BANK_ACCOUNT_HOLDER = "P.O.N Musical Sound S.A.S · NIT 9019150013";

// Shared password for the /admin deposit-verification panel. There's no
// per-person login system — just one password the team shares, checked
// against this env var. Server-only (no NEXT_PUBLIC_ prefix). Falls back
// to a placeholder in local dev so `npm run dev` works out of the box;
// set a real one in .env.local before this ever goes live.
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "ponlounge-admin";

export const ADDRESS_LINE =
  process.env.NEXT_PUBLIC_ADDRESS ??
  "Cra 44 #20-28, Distrito Vera, El Poblado, Medellín, Colombia";

// Social links — unset (undefined) until the client shares the real
// handles. Components should skip rendering a link whose value is
// undefined rather than pointing it at "#".
export const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL;
export const FACEBOOK_URL = process.env.NEXT_PUBLIC_FACEBOOK_URL;
export const TIKTOK_URL = process.env.NEXT_PUBLIC_TIKTOK_URL;
