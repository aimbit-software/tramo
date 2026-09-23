import { expect, test } from "@playwright/test";

test("renders the design preview with the default theme", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-palette", "salvia");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("switches and remembers the theme", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("radio", { name: "Índigo" }).click();
  await page.getByRole("radio", { name: "Claro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-palette", "indigo");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  // The server renders the stored choice on a fresh load.
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-palette", "indigo");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("moves through palettes with the keyboard", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("radio", { name: "Salvia" }).focus();
  await page.keyboard.press("ArrowRight");

  await expect(page.getByRole("radio", { name: "Índigo" })).toBeFocused();
  await expect(page.getByRole("radio", { name: "Índigo" })).toHaveAttribute("aria-checked", "true");
});
