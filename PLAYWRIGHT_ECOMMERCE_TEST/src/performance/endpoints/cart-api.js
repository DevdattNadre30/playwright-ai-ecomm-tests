import http from "k6/http";
import { check } from "k6";

export function getCart(baseUrl, params) {
  const response = http.get(`${baseUrl}/api/cart`, {
    ...params,
    tags: { ...params.tags, endpoint: "cart_read" },
  });

  let validPayload = false;
  try {
    const body = response.json();
    validPayload = Array.isArray(body.items) && typeof body.total === "number";
  } catch (error) {
    console.error(`GET /api/cart returned invalid JSON: ${String(error)}`);
  }

  check(response, {
    "GET /api/cart returns HTTP 200": (res) => res.status === 200,
    "cart payload has items and numeric total": () => validPayload,
  });

  return response;
}
