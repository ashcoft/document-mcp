import { test, expect } from "@playwright/test";

test.describe("Document Control Frontend", () => {
  test("should load the application", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Engineering Document Control" })).toBeVisible();
  });

  test("should display navigation menu", async ({ page }) => {
    await page.goto("/");
    // Use navigation drawer specific locator and target v-list-item with router-link
    const navDrawer = page.locator(".v-navigation-drawer");
    await expect(navDrawer.locator(".v-list-item[href='/']")).toBeVisible();
    await expect(navDrawer.locator(".v-list-item[href='/upload']")).toBeVisible();
    await expect(navDrawer.locator(".v-list-item[href='/ask']")).toBeVisible();
    await expect(navDrawer.locator(".v-list-item[href='/documents']")).toBeVisible();
    await expect(navDrawer.locator(".v-list-item[href='/review']")).toBeVisible();
  });

  test("should switch between screens", async ({ page }) => {
    await page.goto("/");

    // Use navigation drawer specific locator
    const navDrawer = page.locator(".v-navigation-drawer");

    // Switch to Upload screen
    await navDrawer.locator(".v-list-item[href='/upload']").click();
    await expect(page).toHaveURL(/\/upload/);

    // Switch to Ask screen
    await navDrawer.locator(".v-list-item[href='/ask']").click();
    await expect(page).toHaveURL(/\/ask/);

    // Switch to Documents screen
    await navDrawer.locator(".v-list-item[href='/documents']").click();
    await expect(page).toHaveURL(/\/documents/);

    // Switch to Review screen
    await navDrawer.locator(".v-list-item[href='/review']").click();
    await expect(page).toHaveURL(/\/review/);

    // Back to Dashboard
    await navDrawer.locator(".v-list-item[href='/']").click();
    await expect(page).toHaveURL(/\/$/);
  });
});