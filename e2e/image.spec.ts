import path from "node:path";
import { expect, test } from "@playwright/test";

test("should allow a user to add an image to the board", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Create New Board" }).click();

  // Click the "Add image" button in the toolbar
  await page.getByLabel("Add image").getByRole("button").click();

  // Click on the canvas to place the image placeholder
  await page.getByTestId("board-canvas").click({
    position: { x: 300, y: 300 },
  });

  // Locate the file input within the image controls and set the file
  const imageFilePath = path.resolve("e2e/fixtures/test-image.png");
  await page.locator("input[type='file']").setInputFiles(imageFilePath);

  // Expect the image to be visible on the board
  const imageLocator = page.locator('div[class*="imageContainer"] img');
  await expect(imageLocator).toBeVisible();
  await expect(imageLocator).toHaveAttribute("src", /^blob:/);
});
