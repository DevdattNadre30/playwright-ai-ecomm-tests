import type { ExecutionPlan } from "./planner-agent";

export interface GeneratedTest {
  name: string;
  steps: string[];
}

export class GeneratorAgent {
  generate(plan: ExecutionPlan): GeneratedTest {
    return {
      name: plan.scenario,
      steps: plan.steps.map((step) => `// ${step.action}: ${step.description}`),
    };
  }

  toPlaywrightSnippet(test: GeneratedTest): string {
    const name = test.name.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
    const body = [
      `test('${name} @regression', async ({ page, searchPage, productPage, cartPage, wishlistPage }) => {`,
      `  const response = await page.goto("/");`,
      `  expect(response).not.toBeNull();`,
      `  expect(response?.status() ?? 0).toBeLessThan(400);`,
    ];

    for (const step of test.steps) {
      if (step.startsWith("// search:")) {
        body.push(`  await searchPage.search("shirt");`);
      } else if (step.startsWith("// product:")) {
        body.push(`  await productPage.addToCart();`);
      } else if (step.startsWith("// cart:")) {
        body.push(`  await cartPage.open();`);
      } else if (step.startsWith("// wishlist:")) {
        body.push(`  await wishlistPage.open();`);
      }
    }

    body.push(`  await expect(page.locator("body")).toBeVisible();`, "});");
    return [
      `import { test, expect } from "../../src/fixtures/test-fixtures";`,
      "",
      ...body,
    ].join("\n");
  }
}
