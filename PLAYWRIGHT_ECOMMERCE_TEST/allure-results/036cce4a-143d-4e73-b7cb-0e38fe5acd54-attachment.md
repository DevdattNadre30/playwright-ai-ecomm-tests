# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api\cart.manual.api.spec.ts >> Manual API test cases >> API-010 rejects unknown cart updates and invalid quantities @regression
- Location: tests\api\cart.manual.api.spec.ts:230:3

# Error details

```
Error: Invalid PATCH quantity responses were: 200, 200, 200, 200, 200, 200

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  166 |   });
  167 | 
  168 |   test("API-008 reject unknown product IDs without changing the cart @regression", async ({
  169 |     apiClient,
  170 |   }) => {
  171 |     for (const productId of ["not-a-product", "", null]) {
  172 |       const response = await apiClient.post(CART_ENDPOINT, { productId, quantity: 1 });
  173 |       expect(response.status()).toBe(404);
  174 |       expect(await responseJson<{ error: string }>(response)).toMatchObject({
  175 |         error: "Product not found",
  176 |       });
  177 |     }
  178 | 
  179 |     const malformedJson = await apiClient.postRaw(CART_ENDPOINT, "{");
  180 |     expect(API_ERROR_CODES).toContain(malformedJson.status());
  181 | 
  182 |     const cartResponse = await apiClient.get(CART_ENDPOINT);
  183 |     expect(await responseJson<CartResponse>(cartResponse)).toEqual({ items: [], total: 0 });
  184 |   });
  185 | 
  186 |   test("API-009 rejects invalid quantities when adding a cart item @regression", async ({
  187 |     apiClient,
  188 |   }) => {
  189 |     test.fail(
  190 |       true,
  191 |       "Known API defect: POST /api/cart accepts missing, zero, negative, fractional, string, and over-stock quantities.",
  192 |     );
  193 | 
  194 |     const invalidPayloads: Array<Record<string, unknown>> = [
  195 |       { productId: "p1", quantity: 0 },
  196 |       { productId: "p1", quantity: -1 },
  197 |       { productId: "p1", quantity: 1.5 },
  198 |       { productId: "p1", quantity: "one" },
  199 |       { productId: "p1" },
  200 |       { productId: "p1", quantity: null },
  201 |       { productId: "p1", quantity: 1000 },
  202 |     ];
  203 |     const observedStatuses: number[] = [];
  204 |     const cartMutationByPayload: Array<{ payload: Record<string, unknown>; itemCount: number }> = [];
  205 | 
  206 |     for (const payload of invalidPayloads) {
  207 |       await clearCart(apiClient);
  208 |       const response = await apiClient.post(CART_ENDPOINT, payload);
  209 |       observedStatuses.push(response.status());
  210 | 
  211 |       if (API_ERROR_CODES.includes(response.status())) {
  212 |         await responseJson<{ error?: string; message?: string }>(response);
  213 |       }
  214 | 
  215 |       const cartResponse = await apiClient.get(CART_ENDPOINT);
  216 |       const cart = await responseJson<CartResponse>(cartResponse);
  217 |       cartMutationByPayload.push({ payload, itemCount: cart.items.length });
  218 |     }
  219 | 
  220 |     expect(
  221 |       observedStatuses.every((status) => status === 400 || status === 422),
  222 |       `Invalid quantity responses were: ${observedStatuses.join(", ")}`,
  223 |     ).toBe(true);
  224 |     expect(
  225 |       cartMutationByPayload.filter(({ itemCount }) => itemCount > 0),
  226 |       "Invalid quantity payloads should not mutate the cart",
  227 |     ).toEqual([]);
  228 |   });
  229 | 
  230 |   test("API-010 rejects unknown cart updates and invalid quantities @regression", async ({
  231 |     apiClient,
  232 |   }) => {
  233 |     const unknownItem = await apiClient.patch(`${CART_ENDPOINT}/not-a-product`, { quantity: 1 });
  234 |     expect(unknownItem.status()).toBe(404);
  235 | 
  236 |     test.fail(
  237 |       true,
  238 |       "Known API defect: PATCH /api/cart/p1 accepts invalid quantities and may remove the item for negative values.",
  239 |     );
  240 | 
  241 |     const invalidQuantities: unknown[] = [-1, 1.5, "one", undefined, null, 1000];
  242 |     const observedStatuses: number[] = [];
  243 |     const observedCartStates: Array<{ quantity: unknown; itemCount: number; actualQuantity?: number }> = [];
  244 | 
  245 |     for (const quantity of invalidQuantities) {
  246 |       await clearCart(apiClient);
  247 |       const addResponse = await apiClient.post(CART_ENDPOINT, { productId: "p1", quantity: 1 });
  248 |       expect(addResponse.status()).toBe(201);
  249 | 
  250 |       const payload = quantity === undefined ? {} : { quantity };
  251 |       const response = await apiClient.patch(`${CART_ENDPOINT}/p1`, payload);
  252 |       observedStatuses.push(response.status());
  253 | 
  254 |       const cartResponse = await apiClient.get(CART_ENDPOINT);
  255 |       const cart = await responseJson<CartResponse>(cartResponse);
  256 |       observedCartStates.push({
  257 |         quantity,
  258 |         itemCount: cart.items.length,
  259 |         actualQuantity: cart.items[0]?.quantity,
  260 |       });
  261 |     }
  262 | 
  263 |     expect(
  264 |       observedStatuses.every((status) => status === 400 || status === 422),
  265 |       `Invalid PATCH quantity responses were: ${observedStatuses.join(", ")}`,
> 266 |     ).toBe(true);
      |       ^ Error: Invalid PATCH quantity responses were: 200, 200, 200, 200, 200, 200
  267 |     expect(
  268 |       observedCartStates.filter(({ itemCount, actualQuantity }) => itemCount !== 1 || actualQuantity !== 1),
  269 |       "Invalid PATCH quantities should preserve the original cart line",
  270 |     ).toEqual([]);
  271 |   });
  272 | 
  273 |   test("API-011 cart endpoints support an anonymous request context @regression", async ({
  274 |     apiClient,
  275 |   }) => {
  276 |     const getResponse = await apiClient.get(CART_ENDPOINT);
  277 |     expect(getResponse.status()).toBe(200);
  278 |     await responseJson<CartResponse>(getResponse);
  279 | 
  280 |     const addResponse = await apiClient.post(CART_ENDPOINT, { productId: "p1", quantity: 1 });
  281 |     expect(addResponse.status()).toBe(201);
  282 | 
  283 |     const cartResponse = await apiClient.get(CART_ENDPOINT);
  284 |     const cart = await responseJson<CartResponse>(cartResponse);
  285 |     expect(cart.items).toHaveLength(1);
  286 |     expect(cart.items[0].product.id).toBe("p1");
  287 |   });
  288 | 
  289 |   test("API-012 reports the chat dependency failure clearly when Ollama is unavailable @regression", async ({
  290 |     apiClient,
  291 |   }) => {
  292 |     const response = await apiClient.post(CHAT_ENDPOINT, {
  293 |       message: "Which keyboard do you sell?",
  294 |       history: [],
  295 |     });
  296 | 
  297 |     if (response.status() === 200) {
  298 |       await responseJson<Record<string, unknown>>(response);
  299 |       test.skip(true, "The chat dependency is healthy; an upstream-unavailable condition was not induced.");
  300 |     }
  301 | 
  302 |     expect(response.status()).toBe(503);
  303 |     const error = await responseJson<{ error: string }>(response);
  304 |     expect(error.error).toContain("Failed to connect to Ollama");
  305 |     expect(error.error.toLowerCase()).not.toContain("stack");
  306 |   });
  307 | 
  308 |   test.skip("API-013 wishlist, authentication, and checkout API contract review @regression", async () => {
  309 |     // No such API routes or approved contract were observed; do not call guessed endpoints.
  310 |   });
  311 | });
  312 | 
```