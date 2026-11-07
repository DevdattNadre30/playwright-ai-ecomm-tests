import { ApiClient } from "../../src/api/api-client";
import { assertSuccessfulResponse } from "../../src/utils/assertions";
import { test } from "../../src/fixtures/test-fixtures";

test("storefront homepage API responds successfully @smoke @sanity", async ({ apiContext }) => {
  const apiClient = new ApiClient(apiContext);
  const response = await apiClient.get("/");
  await assertSuccessfulResponse(response);
});
