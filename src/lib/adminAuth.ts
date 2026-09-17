import { cookies } from "next/headers";
import { ADMIN_PASSWORD, STAFF_PASSWORD } from "./config";

// Shared-password sessions for /admin, with two levels:
//
//   - "owner": the full panel, including the menu editor (/admin/carta).
//   - "staff": deposit review only — employees can confirm reservations but
//     can't change prices or products.
//
// This is intentionally not a per-person login system; it's two passwords
// the team shares. The cookie holds the password itself (not the role
// name) so it can't be forged by simply writing "owner" into it — the
// role is derived by matching that value against each password.
export const ADMIN_SESSION_COOKIE = "pon_admin_session";

export type AdminRole = "owner" | "staff";

export function roleForPassword(password: string): AdminRole | null {
  // Owner wins if both passwords were set to the same value.
  if (password === ADMIN_PASSWORD) return "owner";
  if (password === STAFF_PASSWORD) return "staff";
  return null;
}

export async function getAdminRole(): Promise<AdminRole | null> {
  const store = await cookies();
  const value = store.get(ADMIN_SESSION_COOKIE)?.value;
  return value ? roleForPassword(value) : null;
}

// Logged in at any level — enough for the deposits panel.
export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getAdminRole()) !== null;
}

// Owners only — the menu editor and its API routes.
export async function isOwnerAuthenticated(): Promise<boolean> {
  return (await getAdminRole()) === "owner";
}
