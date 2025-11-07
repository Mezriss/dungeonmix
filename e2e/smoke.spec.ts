import { expect, test } from "@playwright/test";

test("should create a new board and display core UI elements", async ({
  page,
}) => {
  await page.goto("/");

  // Click the "Create New Board" button
  await page.getByRole("button", { name: "Create New Board" }).click();

  // Expect the URL to change to a board-specific URL
  await expect(page).toHaveURL(/\/boards\/[a-zA-Z0-9_-]+/);

  // Expect core UI elements to be visible
  await expect(page.getByTestId("header")).toBeVisible();
  await expect(page.getByTestId("toolbar")).toBeVisible();
  await expect(page.getByTestId("board-canvas")).toBeVisible();
});
