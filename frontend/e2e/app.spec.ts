import { test, expect } from "@playwright/test";

test.describe("Document MCP Frontend", () => {
  test("should load the application", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading")).toBeVisible();
  });

  test("should display navigation menu", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Upload Document" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ask a Question" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Approved Documents" })).toBeVisible();
  });

  test("should switch between screens", async ({ page }) => {
    await page.goto("/");

    // Check upload screen is default - navigation link should be active
    await expect(page.getByRole("link", { name: "Upload Document" })).toHaveClass(/active/);

    // Switch to Ask screen
    await page.getByRole("link", { name: "Ask a Question" }).click();
    await expect(page.getByRole("link", { name: "Ask a Question" })).toHaveClass(/active/);

    // Switch to Documents screen
    await page.getByRole("link", { name: "Approved Documents" }).click();
    await expect(page.getByRole("link", { name: "Approved Documents" })).toHaveClass(/active/);
  });
});
