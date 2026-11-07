# ShopLab Manual UI and API Test Cases

## Scope and live-discovery notes

- **Active environment:** `dev`, selected by `src/config/config.json`.
- **Base URL:** `https://shoplab-platform-399284160033.us-east1.run.app/`
- **Observed application title:** `ShopLab — E-Commerce Testing Playground`.
- **Observed user-facing routes:** `/products`, `/products/p1` through `/products/p8`, `/cart`, and `/chat`. The root URL opens the product catalog.
- **Observed catalog:** eight products, each with a category, name, description, price, rating, details link, and Add to Cart action.
- **Observed workflows:** client-side product search; product details and back navigation; add, read, update, and remove cart items; clear/checkout cart; AI shopping chat.
- **Observed forms and validation:** product search input; chat textbox. Chat Send is disabled for an empty message. No checkout/customer form was displayed.
- **Observed API traffic:** `GET`, `POST`, `PATCH`, and `DELETE` on `/api/cart`; `POST /api/chat`. No separate product-search/catalog API, wishlist API, authentication API, or checkout API was observed. Catalog/search traffic uses application page/router requests, not a separately observed product API.
- **Observed availability issue:** submitting a chat message returned HTTP `503` with `{"error":"Failed to connect to Ollama: fetch failed"}`. Run the chat happy-path case only when the configured Ollama service is available; keep the dependency-failure case.
- **Feature gaps in the discovered application:** no wishlist or login/register navigation was present. Direct `/wishlist`, `/login`, and unknown product `/products/p999` navigations returned HTTP `404`. Wishlist/auth positive acceptance cases below are explicitly **blocked pending feature availability**, rather than assertions that those features currently exist.
- **Baseline cart API responses observed:** `GET /api/cart` → `200`; valid `POST /api/cart` → `201`; valid `PATCH /api/cart/{productId}` → `200`; `PATCH` quantity `0` → `200` with `{"message":"Item removed"}`; `DELETE /api/cart/{productId}` and `DELETE /api/cart` → `200`.
- **API validation probe:** unknown products are rejected (`POST /api/cart` → `404`, `{"error":"Product not found"}`), but invalid POST quantities (zero, negative, fractional, string, missing, null, and over-stock) were accepted with `201`. PATCH unknown IDs return `404`; invalid PATCH quantities were accepted with `200`, and negative/zero values can remove an item. API-009 and API-010 are tracked as expected-failure tests until server-side validation is corrected.
- **API automation:** API-001–API-012 are covered in `tests/api/cart.manual.api.spec.ts`; API-007 skips when the known Ollama dependency returns `503`, API-009/API-010 expose the observed validation defects as expected failures, and API-013 remains skipped because there is no approved wishlist/authentication/checkout contract to call.
- **Baseline responsive check observed:** at a 390 × 844 viewport, the empty-cart page had no horizontal document overflow.
- **API-contract note:** successful response codes and payload examples below are based on observed browser traffic. Where negative-input status codes are not established by the live application, the expected `400`/`404`/`422` outcomes are proposed QA acceptance criteria; confirm them against the service contract before making them release gates.

## Test data

| Key | Value | Use |
|---|---|---|
| `BASE_URL` | `https://shoplab-platform-399284160033.us-east1.run.app/` | Active dev environment |
| `PRODUCT_P1` | `p1` — Wireless Bluetooth Headphones — `$79.99`, stock shown as 25 | Product and cart tests |
| `PRODUCT_P2` | `p2` — Mechanical Keyboard — `$129.99` | Search and cart tests |
| `PRODUCT_P3`–`PRODUCT_P8` | IDs `p3`–`p8`, linked from the catalog | Product-route coverage |
| `SEARCH_MATCH` | `keyboard` / `KEYBOARD` | Positive and case-insensitive search |
| `SEARCH_NO_MATCH` | `no-product-xyz` | Zero-results search |
| `CHAT_MESSAGE` | `Which keyboard do you sell?` | AI chat |
| `INVALID_PRODUCT_ID` | `not-a-product` | Negative cart API tests |
| `INVALID_QUANTITIES` | `0`, `-1`, `1.5`, `"one"` | Negative cart API tests |

Use an isolated browser context/test session for stateful cart tests. Clear the cart before and after each case. Do not treat the mock checkout success screen as a real payment or order-management integration.

## UI test cases

### UI-001 — Open the application root

- **Module Name:** Navigation
- **Title:** Root URL resolves to the product catalog
- **Preconditions:** Dev storefront is reachable.
- **Test Data:** `BASE_URL`
- **Test Steps:**
  1. Open `BASE_URL`.
  2. Wait for navigation and page content to settle.
  3. Record the final URL, page title, and main heading.
- **Expected Result:** The catalog is displayed at `/products`; the page title is `ShopLab — E-Commerce Testing Playground` and the main heading is `All Products`.
- **Priority:** High
- **Tags:** `@smoke`, `@sanity`

### UI-002 — Navigate through the primary menu

- **Module Name:** Navigation
- **Title:** Header navigation opens all discovered top-level pages
- **Preconditions:** Product catalog is loaded.
- **Test Data:** Menu destinations `/products`, `/cart`, `/chat`
- **Test Steps:**
  1. Select **ShopLab** and verify `/products`.
  2. Select **Cart** and verify `/cart`.
  3. Select **AI Chat** and verify `/chat`.
  4. Select **Products** and verify `/products`.
- **Expected Result:** Each link opens its matching route, page content is visible, and the active route is usable with browser back/forward navigation.
- **Priority:** High
- **Tags:** `@smoke`, `@sanity`

### UI-003 — Verify the product catalog cards

- **Module Name:** Product Catalog
- **Title:** Catalog displays all available products and their key details
- **Preconditions:** `/products` is reachable.
- **Test Data:** Catalog inventory `p1`–`p8`
- **Test Steps:**
  1. Open `/products`.
  2. Verify the catalog reports eight products.
  3. For each card, inspect its category, name, description, price, rating, details link, and **Add to Cart** action.
  4. Confirm the Details link points to the matching product ID.
- **Expected Result:** Eight complete product cards are displayed and each card links to its corresponding `/products/p{id}` page.
- **Priority:** High
- **Tags:** `@smoke`, `@regression`

### UI-004 — Open each product detail route

- **Module Name:** Product Details
- **Title:** Every catalog product has a valid detail page
- **Preconditions:** Product catalog is reachable.
- **Test Data:** `/products/p1` through `/products/p8`
- **Test Steps:**
  1. Open each product's Details link from the catalog.
  2. Verify the product name, category, description, price, rating, and stock information.
  3. Verify the **Add to Cart** button is available for an in-stock item.
- **Expected Result:** Each listed ID opens the matching product details; displayed data agrees with its catalog card and the route does not return 404.
- **Priority:** High
- **Tags:** `@smoke`, `@regression`

### UI-005 — Return from product details to catalog

- **Module Name:** Product Details
- **Title:** Back to Products returns to the catalog
- **Preconditions:** A valid product detail page is open.
- **Test Data:** `/products/p1`
- **Test Steps:**
  1. Select **Back to Products**.
  2. Verify the catalog route and product list.
- **Expected Result:** The application returns to `/products` without a broken route or blank page.
- **Priority:** Medium
- **Tags:** `@sanity`, `@regression`

### UI-006 — Search by a partial product name

- **Module Name:** Search
- **Title:** Matching search term filters the catalog
- **Preconditions:** `/products` is loaded.
- **Test Data:** `keyboard`
- **Test Steps:**
  1. Enter `keyboard` in **Search products…**.
  2. Observe the result count and cards without submitting a separate form.
  3. Verify the matching product and its details link.
- **Expected Result:** Search updates the catalog as the text is entered and returns the Mechanical Keyboard result. Search is client-side in the observed implementation.
- **Priority:** High
- **Tags:** `@smoke`, `@sanity`, `@regression`

### UI-007 — Search is case-insensitive

- **Module Name:** Search
- **Title:** Search matches product text regardless of letter case
- **Preconditions:** Catalog is loaded.
- **Test Data:** `KEYBOARD`
- **Test Steps:**
  1. Enter `KEYBOARD` in the product search field.
  2. Inspect result count and product names.
- **Expected Result:** Results match the corresponding lower-case query; no unrelated products are shown.
- **Priority:** Medium
- **Tags:** `@sanity`, `@regression`

### UI-008 — Search with no matching products

- **Module Name:** Search
- **Title:** No-results state is informative and recoverable
- **Preconditions:** Catalog is loaded.
- **Test Data:** `no-product-xyz`
- **Test Steps:**
  1. Enter the test term in the product search field.
  2. Observe the result count and empty-state message.
  3. Replace the term with `keyboard`.
- **Expected Result:** Zero results are reported with a clear “No products found” message; changing the term restores matching results without a page error.
- **Priority:** Medium
- **Tags:** `@regression`

### UI-009 — Search empty, whitespace, and special-character inputs

- **Module Name:** Search
- **Title:** Search handles boundary strings without breaking the catalog
- **Preconditions:** Catalog is loaded.
- **Test Data:** Empty string, spaces, punctuation such as `!@#$`, and a long query
- **Test Steps:**
  1. Clear the search field.
  2. Enter spaces only, punctuation, and a long string in separate runs.
  3. Observe result counts, empty-state text, and console-visible application errors.
- **Expected Result:** The page remains usable, the result state accurately reflects the query, and no script error or stale prior result is displayed. Record whitespace-normalization behavior for product-owner confirmation.
- **Priority:** Low
- **Tags:** `@regression`

### UI-010 — Add a product from the catalog

- **Module Name:** Cart
- **Title:** Catalog Add to Cart creates a cart line
- **Preconditions:** Cart is empty; product `p1` is in stock.
- **Test Data:** `p1`, quantity `1`
- **Test Steps:**
  1. Open `/products`.
  2. Select **Add to Cart** on Wireless Bluetooth Headphones.
  3. Open `/cart`.
- **Expected Result:** The cart contains Wireless Bluetooth Headphones with quantity 1, unit price `$79.99`, and total `$79.99`. The observed request is `POST /api/cart` with `{"productId":"p1","quantity":1}` and status `201`.
- **Priority:** High
- **Tags:** `@smoke`, `@regression`

### UI-011 — Add a product from product details

- **Module Name:** Cart
- **Title:** Product detail Add to Cart uses the selected product
- **Preconditions:** Cart is empty; `/products/p1` is in stock.
- **Test Data:** `p1`
- **Test Steps:**
  1. Open `/products/p1`.
  2. Select **Add to Cart**.
  3. Open Cart.
- **Expected Result:** The selected product, not another catalog item, appears once in the cart with the correct details and price.
- **Priority:** High
- **Tags:** `@regression`

### UI-012 — Verify cart state after navigation and reload

- **Module Name:** Cart
- **Title:** Cart contents persist across route navigation and reload
- **Preconditions:** At least one product is in the cart.
- **Test Data:** `p1`, quantity `1`
- **Test Steps:**
  1. Open the catalog, then Cart, then AI Chat, then Cart again.
  2. Reload the Cart page.
  3. Compare item quantity and totals before and after navigation.
- **Expected Result:** Cart contents remain consistent for the same browser session and are reloaded from `GET /api/cart`.
- **Priority:** High
- **Tags:** `@sanity`, `@regression`

### UI-013 — Increase cart quantity and recalculate totals

- **Module Name:** Cart
- **Title:** Increase quantity updates line and order totals
- **Preconditions:** Cart contains one `p1` item.
- **Test Data:** `p1`, quantity change from `1` to `2`
- **Test Steps:**
  1. Select **Increase quantity** once.
  2. Verify the quantity and line total.
  3. Verify the order total.
- **Expected Result:** Quantity becomes 2; unit price remains `$79.99`; line and order totals become `$159.98`. Observed API: `PATCH /api/cart/p1` with `{"quantity":2}`, status `200`.
- **Priority:** High
- **Tags:** `@smoke`, `@regression`

### UI-014 — Decrease quantity when more than one item is present

- **Module Name:** Cart
- **Title:** Decrease quantity updates totals without going below zero
- **Preconditions:** Cart contains `p1` quantity 2.
- **Test Data:** `p1`, quantity change from `2` to `1`
- **Test Steps:**
  1. Select **Decrease quantity** once.
  2. Verify quantity, line total, and order total.
- **Expected Result:** Quantity returns to 1 and totals return to `$79.99`; no negative or stale quantity is displayed.
- **Priority:** High
- **Tags:** `@regression`

### UI-015 — Decrease quantity at one

- **Module Name:** Cart
- **Title:** Decreasing the last unit removes the cart item
- **Preconditions:** Cart contains one item with quantity 1.
- **Test Data:** `p1`, quantity `1`
- **Test Steps:**
  1. Select **Decrease quantity** once.
  2. Inspect the Cart page and empty state.
- **Expected Result:** The line is removed and the empty-cart state is shown. Observed API: `PATCH /api/cart/p1` with `{"quantity":0}`, status `200`, response `{"message":"Item removed"}`.
- **Priority:** Medium
- **Tags:** `@regression`

### UI-016 — Remove one product while preserving other lines

- **Module Name:** Cart
- **Title:** Remove deletes only the selected product
- **Preconditions:** Cart contains at least two distinct products.
- **Test Data:** `p1` and `p2`
- **Test Steps:**
  1. Select **Remove** for `p1`.
  2. Inspect remaining cart lines and order total.
- **Expected Result:** `p1` is removed; `p2` remains and the order total is recalculated. Observed item-delete route: `DELETE /api/cart/p1`, status `200`.
- **Priority:** High
- **Tags:** `@regression`

### UI-017 — Clear all cart items

- **Module Name:** Cart
- **Title:** Clear Cart removes all lines
- **Preconditions:** Cart contains at least two distinct products.
- **Test Data:** `p1` and `p2`
- **Test Steps:**
  1. Select **Clear Cart**.
  2. Inspect the empty state and verify each line is gone.
- **Expected Result:** All items are removed and the empty-cart view appears. The observed full-cart API route is `DELETE /api/cart`, status `200`.
- **Priority:** High
- **Tags:** `@regression`

### UI-018 — Empty cart recovery

- **Module Name:** Cart
- **Title:** Empty cart offers a working Continue Shopping route
- **Preconditions:** Cart has no items.
- **Test Data:** Empty cart
- **Test Steps:**
  1. Open `/cart`.
  2. Verify the empty-cart message.
  3. Select **Continue Shopping**.
- **Expected Result:** Empty-cart messaging is displayed and Continue Shopping returns to `/products`.
- **Priority:** Medium
- **Tags:** `@sanity`, `@regression`

### UI-019 — Complete the demo checkout flow

- **Module Name:** Checkout
- **Title:** Checkout displays the mock order confirmation
- **Preconditions:** Cart contains at least one valid product.
- **Test Data:** `p1`, quantity `1`
- **Test Steps:**
  1. Open Cart and verify item and total.
  2. Select **Checkout** once.
  3. Verify the confirmation state.
  4. Use **Continue Shopping** and revisit Cart.
- **Expected Result:** The page displays “Order Placed Successfully!” and a Continue Shopping link; the cart is cleared after the demo flow. Discovery showed no shipping/payment form and no distinct checkout API request—do not interpret this as a real payment transaction.
- **Priority:** High
- **Tags:** `@sanity`, `@regression`

### UI-020 — Cart quantity and stock boundary

- **Module Name:** Product and Cart
- **Title:** Quantity cannot exceed available product stock
- **Preconditions:** Cart is empty; product `p1` stock is shown as 25.
- **Test Data:** `p1`, attempt quantity 26
- **Test Steps:**
  1. Add `p1` and increase its quantity to the displayed stock.
  2. Attempt one additional increment.
  3. Inspect displayed quantity, total, and any validation feedback.
- **Expected Result:** Quantity must not exceed available stock; the UI gives clear feedback and preserves consistent totals. This is a boundary acceptance test; stock-limit behavior was not verified during discovery.
- **Priority:** High
- **Tags:** `@regression`

### UI-021 — Empty chat message validation

- **Module Name:** AI Chat
- **Title:** Send is disabled when the chat message is empty
- **Preconditions:** `/chat` is loaded with no message entered.
- **Test Data:** Empty string and whitespace-only input
- **Test Steps:**
  1. Observe Send before entering text.
  2. Enter spaces only.
  3. Attempt to send using the button and Enter.
- **Expected Result:** Empty input cannot be submitted and no chat request is sent. The observed initial Send button was disabled.
- **Priority:** High
- **Tags:** `@sanity`, `@regression`

### UI-022 — Send an AI shopping question

- **Module Name:** AI Chat
- **Title:** Valid product question receives an assistant response
- **Preconditions:** `/chat` is loaded; chat/Ollama service is healthy.
- **Test Data:** `Which keyboard do you sell?`
- **Test Steps:**
  1. Enter the question.
  2. Select Send.
  3. Wait for the assistant response and inspect the conversation.
- **Expected Result:** The user message appears and a non-empty relevant response is shown. Expected request: `POST /api/chat` with `{"message":"Which keyboard do you sell?","history":[]}`. **Current live baseline is blocked:** the observed call returned `503` because Ollama could not be reached.
- **Priority:** High
- **Tags:** `@regression`

### UI-023 — Chat keyboard submission and multiline input

- **Module Name:** AI Chat
- **Title:** Enter submits and Shift+Enter inserts a newline
- **Preconditions:** Chat service is available; `/chat` is loaded.
- **Test Data:** `Compare keyboard` + Shift+Enter + `and mouse`
- **Test Steps:**
  1. Type a two-line question using Shift+Enter between lines.
  2. Verify the newline remains in the textbox and the message is not prematurely submitted.
  3. Press Enter without Shift.
- **Expected Result:** Shift+Enter adds a line; Enter submits the message once. This behavior is advertised by the chat placeholder and should be confirmed with the service available.
- **Priority:** Medium
- **Tags:** `@regression`

### UI-024 — Chat dependency failure is handled

- **Module Name:** Error Handling
- **Title:** Chat backend failure is reported without breaking the page
- **Preconditions:** Chat route is available; Ollama service is unavailable or a controlled service failure is configured.
- **Test Data:** `Which keyboard do you sell?`
- **Test Steps:**
  1. Submit a valid chat question.
  2. Observe the error state, input state, and page console.
  3. Attempt to edit or retry the message.
- **Expected Result:** A clear recoverable error is shown, the page remains interactive, and no unhandled UI crash occurs. Observed error text: `Failed to connect to Ollama: fetch failed`; request returned `503`.
- **Priority:** High
- **Tags:** `@regression`

### UI-025 — Unknown product route returns a not-found page

- **Module Name:** Error Handling
- **Title:** Invalid product ID does not display another product
- **Preconditions:** Storefront is reachable.
- **Test Data:** `/products/p999`
- **Test Steps:**
  1. Open the invalid product URL directly.
  2. Inspect HTTP status and not-found content.
  3. Use browser back or a valid Products link to recover.
- **Expected Result:** A 404/not-found state is shown and no unrelated product is presented. Observed response: HTTP `404`.
- **Priority:** Medium
- **Tags:** `@regression`

### UI-026 — Wishlist feature availability

- **Module Name:** Wishlist
- **Title:** Confirm wishlist entry point and route behavior
- **Preconditions:** Storefront is reachable.
- **Test Data:** Header links; `/wishlist`
- **Test Steps:**
  1. Inspect header and product actions for a wishlist/favorite control.
  2. Open `/wishlist` directly.
  3. Record the route status and whether a wishlist workflow is available.
- **Expected Result:** **Current baseline:** no wishlist link/action is exposed and `/wishlist` returns `404`. If wishlist is an intended product requirement, this test is **blocked pending implementation**; acceptance should then cover add/remove, persistence, duplicate items, and empty state.
- **Priority:** Medium
- **Tags:** `@regression`

### UI-027 — Authentication and authorization availability

- **Module Name:** Authentication
- **Title:** Confirm whether sign-in or protected account workflows exist
- **Preconditions:** Storefront is reachable in a clean browser context.
- **Test Data:** Header navigation; `/login`; `/account`
- **Test Steps:**
  1. Inspect navigation and product/cart pages for sign-in, registration, and account links.
  2. Open `/login` and `/account` directly.
  3. Record redirects, status codes, and any authentication prompts.
- **Expected Result:** **Current baseline:** no authentication entry point was exposed and `/login` returned `404`; authentication/authorization is not implemented in the discovered UI. If required, this case is **blocked pending implementation** and should be expanded to registration, sign-in validation, session expiry, and protected-route authorization.
- **Priority:** High
- **Tags:** `@regression`

### UI-028 — Responsive catalog and navigation

- **Module Name:** Responsive UI
- **Title:** Catalog remains usable at mobile and desktop widths
- **Preconditions:** Catalog is reachable.
- **Test Data:** Viewports 390 × 844 and 1280 × 900
- **Test Steps:**
  1. At each viewport, inspect navigation, search, product cards, and Add to Cart controls.
  2. Check for horizontal page overflow and clipped or overlapping content.
  3. Open a product and Cart at the mobile width.
- **Expected Result:** Navigation and key controls remain usable; content reflows without horizontal overflow or overlapping elements. Empty-cart page was observed at 390 px with no horizontal overflow; other routes require execution.
- **Priority:** Medium
- **Tags:** `@regression`

### UI-029 — Responsive chat and cart controls

- **Module Name:** Responsive UI
- **Title:** Chat input and cart actions fit a mobile viewport
- **Preconditions:** Chat and Cart routes are reachable.
- **Test Data:** Viewports 390 × 844 and 1280 × 900
- **Test Steps:**
  1. Inspect chat textbox and Send at both widths.
  2. Add a product and inspect cart quantity, remove, clear, and checkout controls at both widths.
  3. Check scrolling and horizontal overflow.
- **Expected Result:** All actions are visible or reachable by normal vertical scrolling, usable without overlap, and not hidden off-screen horizontally.
- **Priority:** Medium
- **Tags:** `@regression`

### UI-030 — Direct route reload and browser history

- **Module Name:** Navigation
- **Title:** Valid nested routes survive reload and browser history
- **Preconditions:** Valid product and chat routes are reachable.
- **Test Data:** `/products/p2`, `/cart`, `/chat`
- **Test Steps:**
  1. Open each route directly in the address bar.
  2. Reload the route.
  3. Navigate between routes and use browser Back and Forward.
- **Expected Result:** Each valid route renders the same page after reload; browser history does not leave a blank or stale page.
- **Priority:** Medium
- **Tags:** `@sanity`, `@regression`

## API test cases

For JSON requests, use `Content-Type: application/json`. No authentication header or API key was observed in the browser requests. Use an isolated test session and restore cart state after each mutating case.

### API-001 — Read an empty cart

- **API Name:** Get cart
- **Endpoint:** `GET /api/cart`
- **Request Method:** `GET`
- **Headers:** `Accept: application/json`
- **Request Payload:** None
- **Preconditions:** Cart is empty in the test session.
- **Validation Steps:** Send request; verify response is valid JSON and represents no cart items; confirm no server error.
- **Expected Response:** Successful response with an empty-cart representation.
- **Status Code Validation:** Expect `200` (observed `200`).
- **Negative Test Scenarios:** Repeat with no cookies/session; verify behavior matches the documented anonymous-cart contract and does not expose another user's cart.

### API-002 — Add a valid product to cart

- **API Name:** Add cart item
- **Endpoint:** `POST /api/cart`
- **Request Method:** `POST`
- **Headers:** `Content-Type: application/json`; `Accept: application/json`
- **Request Payload:** `{"productId":"p1","quantity":1}`
- **Preconditions:** Product `p1` exists and is in stock; test cart is empty.
- **Validation Steps:** Send request; verify returned product ID/name/price and quantity; follow with `GET /api/cart` and verify the line is present exactly once.
- **Expected Response:** JSON object with product details and `quantity: 1`. Observed response included `id: "p1"`, `name: "Wireless Bluetooth Headphones"`, `price: 79.99`, and `quantity: 1`.
- **Status Code Validation:** Expect `201 Created` (observed `201`).
- **Negative Test Scenarios:** Invalid/nonexistent product ID; missing product ID; missing quantity; malformed JSON; invalid, fractional, zero, or negative quantity. Require a clear client error and no unintended cart mutation.

### API-003 — Update cart item quantity

- **API Name:** Update cart item
- **Endpoint:** `PATCH /api/cart/{productId}` (example `/api/cart/p1`)
- **Request Method:** `PATCH`
- **Headers:** `Content-Type: application/json`; `Accept: application/json`
- **Request Payload:** `{"quantity":2}`
- **Preconditions:** Product `p1` is in the cart and sufficient stock is available.
- **Validation Steps:** Send request; validate returned product and quantity; call `GET /api/cart` and verify quantity and computed totals are consistent.
- **Expected Response:** JSON item with quantity 2 and unchanged product details. Observed response returned the product object and `quantity: 2`.
- **Status Code Validation:** Expect `200 OK` (observed `200`).
- **Negative Test Scenarios:** Unknown product ID; missing/non-numeric/fractional quantity; negative quantity; quantity above stock. Expect a documented validation/not-found response and unchanged cart, except quantity zero which is the explicit remove behavior below.

### API-004 — Set quantity to zero

- **API Name:** Remove cart item by quantity update
- **Endpoint:** `PATCH /api/cart/{productId}`
- **Request Method:** `PATCH`
- **Headers:** `Content-Type: application/json`; `Accept: application/json`
- **Request Payload:** `{"quantity":0}`
- **Preconditions:** The specified product is present in the cart.
- **Validation Steps:** Send request; inspect response body; call `GET /api/cart` and verify the line is absent.
- **Expected Response:** `{"message":"Item removed"}`. This behavior was observed.
- **Status Code Validation:** Expect `200 OK` (observed `200`).
- **Negative Test Scenarios:** Repeat for an unknown product ID; verify the response is consistent with the API's not-found/idempotency contract and does not affect other cart lines.

### API-005 — Delete one cart item

- **API Name:** Delete cart item
- **Endpoint:** `DELETE /api/cart/{productId}` (example `/api/cart/p1`)
- **Request Method:** `DELETE`
- **Headers:** `Accept: application/json`
- **Request Payload:** None
- **Preconditions:** Cart contains at least two distinct items.
- **Validation Steps:** Delete `p1`; then read the cart and verify only `p1` is removed and totals are recalculated.
- **Expected Response:** Successful deletion with no remaining `p1` line.
- **Status Code Validation:** Expect `200 OK` (observed `200`).
- **Negative Test Scenarios:** Delete an unknown product ID; verify the documented `404` or idempotent `200` behavior and ensure no other product is deleted.

### API-006 — Clear the entire cart

- **API Name:** Clear cart
- **Endpoint:** `DELETE /api/cart`
- **Request Method:** `DELETE`
- **Headers:** `Accept: application/json`
- **Request Payload:** None
- **Preconditions:** Cart contains one or more items.
- **Validation Steps:** Delete the cart; call `GET /api/cart`; verify the empty-cart representation.
- **Expected Response:** Successful clear and no remaining items.
- **Status Code Validation:** Expect `200 OK` (observed `200` during the demo checkout flow).
- **Negative Test Scenarios:** Repeat when cart is already empty; the call should be safe and should not produce a server error. Verify caller/session isolation.

### API-007 — Submit a valid AI chat request

- **API Name:** Send chat message
- **Endpoint:** `POST /api/chat`
- **Request Method:** `POST`
- **Headers:** `Content-Type: application/json`; `Accept: application/json`
- **Request Payload:** `{"message":"Which keyboard do you sell?","history":[]}`
- **Preconditions:** Chat endpoint and its configured Ollama service are healthy.
- **Validation Steps:** Send request; validate successful JSON response and non-empty assistant content; verify conversation history is handled according to the chat contract.
- **Expected Response:** Successful assistant reply relevant to the submitted message.
- **Status Code Validation:** Expect `200 OK` for a successful chat (positive status is an acceptance expectation, not observed). **Current live baseline:** `503 Service Unavailable` with `{"error":"Failed to connect to Ollama: fetch failed"}`.
- **Negative Test Scenarios:** Empty message, whitespace-only message, malformed JSON, invalid history shape, excessively long message, unavailable Ollama, and upstream timeout. Return clear validation/dependency errors without hanging or leaking stack traces.

### API-008 — Reject an unknown product on cart creation

- **API Name:** Add invalid cart item
- **Endpoint:** `POST /api/cart`
- **Request Method:** `POST`
- **Headers:** `Content-Type: application/json`; `Accept: application/json`
- **Request Payload:** `{"productId":"not-a-product","quantity":1}`
- **Preconditions:** Isolated cart; confirm the product ID does not exist.
- **Validation Steps:** Send the request; read the cart afterward and verify no item was added.
- **Expected Response:** Validation/not-found JSON error; no mutation.
- **Status Code Validation:** Proposed `400 Bad Request` or `404 Not Found`; confirm the exact contract with the API owner.
- **Negative Test Scenarios:** Empty ID, null ID, unknown ID, and ID with unexpected format; verify the server rejects each and does not add a default product.

### API-009 — Reject invalid cart quantities

- **API Name:** Validate add-item quantity
- **Endpoint:** `POST /api/cart`
- **Request Method:** `POST`
- **Headers:** `Content-Type: application/json`; `Accept: application/json`
- **Request Payload:** Test independently with `{"productId":"p1","quantity":0}`, `{"productId":"p1","quantity":-1}`, `{"productId":"p1","quantity":1.5}`, and `{"productId":"p1","quantity":"one"}`.
- **Preconditions:** Isolated cart; product `p1` exists.
- **Validation Steps:** Submit each payload; inspect status/body and read the cart after each request.
- **Expected Response:** Validation error and no unintended item/quantity mutation.
- **Status Code Validation:** Proposed `400 Bad Request` or `422 Unprocessable Content`; confirm exact status with the API owner. Note that `PATCH` quantity zero is a documented removal behavior, distinct from add-item quantity zero.
- **Negative Test Scenarios:** All payload variants listed above, missing quantity, null quantity, and quantity above stock.

### API-010 — Reject invalid cart update identifiers and quantities

- **API Name:** Validate cart item update
- **Endpoint:** `PATCH /api/cart/{productId}`
- **Request Method:** `PATCH`
- **Headers:** `Content-Type: application/json`; `Accept: application/json`
- **Request Payload:** `{"quantity":1}` for an unknown ID; separately try `{"quantity":-1}` and `{"quantity":1.5}` for `p1`.
- **Preconditions:** Isolated cart; `p1` exists; `not-a-product` does not.
- **Validation Steps:** Submit each request separately; verify errors are understandable and cart state remains unchanged.
- **Expected Response:** Not-found response for unknown item; validation response for unsupported quantities.
- **Status Code Validation:** Proposed `404 Not Found` for unknown ID and `400`/`422` for invalid quantity; confirm exact contract.
- **Negative Test Scenarios:** Unknown ID, negative/fractional/string quantity, missing quantity, and quantity above stock. Do not use quantity zero here; zero intentionally removes the item.

### API-011 — Exercise cart APIs without authentication

- **API Name:** Anonymous cart access / authorization boundary
- **Endpoint:** `GET /api/cart`, `POST /api/cart`
- **Request Method:** `GET`, `POST`
- **Headers:** `Accept: application/json`; for POST, `Content-Type: application/json`; omit `Authorization`.
- **Request Payload:** GET: none. POST: `{"productId":"p1","quantity":1}` in an isolated test session.
- **Preconditions:** Clean cookie jar; no login/session token.
- **Validation Steps:** Call GET and POST without credentials; inspect the response and verify data is isolated to the test session.
- **Expected Response:** The current site exposes no authentication UI and browser calls used no Authorization header. Validate the product's intended anonymous-cart behavior; do not infer multi-user isolation from a single browser.
- **Status Code Validation:** GET `200` was observed without an Authorization header; POST `201` was observed from the browser. Confirm expected anonymous behavior with the API owner.
- **Negative Test Scenarios:** Attempt to read another session's cart by changing/omitting cookies or session identifiers; if authentication is later introduced, verify missing/expired/invalid token behavior and that protected data is not disclosed.

### API-012 — Handle chat dependency failure

- **API Name:** Chat upstream error handling
- **Endpoint:** `POST /api/chat`
- **Request Method:** `POST`
- **Headers:** `Content-Type: application/json`; `Accept: application/json`
- **Request Payload:** `{"message":"Which keyboard do you sell?","history":[]}`
- **Preconditions:** Configure or observe Ollama as unavailable.
- **Validation Steps:** Submit the message; verify response status/body, response time, and that retry does not duplicate the user message unexpectedly.
- **Expected Response:** Clear dependency error; no raw stack trace or indefinite pending request.
- **Status Code Validation:** Observed `503 Service Unavailable` with `{"error":"Failed to connect to Ollama: fetch failed"}`.
- **Negative Test Scenarios:** Upstream refused connection, timeout, malformed upstream response, and repeated request after recovery; verify recovery and stable conversation state.

### API-013 — Verify no unsupported wishlist or checkout API is assumed

- **API Name:** Discovered API surface / unsupported features
- **Endpoint:** No wishlist/auth/checkout endpoint was observed; cart routes are listed above.
- **Request Method:** Discovery/contract review; do not invent an endpoint.
- **Headers:** Not applicable until an API contract is published.
- **Request Payload:** Not applicable.
- **Preconditions:** Review network activity from catalog, cart, product details, and checkout.
- **Validation Steps:** Compare any newly introduced API traffic with the approved OpenAPI/API specification; document endpoint, method, auth, payload, and response contract before adding integration tests.
- **Expected Response:** Wishlist and authentication API tests remain blocked until those features and their API contracts exist. Demo checkout currently has no distinct observed checkout request; the cart is cleared in the demo flow.
- **Status Code Validation:** Not applicable; no such endpoint was observed.
- **Negative Test Scenarios:** Do not call guessed endpoints against production or treat a guessed `404` as a validated API contract.

## Execution and defect logging

For each run, record the tester, date, browser/device, environment, test data, actual result, request/response evidence for API cases, and linked defect IDs. For failures, include the route, console/network error, sanitized request/response, and screenshot. Do not include credentials, cookies, or personal data in evidence.
