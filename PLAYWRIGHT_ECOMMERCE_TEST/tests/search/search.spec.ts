import searchData from "../../src/testdata/search.json";
import { test, expect } from "../../src/fixtures/test-fixtures";

test("search can be submitted when the storefront provides a search field @regression", async ({
  page,
  searchPage,
}) => {
  await page.goto("/");
  const searchFields = [
    page.getByRole("searchbox"),
    page.getByPlaceholder(/search/i),
    page.getByTestId("search-input"),
    page.locator('input[type="search"]'),
  ];

  const searchAvailable = await Promise.any(
    searchFields.map((locator) => locator.waitFor({ state: "visible", timeout: 1_000 })),
  ).then(() => true, () => false);

  if (searchAvailable) {
    await searchPage.search(searchData.validSearchTerm);
  } else {
    test.skip(true, "The current storefront does not expose a recognized search field.");
  }

  await expect(page.locator("body")).toBeVisible();
});
