import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS?: Fetcher;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const assetUrl = new URL(url);
    if (assetUrl.pathname === "/") assetUrl.pathname = "/index.html";

    if (env?.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(new Request(assetUrl, request));
      if (assetResponse.status !== 404) return assetResponse;
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
