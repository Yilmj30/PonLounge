"use client";

import { useState } from "react";

// Shared network + state logic for cancelling a reservation by its
// confirmation code — used by both the inline "cancel" block in
// ReservationWizard (right after booking, same session) and the
// standalone /cancelar/[code] page (reached via the code typed into the
// lookup form, or the link in the confirmation email). Keeping the
// fetch/error handling here means both UIs only have to render, not
// duplicate the request logic.

export type CancelState =
  | "idle"
  | "confirming"
  | "cancelling"
  | "cancelled"
  | "tooLate"
  | "alreadyCancelled"
  | "error";

export function useCancelReservation(code: string, lang: "es" | "en" = "es") {
  const [state, setState] = useState<CancelState>("idle");

  async function requestCancel() {
    setState("cancelling");
    try {
      const res = await fetch(
        `/api/reservations/${encodeURIComponent(code)}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lang }),
        },
      );

      if (res.status === 200) {
        setState("cancelled");
        return;
      }
      if (res.status === 409) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setState(body?.error === "too_late" ? "tooLate" : "alreadyCancelled");
        return;
      }
      setState("error");
    } catch {
      setState("error");
    }
  }

  return { state, setState, requestCancel };
}
