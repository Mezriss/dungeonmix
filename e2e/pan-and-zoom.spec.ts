import { expect, test } from "@playwright/test";

import type { Locator, Page } from "@playwright/test";

const MIN_AREA_SIZE = 100;

async function pan(page: Page, board: Locator, x: number, y: number) {
  const initialBoundingBox = await board.boundingBox();
  if (!initialBoundingBox) throw new Error("Failed to get board bounding box");

  const startX = initialBoundingBox.x + initialBoundingBox.width / 2;
  const startY = initialBoundingBox.y + initialBoundingBox.height / 2;
  const targetX = startX + x;
  const targetY = startY + y;

  await page.mouse.move(startX, startY);
  await page.mouse.down({ button: "middle" });
  await page.mouse.move(targetX, targetY, { steps: 10 });
  await page.mouse.up({ button: "middle" });
}

test.describe("Pan and zoom", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Create New Board" }).click();

    await page.getByLabel("Add rectangular sound area").click();
  });

  test("should pan", async ({ page }) => {
    const board = page.getByTestId("board-canvas");
    const box = await board.boundingBox();
    if (!box) throw new Error("Failed to get board bounding box");
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await board.click({
      position: { x: centerX, y: centerY },
    });
    const area = page.locator('div[class*="area"]');
    await expect(area).toBeVisible();

    const initialBoundingBox = await area.boundingBox();
    if (!initialBoundingBox) throw new Error("Failed to get area bounding box");

    await pan(page, board, 200, 0);

    const indicator = page.locator(
      '[class*="indicator"]:first-child [class*="value"]',
    );
    expect(indicator).toHaveText("-200");

    const zoomIndicator = page.locator('[class*="zoom"] input');
    expect(zoomIndicator).toHaveValue("100%");

    const panned = await area.boundingBox();
    if (!panned)
      throw new Error("Failed to get area bounding box after panning");
    expect(panned.x).toEqual(initialBoundingBox.x + 200);
    expect(panned.y).toEqual(initialBoundingBox.y);
  });

  test("should correctly place areas after pan", async ({ page }) => {
    const board = page.getByTestId("board-canvas");
    const box = await board.boundingBox();
    if (!box) throw new Error("Failed to get board bounding box");
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await pan(page, board, 200, 0);

    await board.click({
      position: { x: centerX, y: centerY },
    });
    const area = page.locator('div[class*="area"]');
    await expect(area).toBeVisible();

    const areaBox = await area.boundingBox();
    expect(areaBox).toBeDefined();
    expect(areaBox?.x).toEqual(centerX);
  });

  test("should zoom", async ({ page }) => {
    const board = page.getByTestId("board-canvas");
    const box = await board.boundingBox();
    if (!box) throw new Error("Failed to get board bounding box");
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await board.click({
      position: { x: centerX, y: centerY },
    });

    const area = page.locator('div[class*="area"]');
    await page.mouse.move(centerX, centerY);

    await page.mouse.wheel(0, 100);
    const areaBoxZoomIn = await area.boundingBox();
    if (!areaBoxZoomIn) {
      throw new Error("Failed to get area bounding box after zooming");
    }
    expect(Math.round(areaBoxZoomIn.width)).toEqual(
      Math.round(MIN_AREA_SIZE * 1.1),
    );

    await page.mouse.wheel(0, -100);
    await page.mouse.wheel(0, -100);
    const areaBoxZoomOut = await area.boundingBox();
    if (!areaBoxZoomOut) {
      throw new Error("Failed to get area bounding box after zooming");
    }
    expect(Math.round(areaBoxZoomOut.width)).toEqual(
      Math.round(MIN_AREA_SIZE * 0.9),
    );
  });

  test("shold correctly place areas after zoom", async ({ page }) => {
    const board = page.getByTestId("board-canvas");
    const box = await board.boundingBox();
    if (!box) throw new Error("Failed to get board bounding box");
    const offcenterX = box.x + box.width * 0.4;
    const offcenterY = box.y + box.height * 0.4;

    await page.mouse.move(offcenterX, offcenterY);
    await page.mouse.wheel(0, 100);

    await board.click({
      position: { x: offcenterX, y: offcenterY },
    });

    const area = page.locator('div[class*="area"]');
    const areaBox = await area.boundingBox();
    if (!areaBox) {
      throw new Error("Failed to get area bounding box");
    }
    expect(Math.round(areaBox.x)).toEqual(Math.round(offcenterX));
  });
});
