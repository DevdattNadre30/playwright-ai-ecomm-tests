import type { ExecutionPlan } from "./planner-agent";

export interface ValidationResult {
  valid: boolean;
  issues: string[];
}

export class ValidatorAgent {
  validate(plan: ExecutionPlan): ValidationResult {
    const issues: string[] = [];

    if (plan.steps.length < 2) {
      issues.push("The plan must include an action and an assertion.");
    }

    if (plan.steps[0]?.action !== "navigate") {
      issues.push("The first step must navigate to the application.");
    }

    if (plan.steps.at(-1)?.action !== "assert") {
      issues.push("The final step must verify an expected outcome.");
    }

    return { valid: issues.length === 0, issues };
  }
}
