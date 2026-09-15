import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("renders the hero with brand and tagline", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "el lujo no tiene hora",
    );
    await expect(
      page.getByRole("link", { name: "Reservar mesa" }),
    ).toBeVisible();
  });

  test("nav Carta link goes to the standalone menu page", async ({ page }) => {
    await page.goto("/");
    await page.locator("nav").getByRole("link", { name: "Carta" }).click();
    await expect(page).toHaveURL(/\/carta$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("all main sections are present", async ({ page }) => {
    await page.goto("/");
    for (const id of [
      "nosotros",
      "eventos",
      "galeria",
      "ubicacion",
      "reservas",
    ]) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
  });

  test("has no console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("mobile nav opens and closes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(
      page.getByRole("button", { name: "Cerrar menú" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cerrar menú" }).click();
    await expect(page.locator("#mobile-nav")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  test("language toggle switches hero copy to English", async ({ page }) => {
    await page.goto("/");
    await page
      .locator("header")
      .getByRole("button", { name: "EN", exact: true })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "luxury has no hour",
    );
  });
});
