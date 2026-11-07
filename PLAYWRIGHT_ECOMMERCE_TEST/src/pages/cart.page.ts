import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    const cartResponse = this.page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/cart" &&
        response.request().method() === "GET",
    );
    await this.navigateTo("/cart");
    const response = await cartResponse;
    if (!response.ok()) {
      throw new Error(`Could not load cart; GET /api/cart returned HTTP ${response.status()}.`);
    }

    await this.emptyState
      .or(this.items.first())
      .waitFor({ state: "visible" });
  }

  get heading(): Locator {
    return this.page.getByTestId("cart-title");
  }

  get items(): Locator {
    return this.page.getByTestId("cart-item");
  }

  get emptyState(): Locator {
    return this.page.getByTestId("empty-cart");
  }

  get total(): Locator {
    return this.page.getByTestId("cart-total");
  }

  itemSubtotal(index = 0): Locator {
    return this.items.nth(index).getByTestId("cart-item-subtotal");
  }

  async increaseQuantity(index = 0): Promise<void> {
    const item = this.items.nth(index);
    const productLink = item.locator('a[href^="/products/"]');
    const productId = await productLink.getAttribute("href");
    const id = productId?.split("/").at(-1);
    if (!id) {
      throw new Error(`Could not determine product ID for cart item at index ${index}.`);
    }

    const [response] = await Promise.all([
      this.page.waitForResponse(
        (candidate) =>
          new URL(candidate.url()).pathname === `/api/cart/${id}` &&
          candidate.request().method() === "PATCH",
      ),
      this.click(
        item.getByTestId("quantity-increase"),
        [],
        `increase cart quantity for product ${id}`,
      ),
    ]);

    if (!response.ok()) {
      throw new Error(
        `Could not increase cart quantity for product ${id}; PATCH returned HTTP ${response.status()}.`,
      );
    }
  }

  async clear(): Promise<void> {
    if ((await this.items.count()) > 0) {
      await this.click(this.page.getByTestId("clear-cart-btn"), [], "clear cart");
      await this.waitForElement(this.emptyState, [], "empty cart state");
    }
  }

  async itemCount(): Promise<number> {
    return this.items.count();
  }

  async itemName(index = 0): Promise<string> {
    return this.getText(this.items.nth(index).getByTestId("cart-item-name"), [], "cart item name");
  }

  async itemQuantity(index = 0): Promise<string> {
    return this.getText(this.items.nth(index).getByTestId("item-quantity"), [], "cart item quantity");
  }
}
