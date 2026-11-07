import type { Locator, Page } from "@playwright/test";
import type { HealingCandidate } from "../agents/healer-agent";

export function addToCartLocators(page: Page): { primary: Locator; fallbacks: HealingCandidate[] } {
  return {
    primary: page.getByRole("button", { name: /add to cart/i }),
    fallbacks: [
      { locator: page.getByTestId("add-to-cart"), strategy: "testId", description: "add-to-cart test id" },
      { locator: page.locator('button:has-text("Add to cart")'), strategy: "css", description: "button text selector" },
    ],
  };
}
