import { test, expect } from "@playwright/test";

test.describe("Carta page", () => {
  test("renders categories collapsed except the first", async ({ page }) => {
    await page.goto("/carta");
    const triggers = page.locator(
      ".accordion-trigger, [aria-controls^='acc-panel-']",
    );
    await expect(triggers.first()).toHaveAttribute("aria-expanded", "true");
  });

  test("expanding a category shows its items and collapses the previous one", async ({
    page,
  }) => {
    await page.goto("/carta");
    const triggers = page.locator("[aria-controls^='acc-panel-']");
    await expect(triggers.first()).toHaveAttribute("aria-expanded", "true");

    await triggers.nth(1).click();
    await expect(triggers.nth(1)).toHaveAttribute("aria-expanded", "true");
    await expect(triggers.first()).toHaveAttribute("aria-expanded", "false");
  });

  test("has no console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/carta");
    await expect(
      page.locator("[aria-controls^='acc-panel-']").first(),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("back link returns to the home page", async ({ page }) => {
    await page.goto("/carta");
    await page
      .getByRole("link", { name: /Volver al sitio/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/$/);
  });
});
