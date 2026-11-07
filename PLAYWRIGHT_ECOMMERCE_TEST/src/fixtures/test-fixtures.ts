import { request, test as base, expect, type APIRequestContext } from "@playwright/test";
import { getActiveEnvironment } from "../config/environment";
import { ApiClient } from "../api/api-client";
import { CartPage } from "../pages/cart.page";
import { NavigationPage } from "../pages/navigation.page";
import { ProductPage } from "../pages/product.page";
import { SearchPage } from "../pages/search.page";
import { WishlistPage } from "../pages/wishlist.page";

interface FrameworkFixtures {
  apiContext: APIRequestContext;
  apiClient: ApiClient;
  browserApiClient: ApiClient;
  navigationPage: NavigationPage;
  productPage: ProductPage;
  searchPage: SearchPage;
  cartPage: CartPage;
  wishlistPage: WishlistPage;
}

export const test = base.extend<FrameworkFixtures>({
  apiContext: async ({}, use) => {
    const context = await request.newContext({
      baseURL: getActiveEnvironment().baseUrl,
      extraHTTPHeaders: { Accept: "application/json" },
    });
    try {
      await use(context);
    } finally {
      await context.dispose();
    }
  },
  apiClient: async ({ apiContext }, use) => use(new ApiClient(apiContext)),
  browserApiClient: async ({ page }, use) => use(new ApiClient(page.request)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  navigationPage: async ({ page }, use) => use(new NavigationPage(page)),
  searchPage: async ({ page }, use) => use(new SearchPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  wishlistPage: async ({ page }, use) => use(new WishlistPage(page)),
});

export { expect };
