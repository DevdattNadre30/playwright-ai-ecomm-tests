import http from "k6/http";
import { check } from "k6";

export function getStorefront(baseUrl, params) {
  const response = http.get(`${baseUrl}/`, {
    ...params,
    tags: { ...params.tags, endpoint: "storefront_home" },
  });

  check(response, {
    "GET / returns HTTP 200": (res) => res.status === 200,
    "storefront is available": (res) => res.body.includes("ShopLab"),
  });

  return response;
}

export function getCatalog(baseUrl, params) {
  const response = http.get(`${baseUrl}/products`, {
    ...params,
    tags: { ...params.tags, endpoint: "product_catalog" },
  });

  check(response, {
    "GET /products returns HTTP 200": (res) => res.status === 200,
    "catalog includes expected products": (res) =>
      res.body.includes("Wireless Bluetooth Headphones") &&
      res.body.includes("Mechanical Keyboard"),
  });

  return response;
}

export function getProductDetails(baseUrl, params, productId = "p2") {
  const response = http.get(`${baseUrl}/products/${encodeURIComponent(productId)}`, {
    ...params,
    tags: { ...params.tags, endpoint: "product_details" },
  });

  check(response, {
    "product details returns HTTP 200": (res) => res.status === 200,
    "product details includes requested product": (res) => res.body.includes("Mechanical Keyboard"),
  });

  return response;
}
