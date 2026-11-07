import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class WishlistPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.navigateTo("/wishlist");
  }
}
