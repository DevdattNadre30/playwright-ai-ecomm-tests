import type { Locator, Page } from "@playwright/test";
import type { HealingCandidate } from "../agents/healer-agent";

export function searchInputLocators(
  page: Page,
): { primary: Locator; fallbacks: HealingCandidate[] } {
  return {
    primary: page.getByRole("searchbox"),
    fallbacks: [
      { locator: page.getByPlaceholder(/search/i), strategy: "placeholder", description: "search placeholder" },
      { locator: page.getByTestId("search-input"), strategy: "testId", description: "search input test id" },
      { locator: page.locator('input[type="search"]'), strategy: "css", description: "search input type" },
    ],
  };
}
