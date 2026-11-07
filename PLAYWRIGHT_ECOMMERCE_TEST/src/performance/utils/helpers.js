import { Counter } from "k6/metrics";
import { sleep } from "k6";
import { profiles } from "../config/k6-config.js";
import { getStorefront, getCatalog, getProductDetails } from "../endpoints/product-api.js";
import { getCart } from "../endpoints/cart-api.js";
import { searchCatalog } from "../endpoints/search-api.js";

const config = JSON.parse(open("src/config/config.json"));
const failedBusinessChecks = new Counter("failed_business_checks");
const environmentName = __ENV.K6_TEST_ENV || config.activeEnvironment;
const environment = config.environments[environmentName];
if (!environment) {
  throw new Error(
    `Unknown K6_TEST_ENV "${environmentName}". Available: ${Object.keys(config.environments).join(", ")}.`,
  );
}

export const baseUrl = (__ENV.K6_BASE_URL || environment.baseUrl).replace(/\/+$/, "");
const target = new URL(baseUrl);
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const isLocalTarget = localHosts.has(target.hostname);

if (target.protocol !== "http:" && target.protocol !== "https:") {
  throw new Error("K6_BASE_URL must use HTTP or HTTPS.");
}

if (!isLocalTarget && __ENV.K6_ALLOW_EXTERNAL_TARGET !== "true") {
  throw new Error(
    `Refusing external target "${target.hostname}". Set K6_ALLOW_EXTERNAL_TARGET=true only when authorized to test this environment.`,
  );
}

export function scenarioOptions(profileName) {
  const profile = profiles[profileName];
  if (!profile) {
    throw new Error(`Unknown profile "${profileName}". Choose smoke, load, stress, or spike.`);
  }

  if (
    (profileName === "stress" || profileName === "spike") &&
    !isLocalTarget &&
    __ENV.K6_ALLOW_HIGHER_LOAD !== "true"
  ) {
    throw new Error(
      `${profileName} requires K6_ALLOW_HIGHER_LOAD=true and explicit authorization for a controlled non-production target.`,
    );
  }

  if ((profileName === "stress" || profileName === "spike") && environmentName === "preprod") {
    throw new Error(`The ${profileName} profile is disabled for the preprod environment.`);
  }

  return {
    scenarios: { [profileName]: profile.scenario },
    thresholds: {
      ...profile.thresholds,
      failed_business_checks: ["count<1"],
    },
    userAgent: "Playwright-AI-Ecomm-Tests/k6",
  };
}

function trackedCheck(result, endpoint, profileName) {
  if (!result) {
    failedBusinessChecks.add(1, { endpoint, profile: profileName });
  }
}

export function runBusinessJourney(profileName) {
  const params = {
    headers: { Accept: "application/json, text/html" },
    timeout: "10s",
    tags: { profile: profileName },
  };

  const home = getStorefront(baseUrl, params);
  trackedCheck(home.status === 200, "storefront_home", profileName);

  const catalog = getCatalog(baseUrl, params);
  trackedCheck(catalog.status === 200, "product_catalog", profileName);

  const product = getProductDetails(baseUrl, params, "p2");
  trackedCheck(product.status === 200, "product_details", profileName);

  const search = searchCatalog(baseUrl, params, "keyboard");
  trackedCheck(search.status === 200, "catalog_search_route", profileName);

  const cart = getCart(baseUrl, params);
  trackedCheck(cart.status === 200, "cart_read", profileName);

  sleep(1);
}

export function writeSummary(data) {
  const summaryPath = __ENV.K6_SUMMARY_PATH || "reports/summary.json";
  return {
    [summaryPath]: JSON.stringify(data, null, 2),
    "reports/metrics.json": JSON.stringify(data.metrics, null, 2),
    stdout: `k6 run finished. Summary: ${summaryPath}\n`,
  };
}
