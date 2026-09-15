import { test, expect, type Page } from "@playwright/test";

const MOCK_SLOTS = [
  { time: "18:00", capacity: 40, booked: 6 },
  { time: "19:00", capacity: 40, booked: 21 },
  { time: "20:00", capacity: 40, booked: 33 },
  { time: "21:00", capacity: 30, booked: 30 }, // full
  { time: "22:00", capacity: 30, booked: 9 },
];

async function mockAvailability(page: Page) {
  await page.route("**/api/availability*", (route) =>
    route.fulfill({ json: { date: "2026-09-01", slots: MOCK_SLOTS } }),
  );
}

async function mockReservationOutcome(
  page: Page,
  outcome: "confirmed" | "full",
) {
  await page.route("**/api/reservations", (route) =>
    outcome === "confirmed"
      ? route.fulfill({
          status: 201,
          json: {
            id: "test-id",
            code: "PON-TEST01",
            status: "pending_deposit",
            remaining: 5,
            depositRequired: 30000,
          },
        })
      : route.fulfill({
          status: 409,
          json: { error: "full", remaining: 0 },
        }),
  );
}

// Every booking now requires the customer to upload a screenshot of their
// deposit transfer before the confirm button is even enabled — this
// mocks that upload endpoint and simulates attaching a small fake image
// so the flow can proceed past that gate in tests.
async function mockReceiptUpload(page: Page) {
  await page.route("**/api/deposit-receipts", (route) =>
    route.fulfill({ status: 201, json: { status: "ok" } }),
  );
}

async function uploadFakeReceipt(page: Page) {
  await page.locator("#deposit-receipt").setInputFiles({
    name: "comprobante.png",
    mimeType: "image/png",
    // Smallest possible valid PNG — content doesn't matter, only that
    // it's accepted as a file of the right type by the input+mocked API.
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.getByText("Comprobante recibido.")).toBeVisible();
}

test.describe("Reservation wizard - live availability (mocked API)", () => {
  test("blocks advancing past step 2 without date and time", async ({
    page,
  }) => {
    await mockAvailability(page);
    await page.goto("/#reservas");
    await page.locator("#reservas").scrollIntoViewIfNeeded();

    await page.getByRole("button", { name: "Siguiente" }).click();
    await expect(page.getByText("¿Qué día y a qué hora?")).toBeVisible();

    await page.getByRole("button", { name: "Siguiente" }).click();
    await expect(page.getByText("¿Qué día y a qué hora?")).toBeVisible();
  });

  test("a full time slot cannot be selected", async ({ page }) => {
    await mockAvailability(page);
    await page.goto("/#reservas");
    await page.locator("#reservas").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.locator("#rDate").fill("2026-09-01");

    const fullSlot = page.locator('[role="radio"][disabled]').first();
    await expect(fullSlot).toBeVisible();
    await expect(fullSlot).toHaveAttribute("aria-checked", "false");
  });

  test("the confirm button stays disabled until a receipt is uploaded", async ({
    page,
  }) => {
    await mockAvailability(page);
    await mockReservationOutcome(page, "confirmed");
    await mockReceiptUpload(page);

    await page.goto("/#reservas");
    await page.locator("#reservas").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Siguiente" }).click();

    await page.locator("#rDate").fill("2026-09-01");
    await page.locator('[role="radio"]:not([disabled])').first().click();
    await page.getByRole("button", { name: "Siguiente" }).click();

    await page.locator("#rName").fill("Ana Torres");
    await page.getByRole("button", { name: "Siguiente" }).click();

    const confirmButton = page.getByRole("button", {
      name: "Confirmar reserva",
    });
    await expect(confirmButton).toBeDisabled();

    await uploadFakeReceipt(page);
    await expect(confirmButton).toBeEnabled();
  });

  test("full happy path submits the deposit request and offers a calendar download", async ({
    page,
  }) => {
    await mockAvailability(page);
    await mockReservationOutcome(page, "confirmed");
    await mockReceiptUpload(page);

    await page.goto("/#reservas");
    await page.locator("#reservas").scrollIntoViewIfNeeded();

    await page.getByRole("radio", { name: "Cumpleaños" }).click();
    await page
      .getByRole("button", { name: "Aumentar número de personas" })
      .click();
    await page.getByRole("button", { name: "Siguiente" }).click();

    await page.locator("#rDate").fill("2026-09-01");
    await page.locator('[role="radio"]:not([disabled])').first().click();
    await page.getByRole("button", { name: "Siguiente" }).click();

    await page.locator("#rName").fill("Ana Torres");
    await page.locator("#rEmail").fill("ana@example.com");
    await page.getByRole("button", { name: "Siguiente" }).click();

    await expect(page.getByText("Ana Torres")).toBeVisible();
    await expect(page.getByText("3 personas", { exact: true })).toBeVisible();

    await uploadFakeReceipt(page);
    await page.getByRole("button", { name: "Confirmar reserva" }).click();

    await expect(page.getByText("¡Solicitud recibida!")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Agregar a mi calendario/ }),
    ).toBeVisible();
  });

  test("lets the customer cancel right after submitting, with a confirm step", async ({
    page,
  }) => {
    await mockAvailability(page);
    await mockReservationOutcome(page, "confirmed");
    await mockReceiptUpload(page);
    await page.route("**/api/reservations/*/cancel", (route) =>
      route.fulfill({
        status: 200,
        json: { status: "cancelled", date: "2026-09-01", time: "18:00" },
      }),
    );

    await page.goto("/#reservas");
    await page.locator("#reservas").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Siguiente" }).click();

    await page.locator("#rDate").fill("2026-09-01");
    await page.locator('[role="radio"]:not([disabled])').first().click();
    await page.getByRole("button", { name: "Siguiente" }).click();

    await page.locator("#rName").fill("Ana Torres");
    await page.getByRole("button", { name: "Siguiente" }).click();

    await uploadFakeReceipt(page);
    await page.getByRole("button", { name: "Confirmar reserva" }).click();
    await expect(page.getByText("¡Solicitud recibida!")).toBeVisible();

    await page.getByRole("button", { name: "Cancelar reserva" }).click();
    await expect(
      page.getByText("¿Seguro que quieres cancelarla?"),
    ).toBeVisible();

    await page.getByRole("button", { name: "Sí, cancelar" }).click();
    await expect(page.getByText("Reserva cancelada")).toBeVisible();
  });

  test("shows a clear message and lets the user pick another time when a slot fills up mid-booking", async ({
    page,
  }) => {
    await mockAvailability(page);
    await mockReservationOutcome(page, "full");
    await mockReceiptUpload(page);

    await page.goto("/#reservas");
    await page.locator("#reservas").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Siguiente" }).click();

    await page.locator("#rDate").fill("2026-09-01");
    await page.locator('[role="radio"]:not([disabled])').first().click();
    await page.getByRole("button", { name: "Siguiente" }).click();

    await page.locator("#rName").fill("Ana Torres");
    await page.getByRole("button", { name: "Siguiente" }).click();

    await uploadFakeReceipt(page);
    await page.getByRole("button", { name: "Confirmar reserva" }).click();
    await expect(
      page.getByText("Ese horario se acaba de llenar"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Elegir otra hora" }).click();
    await expect(page.getByText("¿Qué día y a qué hora?")).toBeVisible();
  });
});

test.describe("Reservation wizard - fallback (no live availability)", () => {
  test("degrades to a manual time input and WhatsApp/call/email contact", async ({
    page,
  }) => {
    await page.route("**/api/availability*", (route) =>
      route.fulfill({
        status: 503,
        json: { error: "availability_unavailable" },
      }),
    );

    await page.goto("/#reservas");
    await page.locator("#reservas").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Siguiente" }).click();

    await page.locator("#rDate").fill("2026-09-01");
    await expect(
      page.getByText("No pudimos cargar la disponibilidad"),
    ).toBeVisible();
    await expect(page.locator("#rTimeFallback")).toBeVisible();
    await page.locator("#rTimeFallback").fill("20:00");
    await page.getByRole("button", { name: "Siguiente" }).click();

    await page.locator("#rName").fill("Ana Torres");
    await page.getByRole("button", { name: "Siguiente" }).click();

    // No automatic "Confirmar reserva" button in fallback mode - only the
    // manual channel-based contact options. The default channel
    // (WhatsApp) isn't gated by the deposit/receipt requirement, which
    // only applies to the live-availability path and the email channel.
    await expect(
      page.getByRole("button", { name: "Confirmar reserva" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Reservar por WhatsApp/ }),
    ).toBeVisible();
  });
});
