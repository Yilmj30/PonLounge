import { cookies } from "next/headers";
import { ADMIN_PASSWORD } from "./config";

// Simple shared-password session for the /admin deposit-review panel —
// one password the whole team uses, stored as a plain cookie value. This
// is intentionally not a real multi-user auth system; it's enough to
// keep the panel away from the general public while staying easy for a
// small team to share.
export const ADMIN_SESSION_COOKIE = "pon_admin_session";

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(ADMIN_SESSION_COOKIE)?.value;
  return value === ADMIN_PASSWORD;
}
