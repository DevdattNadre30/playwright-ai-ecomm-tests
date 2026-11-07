import type { Locator, Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { HEALING_TIMEOUT_MS, SCREENSHOT_DIRECTORY } from "../config/constants";
import { HealerAgent, type HealingCandidate } from "../agents/healer-agent";
import { logger } from "../utils/logger";

type LocatorAction<T> = (locator: Locator) => Promise<T>;

export class BasePage {
  private readonly healer = new HealerAgent();

  constructor(protected readonly page: Page) {}

  async click(
    locator: Locator,
    fallbacks: HealingCandidate[] = [],
    description = "click target",
  ): Promise<void> {
    await this.withHealing(locator, fallbacks, description, (target) =>
      target.click({ timeout: HEALING_TIMEOUT_MS }),
    );
  }

  async fill(
    locator: Locator,
    value: string,
    fallbacks: HealingCandidate[] = [],
    description = "input field",
  ): Promise<void> {
    await this.withHealing(locator, fallbacks, description, (target) =>
      target.fill(value, { timeout: HEALING_TIMEOUT_MS }),
    );
  }

  async press(
    locator: Locator,
    key: string,
    fallbacks: HealingCandidate[] = [],
    description = "keyboard target",
  ): Promise<void> {
    await this.withHealing(locator, fallbacks, description, (target) =>
      target.press(key, { timeout: HEALING_TIMEOUT_MS }),
    );
  }

  async waitForElement(
    locator: Locator,
    fallbacks: HealingCandidate[] = [],
    description = "element",
  ): Promise<void> {
    await this.withHealing(locator, fallbacks, description, (target) =>
      target.waitFor({ state: "visible", timeout: HEALING_TIMEOUT_MS }),
    );
  }

  async getText(
    locator: Locator,
    fallbacks: HealingCandidate[] = [],
    description = "text element",
  ): Promise<string> {
    return this.withHealing(locator, fallbacks, description, (target) =>
      target.innerText({ timeout: HEALING_TIMEOUT_MS }),
    );
  }

  async selectDropdown(
    locator: Locator,
    value: string,
    fallbacks: HealingCandidate[] = [],
    description = "dropdown",
  ): Promise<void> {
    await this.withHealing(locator, fallbacks, description, async (target) => {
      await target.selectOption(value, { timeout: HEALING_TIMEOUT_MS });
    });
  }

  async takeScreenshot(name: string): Promise<string> {
    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = resolve(SCREENSHOT_DIRECTORY, `${safeName}.png`);
    await mkdir(dirname(filePath), { recursive: true });
    await this.page.screenshot({ path: filePath, fullPage: true });
    logger.info(`Screenshot saved: ${filePath}`);
    return filePath;
  }

  async navigateTo(path = "/"): Promise<void> {
    await this.page.goto(path);
  }

  private async withHealing<T>(
    primary: Locator,
    fallbacks: HealingCandidate[],
    description: string,
    action: LocatorAction<T>,
  ): Promise<T> {
    try {
      return await action(primary);
    } catch (primaryError) {
      const failures: unknown[] = [primaryError];

      for (const candidate of this.healer.orderFallbacks(fallbacks)) {
        try {
          const result = await action(candidate.locator);
          logger.warn(`Healed ${description} using ${candidate.strategy}: ${candidate.description}`);
          return result;
        } catch (fallbackError) {
          failures.push(fallbackError);
        }
      }

      throw new AggregateError(
        failures,
        `Unable to ${description}; the primary locator and ${fallbacks.length} fallback locator(s) failed.`,
      );
    }
  }
}
