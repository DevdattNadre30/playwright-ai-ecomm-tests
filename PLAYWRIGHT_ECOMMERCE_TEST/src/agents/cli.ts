import { GeneratorAgent } from "./generator-agent";
import { PlannerAgent } from "./planner-agent";
import { ReporterAgent } from "./reporter-agent";
import { ValidatorAgent } from "./validator-agent";

async function main(): Promise<void> {
  const scenario = process.argv.slice(2).join(" ");
  if (!scenario.trim()) {
    throw new Error('Usage: npm run agents -- "Search for a product and add it to the cart"');
  }

  const planner = new PlannerAgent();
  const generator = new GeneratorAgent();
  const validator = new ValidatorAgent();
  const reporter = new ReporterAgent();
  const plan = planner.createPlan(scenario);
  const validation = validator.validate(plan);

  console.log(reporter.summarize(plan, validation.valid));
  if (!validation.valid) {
    throw new Error(`Generated plan is invalid: ${validation.issues.join("; ")}`);
  }

  console.log("\nGenerated Playwright scaffold:\n");
  console.log(generator.toPlaywrightSnippet(generator.generate(plan)));
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
