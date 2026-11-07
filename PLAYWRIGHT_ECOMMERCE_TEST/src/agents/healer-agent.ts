import type { Locator } from "@playwright/test";

export type LocatorStrategy = "role" | "label" | "placeholder" | "testId" | "text" | "css";

export interface HealingCandidate {
  locator: Locator;
  strategy: LocatorStrategy;
  description: string;
}

const strategyPriority: Record<LocatorStrategy, number> = {
  role: 0,
  label: 1,
  placeholder: 2,
  testId: 3,
  text: 4,
  css: 5,
};

export class HealerAgent {
  orderFallbacks(candidates: HealingCandidate[]): HealingCandidate[] {
    return [...candidates].sort(
      (left, right) => strategyPriority[left.strategy] - strategyPriority[right.strategy],
    );
  }
}
