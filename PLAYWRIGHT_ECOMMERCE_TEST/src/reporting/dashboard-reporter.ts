import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { FullResult, Reporter, TestCase, TestResult } from "@playwright/test/reporter";

interface DashboardCounts {
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  total: number;
}

interface HistoryEntry extends DashboardCounts {
  date: string;
  durationMs: number;
  status: string;
}

interface DashboardReporterOptions {
  historyFile?: string;
}

const escapeHtml = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export default class DashboardReporter implements Reporter {
  private readonly counts: DashboardCounts = { passed: 0, failed: 0, skipped: 0, flaky: 0, total: 0 };
  private readonly historyFile: string;
  private readonly testResults = new Map<string, TestResult>();
  private startedAt = Date.now();

  constructor(options: DashboardReporterOptions = {}) {
    this.historyFile = resolve(options.historyFile ?? "test-results/trend-history.json");
  }

  onBegin(): void {
    this.startedAt = Date.now();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    this.testResults.set(test.id, result);
  }

  async onEnd(result: FullResult): Promise<void> {
    for (const testResult of this.testResults.values()) {
      this.counts.total += 1;
      if (testResult.status === "passed") {
        if (testResult.retry > 0) {
          this.counts.flaky += 1;
        } else {
          this.counts.passed += 1;
        }
      } else if (testResult.status === "skipped" || testResult.status === "interrupted") {
        this.counts.skipped += 1;
      } else {
        this.counts.failed += 1;
      }
    }

    const history = await this.readHistory();
    const entry: HistoryEntry = {
      date: new Date().toISOString(),
      durationMs: Date.now() - this.startedAt,
      status: result.status,
      ...this.counts,
    };
    const updatedHistory = [...history, entry].slice(-30);
    await mkdir(dirname(this.historyFile), { recursive: true });
    await writeFile(this.historyFile, `${JSON.stringify(updatedHistory, null, 2)}\n`, "utf8");
    await writeFile(
      resolve(dirname(this.historyFile), "dashboard.html"),
      this.render(entry, updatedHistory),
      "utf8",
    );
  }

  private async readHistory(): Promise<HistoryEntry[]> {
    try {
      const contents = await readFile(this.historyFile, "utf8");
      const history: unknown = JSON.parse(contents);
      if (!Array.isArray(history)) {
        throw new Error(`Invalid dashboard history format in ${this.historyFile}.`);
      }
      return history as HistoryEntry[];
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  private render(current: HistoryEntry, history: HistoryEntry[]): string {
    const points = history.slice(-20);
    const width = 640;
    const height = 220;
    const maximum = Math.max(1, ...points.flatMap((item) => [item.passed + item.flaky, item.failed]));
    const coordinates = (value: number, index: number): string => {
      const x = points.length < 2 ? width / 2 : (index / (points.length - 1)) * width;
      const y = height - (value / maximum) * (height - 20) - 10;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    };
    const passLine = points.map((item, index) => coordinates(item.passed + item.flaky, index)).join(" ");
    const failLine = points.map((item, index) => coordinates(item.failed, index)).join(" ");
    const percent = current.total === 0 ? 0 : Math.round(((current.passed + current.flaky) / current.total) * 100);

    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Playwright Test Dashboard</title>
<style>
body{font:16px system-ui,sans-serif;max-width:1000px;margin:2rem auto;padding:0 1rem;color:#172033;background:#f7f9fc}
h1{margin-bottom:.25rem}.muted{color:#607086}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem}
.card,section{background:white;border:1px solid #dce3ed;border-radius:10px;padding:1rem;margin:1rem 0}
.value{font-size:1.8rem;font-weight:700}.pass{color:#16803c}.fail{color:#c62828}svg{width:100%;height:auto}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:.6rem;border-bottom:1px solid #e8edf3}
</style></head><body>
<h1>Playwright Test Dashboard</h1><p class="muted">Latest run: ${escapeHtml(current.date)} · Status: ${escapeHtml(current.status)}</p>
<div class="cards">
<div class="card"><div>Pass rate</div><div class="value">${percent}%</div></div>
<div class="card"><div>Passed</div><div class="value pass">${current.passed}</div></div>
<div class="card"><div>Failed</div><div class="value fail">${current.failed}</div></div>
<div class="card"><div>Flaky</div><div class="value">${current.flaky}</div></div>
<div class="card"><div>Skipped</div><div class="value">${current.skipped}</div></div>
<div class="card"><div>Duration</div><div class="value">${(current.durationMs / 1000).toFixed(1)}s</div></div>
</div>
<section><h2>Recent run trend (last ${points.length} runs)</h2>
<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Pass and failure trend">
<polyline points="${passLine}" fill="none" stroke="#16803c" stroke-width="4"/>
<polyline points="${failLine}" fill="none" stroke="#c62828" stroke-width="4"/>
</svg><p><span class="pass">Green: passed + flaky</span> · <span class="fail">Red: failed</span></p></section>
<section><h2>Run history</h2><table><thead><tr><th>Date</th><th>Status</th><th>Passed</th><th>Failed</th><th>Skipped</th></tr></thead>
<tbody>${[...history].reverse().map((item) => `<tr><td>${escapeHtml(item.date)}</td><td>${escapeHtml(item.status)}</td><td>${item.passed + item.flaky}</td><td>${item.failed}</td><td>${item.skipped}</td></tr>`).join("")}</tbody>
</table></section>
</body></html>`;
  }
}
