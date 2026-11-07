import { test, expect } from "../../src/fixtures/test-fixtures";

interface CartProduct {
  id: string;
  name: string;
  price: number;
}

interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartResponse {
  items: CartItem[];
  total: number;
}

test("cart API changes are reflected in the UI and subsequent API reads @regression", async ({
  browserApiClient,
  cartPage,
}) => {
  const clearResponse = await browserApiClient.delete("/api/cart");
  expect(clearResponse.status()).toBe(200);

  try {
    const addResponse = await browserApiClient.post("/api/cart", {
      productId: "p2",
      quantity: 2,
    });
    expect(addResponse.status()).toBe(201);

    const addedItem = (await addResponse.json()) as CartItem;
    expect(addedItem).toMatchObject({
      product: {
        id: "p2",
        name: "Mechanical Keyboard",
        price: 129.99,
      },
      quantity: 2,
    });

    await cartPage.open();

    await expect(cartPage.items).toHaveCount(1);
    await expect.poll(() => cartPage.itemName()).toBe("Mechanical Keyboard");
    await expect.poll(() => cartPage.itemQuantity()).toBe("2");
    await expect(cartPage.itemSubtotal()).toHaveText("$259.98");
    await expect(cartPage.total).toHaveText("$259.98");

    await cartPage.increaseQuantity();

    await expect.poll(() => cartPage.itemQuantity()).toBe("3");
    await expect(cartPage.itemSubtotal()).toHaveText("$389.97");
    await expect(cartPage.total).toHaveText("$389.97");

    const cartResponse = await browserApiClient.get("/api/cart");
    expect(cartResponse.status()).toBe(200);

    const cart = (await cartResponse.json()) as CartResponse;
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({
      product: {
        id: "p2",
        name: "Mechanical Keyboard",
        price: 129.99,
      },
      quantity: 3,
    });
    expect(cart.total).toBe(389.97);
  } finally {
    const cleanupResponse = await browserApiClient.delete("/api/cart");
    expect(cleanupResponse.status(), "Cart cleanup should succeed").toBe(200);

    const verificationResponse = await browserApiClient.get("/api/cart");
    expect(verificationResponse.status(), "Cart should be readable after cleanup").toBe(200);
    const cleanedCart = (await verificationResponse.json()) as CartResponse;
    expect(cleanedCart).toEqual({ items: [], total: 0 });
  }
});
