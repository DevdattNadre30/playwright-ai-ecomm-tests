import http from "k6/http";
import { check } from "k6";

export function searchCatalog(baseUrl, params, term = "keyboard") {
  const query = encodeURIComponent(term);
  const response = http.get(`${baseUrl}/products?search=${query}`, {
    ...params,
    tags: { ...params.tags, endpoint: "catalog_search_route" },
  });

  check(response, {
    "catalog search route responds HTTP 200": (res) => res.status === 200,
    "catalog search route returns storefront content": (res) =>
      res.body.includes("ShopLab") && res.body.includes("All Products"),
  });

  return response;
}
