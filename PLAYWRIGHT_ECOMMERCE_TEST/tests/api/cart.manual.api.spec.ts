import { test, expect } from "../../src/fixtures/test-fixtures";
import type { APIResponse } from "@playwright/test";

const CART_ENDPOINT = "/api/cart";
const CHAT_ENDPOINT = "/api/chat";
const API_ERROR_CODES = [400, 404, 422];

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

async function responseJson<T>(response: APIResponse): Promise<T> {
  expect(response.headers()["content-type"]).toContain("application/json");
  return response.json() as Promise<T>;
}

async function clearCart(apiClient: {
  delete(path: string): Promise<APIResponse>;
}): Promise<void> {
  const response = await apiClient.delete(CART_ENDPOINT);
  expect(response.status(), "Cart cleanup should succeed").toBe(200);
}

test.describe("Manual API test cases", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ apiClient }) => {
    await clearCart(apiClient);
  });

  test.afterEach(async ({ apiClient }) => {
    await clearCart(apiClient);
  });

  test("API-001 get an empty cart @smoke @sanity", async ({ apiClient }) => {
    const response = await apiClient.get(CART_ENDPOINT);
    expect(response.status()).toBe(200);

    const cart = await responseJson<CartResponse>(response);
    expect(cart).toEqual({ items: [], total: 0 });
  });

  test("API-002 add a valid product to cart @smoke @regression", async ({ apiClient }) => {
    const response = await apiClient.post(CART_ENDPOINT, { productId: "p1", quantity: 1 });
    expect(response.status()).toBe(201);

    const addedItem = await responseJson<CartItem>(response);
    expect(addedItem.product).toMatchObject({
      id: "p1",
      name: "Wireless Bluetooth Headphones",
      price: 79.99,
    });
    expect(addedItem.quantity).toBe(1);

    const cartResponse = await apiClient.get(CART_ENDPOINT);
    expect(cartResponse.status()).toBe(200);
    const cart = await responseJson<CartResponse>(cartResponse);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({
      product: { id: "p1", name: "Wireless Bluetooth Headphones" },
      quantity: 1,
    });
    expect(cart.total).toBe(79.99);
  });

  test("API-003 update cart item quantity @regression", async ({ apiClient }) => {
    const addResponse = await apiClient.post(CART_ENDPOINT, { productId: "p1", quantity: 1 });
    expect(addResponse.status()).toBe(201);

    const updateResponse = await apiClient.patch(`${CART_ENDPOINT}/p1`, { quantity: 2 });
    expect(updateResponse.status()).toBe(200);
    const updatedItem = await responseJson<CartItem>(updateResponse);
    expect(updatedItem.product.id).toBe("p1");
    expect(updatedItem.quantity).toBe(2);

    const cartResponse = await apiClient.get(CART_ENDPOINT);
    const cart = await responseJson<CartResponse>(cartResponse);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.total).toBe(159.98);
  });

  test("API-004 quantity zero removes the cart item @regression", async ({ apiClient }) => {
    const addResponse = await apiClient.post(CART_ENDPOINT, { productId: "p1", quantity: 1 });
    expect(addResponse.status()).toBe(201);

    const removeResponse = await apiClient.patch(`${CART_ENDPOINT}/p1`, { quantity: 0 });
    expect(removeResponse.status()).toBe(200);
    expect(await responseJson<{ message: string }>(removeResponse)).toEqual({
      message: "Item removed",
    });

    const cartResponse = await apiClient.get(CART_ENDPOINT);
    const cart = await responseJson<CartResponse>(cartResponse);
    expect(cart).toEqual({ items: [], total: 0 });
  });

  test("API-005 delete one item and preserve other cart items @regression", async ({ apiClient }) => {
    for (const productId of ["p1", "p2"]) {
      const addResponse = await apiClient.post(CART_ENDPOINT, { productId, quantity: 1 });
      expect(addResponse.status()).toBe(201);
    }

    const deleteResponse = await apiClient.delete(`${CART_ENDPOINT}/p1`);
    expect(deleteResponse.status()).toBe(200);

    const cartResponse = await apiClient.get(CART_ENDPOINT);
    const cart = await responseJson<CartResponse>(cartResponse);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({
      product: { id: "p2", name: "Mechanical Keyboard" },
      quantity: 1,
    });
    expect(cart.total).toBe(129.99);
  });

  test("API-006 clear the entire cart and safely clear it again @regression", async ({ apiClient }) => {
    for (const productId of ["p1", "p2"]) {
      const addResponse = await apiClient.post(CART_ENDPOINT, { productId, quantity: 1 });
      expect(addResponse.status()).toBe(201);
    }

    const firstClear = await apiClient.delete(CART_ENDPOINT);
    expect(firstClear.status()).toBe(200);
    expect(await responseJson<{ message: string }>(firstClear)).toEqual({ message: "Cart cleared" });

    const secondClear = await apiClient.delete(CART_ENDPOINT);
    expect(secondClear.status()).toBe(200);

    const cartResponse = await apiClient.get(CART_ENDPOINT);
    expect(await responseJson<CartResponse>(cartResponse)).toEqual({ items: [], total: 0 });
  });

  test("API-007 valid chat request returns a response when the assistant is available @regression", async ({
    apiClient,
  }) => {
    const response = await apiClient.post(CHAT_ENDPOINT, {
      message: "Which keyboard do you sell?",
      history: [],
    });

    if (response.status() === 503) {
      const error = await responseJson<{ error: string }>(response);
      expect(error.error).toContain("Failed to connect to Ollama");
      test.skip(true, "The live chat API is unavailable because its Ollama dependency returned 503.");
    }

    expect(response.status()).toBe(200);
    const result = await responseJson<Record<string, unknown>>(response);
    const assistantText = Object.values(result).find(
      (value): value is string => typeof value === "string" && value.trim().length > 0,
    );
    expect(assistantText, "The successful chat response should include assistant text").toBeTruthy();
  });

  test("API-008 reject unknown product IDs without changing the cart @regression", async ({
    apiClient,
  }) => {
    for (const productId of ["not-a-product", "", null]) {
      const response = await apiClient.post(CART_ENDPOINT, { productId, quantity: 1 });
      expect(response.status()).toBe(404);
      expect(await responseJson<{ error: string }>(response)).toMatchObject({
        error: "Product not found",
      });
    }

    const malformedJson = await apiClient.postRaw(CART_ENDPOINT, "{");
    expect(API_ERROR_CODES).toContain(malformedJson.status());

    const cartResponse = await apiClient.get(CART_ENDPOINT);
    expect(await responseJson<CartResponse>(cartResponse)).toEqual({ items: [], total: 0 });
  });

  test("API-009 rejects invalid quantities when adding a cart item @regression", async ({
    apiClient,
  }) => {
    test.fail(
      true,
      "Known API defect: POST /api/cart accepts missing, zero, negative, fractional, string, and over-stock quantities.",
    );

    const invalidPayloads: Array<Record<string, unknown>> = [
      { productId: "p1", quantity: 0 },
      { productId: "p1", quantity: -1 },
      { productId: "p1", quantity: 1.5 },
      { productId: "p1", quantity: "one" },
      { productId: "p1" },
      { productId: "p1", quantity: null },
      { productId: "p1", quantity: 1000 },
    ];
    const observedStatuses: number[] = [];
    const cartMutationByPayload: Array<{ payload: Record<string, unknown>; itemCount: number }> = [];

    for (const payload of invalidPayloads) {
      await clearCart(apiClient);
      const response = await apiClient.post(CART_ENDPOINT, payload);
      observedStatuses.push(response.status());

      if (API_ERROR_CODES.includes(response.status())) {
        await responseJson<{ error?: string; message?: string }>(response);
      }

      const cartResponse = await apiClient.get(CART_ENDPOINT);
      const cart = await responseJson<CartResponse>(cartResponse);
      cartMutationByPayload.push({ payload, itemCount: cart.items.length });
    }

    expect(
      observedStatuses.every((status) => status === 400 || status === 422),
      `Invalid quantity responses were: ${observedStatuses.join(", ")}`,
    ).toBe(true);
    expect(
      cartMutationByPayload.filter(({ itemCount }) => itemCount > 0),
      "Invalid quantity payloads should not mutate the cart",
    ).toEqual([]);
  });

  test("API-010 rejects unknown cart updates and invalid quantities @regression", async ({
    apiClient,
  }) => {
    const unknownItem = await apiClient.patch(`${CART_ENDPOINT}/not-a-product`, { quantity: 1 });
    expect(unknownItem.status()).toBe(404);

    test.fail(
      true,
      "Known API defect: PATCH /api/cart/p1 accepts invalid quantities and may remove the item for negative values.",
    );

    const invalidQuantities: unknown[] = [-1, 1.5, "one", undefined, null, 1000];
    const observedStatuses: number[] = [];
    const observedCartStates: Array<{ quantity: unknown; itemCount: number; actualQuantity?: number }> = [];

    for (const quantity of invalidQuantities) {
      await clearCart(apiClient);
      const addResponse = await apiClient.post(CART_ENDPOINT, { productId: "p1", quantity: 1 });
      expect(addResponse.status()).toBe(201);

      const payload = quantity === undefined ? {} : { quantity };
      const response = await apiClient.patch(`${CART_ENDPOINT}/p1`, payload);
      observedStatuses.push(response.status());

      const cartResponse = await apiClient.get(CART_ENDPOINT);
      const cart = await responseJson<CartResponse>(cartResponse);
      observedCartStates.push({
        quantity,
        itemCount: cart.items.length,
        actualQuantity: cart.items[0]?.quantity,
      });
    }

    expect(
      observedStatuses.every((status) => status === 400 || status === 422),
      `Invalid PATCH quantity responses were: ${observedStatuses.join(", ")}`,
    ).toBe(true);
    expect(
      observedCartStates.filter(({ itemCount, actualQuantity }) => itemCount !== 1 || actualQuantity !== 1),
      "Invalid PATCH quantities should preserve the original cart line",
    ).toEqual([]);
  });

  test("API-011 cart endpoints support an anonymous request context @regression", async ({
    apiClient,
  }) => {
    const getResponse = await apiClient.get(CART_ENDPOINT);
    expect(getResponse.status()).toBe(200);
    await responseJson<CartResponse>(getResponse);

    const addResponse = await apiClient.post(CART_ENDPOINT, { productId: "p1", quantity: 1 });
    expect(addResponse.status()).toBe(201);

    const cartResponse = await apiClient.get(CART_ENDPOINT);
    const cart = await responseJson<CartResponse>(cartResponse);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].product.id).toBe("p1");
  });

  test("API-012 reports the chat dependency failure clearly when Ollama is unavailable @regression", async ({
    apiClient,
  }) => {
    const response = await apiClient.post(CHAT_ENDPOINT, {
      message: "Which keyboard do you sell?",
      history: [],
    });

    if (response.status() === 200) {
      await responseJson<Record<string, unknown>>(response);
      test.skip(true, "The chat dependency is healthy; an upstream-unavailable condition was not induced.");
    }

    expect(response.status()).toBe(503);
    const error = await responseJson<{ error: string }>(response);
    expect(error.error).toContain("Failed to connect to Ollama");
    expect(error.error.toLowerCase()).not.toContain("stack");
  });

  test.skip("API-013 wishlist, authentication, and checkout API contract review @regression", async () => {
    // No such API routes or approved contract were observed; do not call guessed endpoints.
  });
});
