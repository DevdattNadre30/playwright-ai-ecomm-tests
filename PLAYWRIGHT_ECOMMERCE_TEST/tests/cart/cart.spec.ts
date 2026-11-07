import { test, expect } from "../../src/fixtures/test-fixtures";

test("cart route can be opened @sanity", async ({ page, cartPage }) => {
  await cartPage.open();
  await expect(page.locator("body")).toBeVisible();
});
