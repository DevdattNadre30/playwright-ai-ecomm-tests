import { test, expect } from "../../src/fixtures/test-fixtures";

const expectedProducts = [
  { id: "p1", name: "Wireless Bluetooth Headphones" },
  { id: "p2", name: "Mechanical Keyboard" },
  { id: "p3", name: "Ergonomic Wireless Mouse" },
  { id: "p4", name: "4K USB-C Webcam" },
  { id: "p5", name: "LED Desk Lamp" },
  { id: "p6", name: "Gaming Controller" },
  { id: "p7", name: "Portable Power Bank 20000mAh" },
  { id: "p8", name: "USB-C Hub 7-in-1" },
];

test("UI-001 root URL resolves to the product catalog @smoke @sanity", async ({
  navigationPage,
  productPage,
  page,
}) => {
  await navigationPage.openRoot();

  await expect(page).toHaveTitle("ShopLab — E-Commerce Testing Playground");
  await expect(productPage.catalogHeading).toHaveText("All Products");
  await expect.poll(() => navigationPage.currentPath()).toBe("/products");
});

test("UI-002 header navigation opens each discovered top-level page @smoke @sanity", async ({
  navigationPage,
  page,
}) => {
  await navigationPage.openRoot();

  await navigationPage.openBrandHome();
  await expect.poll(() => navigationPage.currentPath()).toBe("/products");

  await navigationPage.openCart();
  await expect.poll(() => navigationPage.currentPath()).toBe("/cart");
  await expect(page.getByTestId("cart-title")).toHaveText("Shopping Cart");

  await navigationPage.openChat();
  await expect.poll(() => navigationPage.currentPath()).toBe("/chat");
  await expect(page.getByRole("heading", { name: "AI Shopping Assistant" })).toBeVisible();

  await navigationPage.openProducts();
  await expect.poll(() => navigationPage.currentPath()).toBe("/products");
  await expect(page.getByTestId("page-title")).toHaveText("All Products");
});

test("UI-003 catalog displays all eight product cards and their key details @smoke @regression", async ({
  productPage,
}) => {
  await productPage.openCatalog();

  await expect(productPage.catalogHeading).toHaveText("All Products");
  expect(await productPage.productCount()).toBe(expectedProducts.length);

  const products = await productPage.getCatalogProducts();
  expect(products.map(({ id, name }) => ({ id, name }))).toEqual(expectedProducts);

  for (const product of products) {
    expect(product.category, `${product.id} should have a category`).toBeTruthy();
    expect(product.description, `${product.id} should have a description`).toBeTruthy();
    expect(product.price, `${product.id} should have a price`).toMatch(/^\$\d+\.\d{2}$/);
    expect(product.rating, `${product.id} should have a rating`).toMatch(/4\.\d|5\.0/);
    expect(product.detailsHref).toBe(`/products/${product.id}`);
  }
});

test("UI-004 every catalog product opens a matching detail page @smoke @regression", async ({
  productPage,
}) => {
  await productPage.openCatalog();
  const catalogProducts = await productPage.getCatalogProducts();

  for (const product of catalogProducts) {
    await productPage.openProductFromCard(product.id);
    const details = await productPage.productDetails();

    expect(details.name).toBe(product.name);
    expect(details.category).toBe(product.category);
    expect(details.description).toBe(product.description);
    expect(details.price).toBe(product.price);
    expect(details.rating).toContain(product.rating.replace("⭐ ", ""));
    expect(details.stock).toMatch(/(?:In Stock|Out of Stock)/);
    await expect(productPage.addToCartButton).toBeVisible();

    await productPage.openCatalog();
  }
});

test("UI-005 Back to Products returns to the catalog @sanity @regression", async ({
  navigationPage,
  productPage,
}) => {
  await productPage.openCatalog();
  await productPage.openProductFromCard("p1");
  await expect.poll(() => navigationPage.currentPath()).toBe("/products/p1");

  await productPage.goBackToProducts();

  await expect.poll(() => navigationPage.currentPath()).toBe("/products");
  await expect(productPage.catalogHeading).toHaveText("All Products");
  expect(await productPage.productCount()).toBe(expectedProducts.length);
});

test("UI-006 partial product search filters the catalog immediately @smoke @sanity @regression", async ({
  productPage,
  searchPage,
}) => {
  await productPage.openCatalog();
  await searchPage.search("keyboard");

  await expect(searchPage.resultCount).toContainText("1 result");
  await expect(searchPage.resultCount).toContainText("keyboard");
  await expect(searchPage.productCards).toHaveCount(1);
  expect(await searchPage.resultNames()).toEqual(["Mechanical Keyboard"]);
  await expect(searchPage.productCards.getByTestId("view-details-btn")).toHaveAttribute(
    "href",
    "/products/p2",
  );
});

test("UI-007 product search is case-insensitive @sanity @regression", async ({
  productPage,
  searchPage,
}) => {
  await productPage.openCatalog();
  await searchPage.search("KEYBOARD");

  await expect(searchPage.resultCount).toContainText("1 result");
  await expect(searchPage.productCards).toHaveCount(1);
  expect(await searchPage.resultNames()).toEqual(["Mechanical Keyboard"]);
});

test("UI-008 no-results search is informative and recoverable @regression", async ({
  productPage,
  searchPage,
}) => {
  await productPage.openCatalog();
  await searchPage.search("no-product-xyz");

  await expect(searchPage.resultCount).toContainText("0 results");
  await expect(searchPage.noResultsMessage).toContainText("No products found");
  await expect(searchPage.productCards).toHaveCount(0);

  await searchPage.search("keyboard");

  await expect(searchPage.productCards).toHaveCount(1);
  expect(await searchPage.resultNames()).toEqual(["Mechanical Keyboard"]);
});

test("UI-009 search handles empty whitespace punctuation and long queries @regression", async ({
  productPage,
  searchPage,
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await productPage.openCatalog();

  await searchPage.search("   ");
  await expect(searchPage.productCards).toHaveCount(expectedProducts.length);

  await searchPage.search("!@#$");
  await expect(searchPage.resultCount).toContainText("0 results");
  await expect(searchPage.noResultsMessage).toBeVisible();

  await searchPage.search("x".repeat(300));
  await expect(searchPage.resultCount).toContainText("0 results");
  await expect(searchPage.noResultsMessage).toBeVisible();

  await searchPage.clearSearch();
  await expect(searchPage.productCards).toHaveCount(expectedProducts.length);
  expect(pageErrors).toEqual([]);
});

test("UI-010 adding a product from the catalog creates a cart line @smoke @regression", async ({
  productPage,
  cartPage,
}) => {
  await cartPage.open();
  await cartPage.clear();

  await productPage.openCatalog();
  const response = await productPage.addCatalogProductToCart("p1");
  expect(response.status()).toBe(201);

  await cartPage.open();
  try {
    await expect(cartPage.items).toHaveCount(1);
    await expect.poll(() => cartPage.itemName()).toBe("Wireless Bluetooth Headphones");
    await expect.poll(() => cartPage.itemQuantity()).toBe("1");
    await expect(cartPage.total).toHaveText("$79.99");
  } finally {
    await cartPage.clear();
  }
});
