import { test, expect } from "@playwright/test";

test.describe("Document MCP Frontend", () => {
  test("should load the application", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Document/);
  });

  test("should display navigation menu", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Upload Document")).toBeVisible();
    await expect(page.getByText("Ask a Question")).toBeVisible();
    await expect(page.getByText("Approved Documents")).toBeVisible();
  });

  test("should switch between screens", async ({ page }) => {
    await page.goto("/");

    // Check upload screen is default
    await expect(page.getByText("Upload Document")).toHaveClass(/active/);

    // Switch to Ask screen
    await page.getByText("Ask a Question").click();
    await expect(page.getByText("Ask a Question")).toHaveClass(/active/);

    // Switch to Documents screen
    await page.getByText("Approved Documents").click();
    await expect(page.getByText("Approved Documents")).toHaveClass(/active/);
  });
});
