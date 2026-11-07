import { test, expect } from "../../src/fixtures/test-fixtures";

test("wishlist route can be opened @regression", async ({ page, wishlistPage }) => {
  await wishlistPage.open();
  await expect(page.locator("body")).toBeVisible();
});
