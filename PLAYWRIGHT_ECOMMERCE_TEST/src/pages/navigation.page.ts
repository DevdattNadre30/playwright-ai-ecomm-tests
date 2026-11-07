import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class NavigationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get brandLink(): Locator {
    return this.page.getByTestId("brand-logo");
  }

  get productsLink(): Locator {
    return this.page.getByTestId("nav-link-products");
  }

  get cartLink(): Locator {
    return this.page.getByTestId("nav-link-cart");
  }

  get chatLink(): Locator {
    return this.page.getByTestId("nav-link-ai-chat");
  }

  async openRoot(): Promise<void> {
    await this.navigateTo("/");
  }

  async openProducts(): Promise<void> {
    await this.click(this.productsLink, [], "navigate to products");
  }

  async openCart(): Promise<void> {
    await this.click(this.cartLink, [], "navigate to cart");
  }

  async openChat(): Promise<void> {
    await this.click(this.chatLink, [], "navigate to AI chat");
  }

  async openBrandHome(): Promise<void> {
    await this.click(this.brandLink, [], "navigate with the ShopLab brand link");
  }

  async currentPath(): Promise<string> {
    return new URL(this.page.url()).pathname;
  }
}
