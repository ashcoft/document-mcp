import { test, expect } from "@playwright/test";

test.describe("Document Control Frontend", () => {
  test("should load the application", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Engineering Document Control" })).toBeVisible();
  });

  test("should display navigation menu", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Upload" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ask & Search" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Documents" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Review Queue" })).toBeVisible();
  });

  test("should switch between screens", async ({ page }) => {
    await page.goto("/");

    // Switch to Upload screen
    await page.getByRole("link", { name: "Upload" }).click();
    await expect(page).toHaveURL(/\/upload/);

    // Switch to Ask screen
    await page.getByRole("link", { name: "Ask & Search" }).click();
    await expect(page).toHaveURL(/\/ask/);

    // Switch to Documents screen
    await page.getByRole("link", { name: "Documents" }).click();
    await expect(page).toHaveURL(/\/documents/);

    // Switch to Review screen
    await page.getByRole("link", { name: "Review Queue" }).click();
    await expect(page).toHaveURL(/\/review/);

    // Back to Dashboard
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});