import { test, expect } from "@playwright/test";

// Unlike reservation-wizard.spec.ts, this suite deliberately does NOT mock
// the reservations API: /cancelar/[code] fetches its reservation
// server-side (a Server Component calling the store directly), which
// page.route() can't intercept - only real requests reach it. Each test
// books a real (local-store) reservation on its own far-future date to
// avoid any capacity collision with other parallel tests.
//
// Every booking now requires a self-declared deposit (party size * price
// per guest) — $30,000 COP/guest by default — sent as an already-fully-
// paid amount so the request succeeds as a normal booking test fixture,
// even though it lands as "pending_deposit" rather than immediately
// "confirmed" (see reservation-wizard.spec.ts for coverage of that
// status). Cancelling a pending-deposit reservation is allowed the same
// way as a confirmed one.

const DEPOSIT_PER_GUEST = 30000;

test.describe("Standalone cancellation page", () => {
  test("shows reservation details and cancels on confirm", async ({
    page,
    request,
  }) => {
    const partySize = 2;
    const bookRes = await request.post("/api/reservations", {
      data: {
        name: "Carlos Ruiz",
        email: "",
        partySize,
        date: "2099-03-15",
        time: "19:00",
        lang: "es",
        depositAmount: partySize * DEPOSIT_PER_GUEST,
      },
    });
    expect(bookRes.status()).toBe(201);
    const { code } = await bookRes.json();

    await page.goto(`/cancelar/${code}`);
    await expect(page.getByText("Carlos Ruiz")).toBeVisible();
    const confirmButton = page.getByRole("button", {
      name: "Confirmar cancelación",
    });
    await expect(confirmButton).toBeVisible();

    await confirmButton.click();
    await expect(page.getByText("Reserva cancelada")).toBeVisible();
  });

  test("shows an already-cancelled state on a second visit", async ({
    page,
    request,
  }) => {
    const partySize = 2;
    const bookRes = await request.post("/api/reservations", {
      data: {
        name: "Marta Gil",
        email: "",
        partySize,
        date: "2099-03-16",
        time: "19:00",
        lang: "es",
        depositAmount: partySize * DEPOSIT_PER_GUEST,
      },
    });
    const { code } = await bookRes.json();
    await request.post(`/api/reservations/${code}/cancel`);

    await page.goto(`/cancelar/${code}`);
    await expect(page.getByText("Esta reserva ya fue cancelada")).toBeVisible();
  });

  test("shows a not-found state for an unknown code", async ({ page }) => {
    await page.goto("/cancelar/PON-ZZZZZZ");
    await expect(page.getByText("No encontramos esta reserva")).toBeVisible();
  });
});
