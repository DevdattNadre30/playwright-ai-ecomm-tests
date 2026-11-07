# Playwright-AI-Ecomm-Tests

An extensible Playwright + TypeScript framework for browser and API testing of e-commerce applications. It includes page objects, shared fixtures, environment configuration, fallback locators, CI pipelines, and test reports.

## Requirements

- Node.js 22 or newer and npm
- Java 17 or newer to generate/open Allure reports
- Docker for container runs (optional)
- Jenkins with the Pipeline, Workspace Cleanup, and HTML Publisher plugins for the supplied pipeline
- VS Code with MCP support to use the Playwright MCP server configuration

## Setup

```bash
npm ci
npm run install:browsers
```

Copy `.env.local.example` to `.env.local` if needed. The checked-in local default selects `dev`; environment files are ignored by Git. Set `TEST_ENV` to `dev`, `integration`, or `preprod`, or set `BASE_URL` to override the selected environment URL:

```powershell
$env:TEST_ENV = "integration"
npm test
```

`src/config/config.json` is the source of the environment URLs. The active environment is selected at runtime in this order: process environment, `.env.local`, then `activeEnvironment` in the JSON file. Invalid environment names and malformed URLs fail fast.

## Commands

| Command | Purpose |
| --- | --- |
| `npm test` | Run all tests in Chrome-compatible Chromium, Microsoft Edge, and Firefox |
| `npm run test:manual:ui` | Run automated manual cases UI-001 through UI-010 |
| `npm run test:api` | Run API specs, including automated manual API cases, without browser-project dependencies |
| `npm run perf:smoke` | Run the one-VU k6 API smoke profile |
| `npm run perf:load` | Run bounded normal load profile (up to 3 VUs) |
| `npm run perf:stress` | Run bounded stress profile (up to 6 VUs; explicit opt-in required) |
| `npm run perf:spike` | Run bounded spike profile (up to 8 VUs; explicit opt-in required) |
| `npm run perf:cloud` | Run the load profile locally and stream results to Grafana Cloud k6 |
| `npm run perf:report` | Run the load profile and export HTML, JSON summary, and metrics |
| `npm run test:smoke` | Run tests tagged `@smoke` |
| `npm run test:regression` | Run tests tagged `@regression` |
| `npm run test:sanity` | Run tests tagged `@sanity` |
| `npm run test:headed` | Run all projects with visible browsers |
| `npm run test:chrome` | Run the Chromium project |
| `npm run test:firefox` | Run Firefox |
| `npm run test:edge` | Run Microsoft Edge |
| `npm run build` | Type-check framework, tests, and Playwright config |
| `npm run report` | Open the Playwright HTML report |
| `npm run allure` | Generate and open the Allure report |
| `npm run mcp:start` | Start the Playwright MCP server in the current terminal |
| `npm run agents -- "Search for a product and add it to the cart"` | Plan and validate a scenario and print a Playwright scaffold |
| `docker build -t playwright-ai-ecomm-tests .` | Build the test-runner image |
| `docker run --rm playwright-ai-ecomm-tests` | Run the test suite in Docker |

The `chrome` project uses Playwright-managed Chromium, which is Chrome-compatible and deterministic across CI agents. The `edge` project uses the installed Microsoft Edge channel.

## Framework structure

```text
src/
  agents/       Planner, Generator, Healer, Validator, Reporter, and CLI
  api/          API client wrapper
  config/       Environment JSON, runtime resolution, and constants
  fixtures/     Extended test fixtures (API context and page objects)
  locators/     Accessible primary locators and explicit fallbacks
  pages/        BasePage and product, search, cart, and wishlist page objects
  reporting/    Trend dashboard reporter
  testdata/     JSON test data
  utils/        Logger and reusable assertions
tests/
  api/ product/ search/ cart/ wishlist/
```

Playwright supplies the `browser` and `page` fixtures. The framework extends the test fixture with a disposable `apiContext` and typed page-object fixtures; use those built-ins rather than maintaining a second browser lifecycle.

## Adding tests

Import `test` and `expect` from `src/fixtures/test-fixtures.ts`. Put selectors in `src/locators`, actions in page objects, and reusable inputs in JSON under `src/testdata`. Prefer roles, labels, and placeholders; add stable `data-testid` selectors where the application supports them.

```ts
import { test, expect } from "../../src/fixtures/test-fixtures";

test("search returns matching products @smoke", async ({ page, searchPage }) => {
  await page.goto("/");
  await searchPage.search("shirt");
  await expect(page.locator("body")).toContainText(/shirt/i);
});
```

`BasePage` methods try the primary locator first, then fallback candidates ordered by accessible strategy. Successful fallback use is logged; if all candidates fail, the operation throws with its last failure as the cause. Fallbacks should be few, specific, and reviewed when the application changes—self-healing is not a substitute for maintaining selectors. Playwright also captures screenshots, traces, and videos on failed tests.

## Environment and execution

Set `TEST_ENV`, `BASE_URL`, `CI`, or `LOG_LEVEL` in the job environment. Tests run fully parallel by default; local workers use Playwright's default, while CI is capped at two workers with two retries. Test timeout, action timeout, and navigation timeout are centrally configured in `playwright.config.ts` and `src/config/constants.ts`.

The provided storefront URL is used for sample tests. Product-interaction and search samples skip when their expected home-page controls are absent; adapt selectors and flows to the target application's actual markup before treating those scenarios as release gates. Cart and wishlist route examples are starter smoke checks.

## Reports

Every test run writes:

- Playwright HTML: `test-results/html-report/`
- JSON: `test-results/results.json`
- JUnit XML: `test-results/junit.xml`
- Allure results: `test-results/allure-results/`
- Dashboard and up to 30 run metrics: `test-results/dashboard.html` and `test-results/trend-history.json`
- Failure artifacts (screenshots, traces, videos): `test-results/artifacts/`

Use `npm run report` for the HTML report and `npm run allure` for an Allure report. Open `test-results/dashboard.html` for pass/fail metrics and the recent-run trend chart. Keep `test-results/trend-history.json` in a CI cache or persistent volume if trend history should span ephemeral agents; generated test results are intentionally ignored by Git.

## MCP and agent workflow

VS Code discovers `.vscode/mcp.json` and launches the pinned Playwright MCP server through `npx` when the configured MCP server is activated. To start it manually, use `npm run mcp:start` or `.\scripts\setup-mcp.ps1`; stop the foreground process with Ctrl+C.

The Planner, Generator, Healer, Validator, and Reporter are deterministic TypeScript components and do not send scenarios or source code to an external AI service. The CLI currently produces an initial plan and test scaffold, not autonomous execution or model-backed code changes. A model provider can be added behind these agent interfaces when approved credentials and data-handling requirements are defined. Runtime locator healing uses only the explicit, page-object fallback candidates and logs each recovery.

## CI/CD and Docker

- `.github/workflows/playwright.yml` runs type-checking, installs browsers, runs all projects for pushes and pull requests, then uploads reports.
- `Jenkinsfile` includes checkout, install, build, execution, report publishing, and artifact archiving. Configure the listed Jenkins plugins and a Linux agent with permission to install Playwright browser dependencies.
- `Dockerfile` installs the locked Node dependencies and all three browser engines. Provide `TEST_ENV`/`BASE_URL` with `docker run -e ...` for deployment-specific runs.

Pin dependencies through `package-lock.json`, keep credentials out of config and test data, use isolated test accounts, and retain CI artifacts according to your organization's data policy.

## Grafana k6 API performance tests

### Coverage and API inventory

The k6 suite lives under `src/performance/`, alongside the existing Playwright framework:

```text
src/performance/
  config/k6-config.ts       # typed profile/threshold contract
  config/k6-config.js       # k6 runtime profiles (k6 executes JavaScript)
  endpoints/
    product-api.js          # storefront, catalog, product details
    cart-api.js             # read-only GET /api/cart
    search-api.js           # catalog route query probe
  scenarios/
    smoke.js
    load.js
    stress.js
    spike.js
  utils/helpers.js          # config resolution, safeguards, journey, summaries
reports/                    # generated output (gitignored)
```

Inspection of the Playwright API client and specs found these business routes:

- `GET /` storefront; `GET /products`; `GET /products/{id}` product/catalog page routes.
- `GET /api/cart`, `POST /api/cart`, `PATCH /api/cart/{id}`, `DELETE /api/cart/{id}`, `DELETE /api/cart`.
- `POST /api/chat`.
- Product search is client-side in the observed application; no dedicated search API was found. The k6 search endpoint module measures the catalog route with a query string, but does not claim that server-side search is implemented.

The repeatable performance journey is intentionally read-only: storefront, catalog, product details, catalog search route, and cart read. Cart writes are excluded from concurrent virtual-user runs to avoid shared-state mutation. The chat route is excluded from performance profiles because its upstream Ollama dependency returned `503` during API exploration; benchmark it separately when the dependency is healthy and an agreed test contract exists.

### Install, configure, and run

Install Grafana k6 separately using the [official installation guide](https://grafana.com/docs/k6/latest/set-up/install-k6/). The runtime reads the active environment and base URL from `src/config/config.json`. Override with `K6_TEST_ENV` (`dev`, `integration`, or `preprod`) or `K6_BASE_URL`.

The default guard allows local targets only. For a remote environment, explicitly confirm authorization first:

```powershell
$env:K6_TEST_ENV = "integration"
$env:K6_ALLOW_EXTERNAL_TARGET = "true"
npm run perf:smoke
npm run perf:load
```

Profiles are deliberately bounded: smoke uses 1 VU for 10 seconds; load ramps to 3 VUs; stress ramps to 6 VUs; spike uses at most 8 VUs. Stress/spike require the additional `K6_ALLOW_HIGHER_LOAD=true` opt-in and are disabled for `preprod`. Run them only against a controlled non-production service with explicit approval:

```powershell
$env:K6_TEST_ENV = "integration"
$env:K6_ALLOW_EXTERNAL_TARGET = "true"
$env:K6_ALLOW_HIGHER_LOAD = "true"
npm run perf:stress
npm run perf:spike
```

Thresholds validate HTTP failures below 1%, check success above 99%, and p95 request latency below 1,000 ms for smoke/load and 1,500 ms for stress/spike. Treat these as initial SLOs; agree and tune them with the service owner before gating releases.

### Live dashboard and reports

The k6 web dashboard is served at `http://127.0.0.1:5665` by default. Keep the k6 process running while viewing the dashboard:

```powershell
$env:K6_ALLOW_EXTERNAL_TARGET = "true"
$env:K6_WEB_DASHBOARD = "true"
$env:K6_WEB_DASHBOARD_OPEN = "true"
npm run perf:load
```

Generate the self-contained HTML dashboard and JSON summary/metrics:

```powershell
$env:K6_ALLOW_EXTERNAL_TARGET = "true"
npm run perf:report
```

`perf:report` defaults to the load profile. Select another profile with `K6_REPORT_PROFILE=smoke|load|stress|spike` (PowerShell: `$env:K6_REPORT_PROFILE = "load"`). Output is written to `reports/k6-report.html`, `reports/summary.json`, and `reports/metrics.json`. Generated reports are ignored by Git.

### Grafana Cloud k6

Authenticate once using a token from your secret manager. Do not commit credentials:

```powershell
k6 cloud login --token $env:K6_CLOUD_TOKEN --stack "<your-stack-slug>"
$env:K6_TEST_ENV = "integration"
$env:K6_ALLOW_EXTERNAL_TARGET = "true"
npm run perf:cloud
```

The command runs k6 locally and streams metrics to Grafana Cloud k6. Cloud test usage can incur subscription costs. See the [Grafana Cloud k6 CLI guide](https://grafana.com/docs/k6/latest/results-output/real-time/cloud/).

### CI/CD examples

Jenkins stage (install k6 on the agent and store authorization variables in Jenkins credentials):

```groovy
stage('API Performance Smoke') {
    when { expression { params.RUN_PERF_SMOKE == true } }
    steps {
        sh 'k6 version'
        withEnv(['K6_TEST_ENV=integration', 'K6_ALLOW_EXTERNAL_TARGET=true']) {
            sh 'npm run perf:smoke'
        }
    }
}
```

GitHub Actions step (install k6 with the official Grafana action; gate the job/step on an authorized dispatch input):

```yaml
- uses: grafana/setup-k6-action@v1
- name: Run authorized k6 smoke profile
  if: ${{ github.event_name == 'workflow_dispatch' && inputs.run_perf_smoke }}
  run: npm run perf:smoke
  env:
    K6_TEST_ENV: integration
    K6_ALLOW_EXTERNAL_TARGET: "true"
```

Do not run stress/spike profiles on pull requests or public production endpoints.
