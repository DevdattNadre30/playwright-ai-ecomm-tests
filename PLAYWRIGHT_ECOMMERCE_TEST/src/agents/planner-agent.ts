export type PlannedAction = "navigate" | "search" | "product" | "cart" | "wishlist" | "assert";

export interface PlanStep {
  action: PlannedAction;
  description: string;
}

export interface ExecutionPlan {
  scenario: string;
  steps: PlanStep[];
}

export class PlannerAgent {
  createPlan(scenario: string): ExecutionPlan {
    const normalizedScenario = scenario.trim();
    if (!normalizedScenario) {
      throw new Error("A non-empty test scenario is required.");
    }

    const steps: PlanStep[] = [
      { action: "navigate", description: "Open the storefront homepage." },
    ];

    const keywords: Array<[RegExp, PlannedAction, string]> = [
      [/\bsearch(?:es|ing)?\b/i, "search", "Search for a relevant catalog item."],
      [
        /\bproduct(?:s)?\b|\bdetail(?:s)?\b|\badd\b.{0,30}\bto cart\b/i,
        "product",
        "Inspect a product and its available actions.",
      ],
      [/\bcart\b|\bcheckout\b/i, "cart", "Review the shopping cart."],
      [/\bwishlist\b|\bfavorite(?:s)?\b/i, "wishlist", "Review the wishlist."],
    ];

    for (const [pattern, action, description] of keywords) {
      if (pattern.test(normalizedScenario)) {
        steps.push({ action, description });
      }
    }

    steps.push({ action: "assert", description: "Verify the expected outcome for the scenario." });
    return { scenario: normalizedScenario, steps };
  }
}
