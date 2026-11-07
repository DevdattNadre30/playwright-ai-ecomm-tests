import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const profile = process.env.K6_REPORT_PROFILE || "load";
if (!["smoke", "load", "stress", "spike"].includes(profile)) {
  throw new Error(`Invalid K6_REPORT_PROFILE "${profile}".`);
}

const reportsDirectory = resolve("reports");
mkdirSync(reportsDirectory, { recursive: true });

const result = spawnSync(
  "k6",
  ["run", resolve(`src/performance/scenarios/${profile}.js`)],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      K6_WEB_DASHBOARD: "true",
      K6_WEB_DASHBOARD_EXPORT: resolve("reports/k6-report.html"),
      K6_SUMMARY_PATH: resolve("reports/summary.json"),
    },
  },
);

if (result.error) {
  throw new Error("Could not start k6. Install the Grafana k6 CLI and ensure it is on PATH.", {
    cause: result.error,
  });
}

process.exitCode = result.status ?? 1;
