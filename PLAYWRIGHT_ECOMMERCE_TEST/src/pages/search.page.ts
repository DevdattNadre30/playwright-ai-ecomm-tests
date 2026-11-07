import type { Locator, Page } from "@playwright/test";
import { searchInputLocators } from "../locators/search.locators";
import { BasePage } from "./base.page";

export class SearchPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get searchInput(): Locator {
    return searchInputLocators(this.page).primary;
  }

  get resultCount(): Locator {
    return this.page.getByTestId("search-result-count");
  }

  get noResultsMessage(): Locator {
    return this.page.getByTestId("no-search-results");
  }

  get productCards(): Locator {
    return this.page.getByTestId("product-card");
  }

  async search(term: string): Promise<void> {
    const { primary, fallbacks } = searchInputLocators(this.page);
    await this.fill(primary, term, fallbacks, "search field");
  }

  async clearSearch(): Promise<void> {
    await this.fill(this.searchInput, "", [], "clear search field");
  }

  async resultNames(): Promise<string[]> {
    return this.productCards.getByTestId("product-name").allTextContents();
  }
}
