import { expect, type APIResponse, type Locator } from "@playwright/test";

export async function assertSuccessfulResponse(response: APIResponse): Promise<void> {
  expect(response.ok(), `Expected successful response, received HTTP ${response.status()}`).toBeTruthy();
}

export async function assertContainsText(locator: Locator, expectedText: string): Promise<void> {
  await expect(locator).toContainText(expectedText);
}
