import type { ExecutionPlan } from "./planner-agent";

export class ReporterAgent {
  summarize(plan: ExecutionPlan, valid: boolean): string {
    const steps = plan.steps.map((step, index) => `${index + 1}. ${step.description}`).join("\n");
    return [
      `Scenario: ${plan.scenario}`,
      `Plan validation: ${valid ? "passed" : "failed"}`,
      "Execution plan:",
      steps,
    ].join("\n");
  }
}
