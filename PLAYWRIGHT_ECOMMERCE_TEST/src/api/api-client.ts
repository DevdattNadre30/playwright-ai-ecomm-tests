import type { APIRequestContext, APIResponse } from "@playwright/test";

export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  get(path: string): Promise<APIResponse> {
    return this.request.get(path);
  }

  post(path: string, data: unknown): Promise<APIResponse> {
    return this.request.post(path, { data });
  }

  postRaw(path: string, body: string): Promise<APIResponse> {
    return this.request.post(path, {
      data: body,
      headers: { "Content-Type": "application/json" },
    });
  }

  patch(path: string, data: unknown): Promise<APIResponse> {
    return this.request.patch(path, { data });
  }

  delete(path: string): Promise<APIResponse> {
    return this.request.delete(path);
  }
}
