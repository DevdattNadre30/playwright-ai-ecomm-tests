import type { Locator, Page } from "@playwright/test";
import { addToCartLocators } from "../locators/product.locators";
import { BasePage } from "./base.page";

export interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  rating: string;
  detailsHref: string | null;
}

export class ProductPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get catalogHeading(): Locator {
    return this.page.getByTestId("page-title");
  }

  get productCards(): Locator {
    return this.page.getByTestId("product-card");
  }

  async openCatalog(): Promise<void> {
    await this.navigateTo("/products");
    await this.waitForElement(this.catalogHeading, [], "product catalog heading");
  }

  async openProduct(productId: string): Promise<void> {
    await this.navigateTo(`/products/${encodeURIComponent(productId)}`);
  }

  productCard(productId: string): Locator {
    return this.page.locator(`[data-testid="product-card"][data-product-id="${productId}"]`);
  }

  async productCount(): Promise<number> {
    return this.productCards.count();
  }

  async getCatalogProducts(): Promise<CatalogProduct[]> {
    const products: CatalogProduct[] = [];

    for (const card of await this.productCards.all()) {
      const id = await card.getAttribute("data-product-id");
      if (!id) {
        throw new Error("A product card is missing its data-product-id attribute.");
      }

      products.push({
        id,
        name: await this.getText(card.getByTestId("product-name"), [], "catalog product name"),
        category: await this.getText(card.getByTestId("product-category"), [], "catalog category"),
        description: await this.getText(card.getByTestId("product-description"), [], "catalog description"),
        price: await this.getText(card.getByTestId("product-price"), [], "catalog price"),
        rating: await this.getText(card.getByTestId("product-rating"), [], "catalog rating"),
        detailsHref: await card.getByTestId("view-details-btn").getAttribute("href"),
      });
    }

    return products;
  }

  async openProductFromCard(productId: string): Promise<void> {
    const card = this.productCard(productId);
    await this.click(card.getByTestId("view-details-btn"), [], `open product ${productId} details`);
  }

  async goBackToProducts(): Promise<void> {
    await this.click(this.page.getByTestId("back-to-products"), [], "return to products");
  }

  async productDetails(): Promise<{
    name: string;
    description: string;
    category: string;
    price: string;
    rating: string;
    stock: string;
  }> {
    return {
      name: await this.getText(this.page.getByTestId("product-detail-name"), [], "product detail name"),
      description: await this.getText(
        this.page.getByTestId("product-detail-description"),
        [],
        "product description",
      ),
      category: await this.getText(
        this.page.getByTestId("product-detail-category"),
        [],
        "product category",
      ),
      price: await this.getText(this.page.getByTestId("product-detail-price"), [], "product price"),
      rating: await this.getText(
        this.page.getByTestId("product-detail-rating"),
        [],
        "product rating",
      ),
      stock: await this.getText(this.page.getByTestId("product-detail-stock"), [], "product stock"),
    };
  }

  get addToCartButton(): Locator {
    return this.page.getByTestId("add-to-cart-btn");
  }

  async addToCart(): Promise<void> {
    const { primary, fallbacks } = addToCartLocators(this.page);
    await this.click(primary, fallbacks, "add product to cart");
  }

  async addCatalogProductToCart(productId: string) {
    const button = this.productCard(productId).getByTestId("add-to-cart-btn");
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (candidate) =>
          new URL(candidate.url()).pathname === "/api/cart" &&
          candidate.request().method() === "POST",
      ),
      this.click(button, [], `add product ${productId} to cart`),
    ]);

    return response;
  }
}
