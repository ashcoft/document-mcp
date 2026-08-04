import { test, expect } from "@playwright/test";

test.describe("Document Control Frontend", () => {
  test("should load the application", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Engineering Document Control" })).toBeVisible();
  });

  test("should display navigation menu", async ({ page }) => {
    await page.goto("/");
    // Use navigation drawer specific locator
    const navDrawer = page.locator(".v-navigation-drawer");
    await expect(navDrawer.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(navDrawer.getByRole("link", { name: "Upload" })).toBeVisible();
    await expect(navDrawer.getByRole("link", { name: "Ask & Search" })).toBeVisible();
    await expect(navDrawer.getByRole("link", { name: "Documents" })).toBeVisible();
    await expect(navDrawer.getByRole("link", { name: "Review Queue" })).toBeVisible();
  });

  test("should switch between screens", async ({ page }) => {
    await page.goto("/");

    // Use navigation drawer specific locator
    const navDrawer = page.locator(".v-navigation-drawer");

    // Switch to Upload screen
    await navDrawer.getByRole("link", { name: "Upload" }).click();
    await expect(page).toHaveURL(/\/upload/);

    // Switch to Ask screen
    await navDrawer.getByRole("link", { name: "Ask & Search" }).click();
    await expect(page).toHaveURL(/\/ask/);

    // Switch to Documents screen
    await navDrawer.getByRole("link", { name: "Documents" }).click();
    await expect(page).toHaveURL(/\/documents/);

    // Switch to Review screen
    await navDrawer.getByRole("link", { name: "Review Queue" }).click();
    await expect(page).toHaveURL(/\/review/);

    // Back to Dashboard
    await navDrawer.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});