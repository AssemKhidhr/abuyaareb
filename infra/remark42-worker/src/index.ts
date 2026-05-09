import { Container, getContainer } from "@cloudflare/containers";

export { Remark42Container };

interface Env {
  REMARK42_CONTAINER: DurableObjectNamespace<Remark42Container>;
}

class Remark42Container extends Container {
  defaultPort = 8080;
  requiredPorts = [8080];
  sleepAfter = "10m";
  enableInternet = true;

  override onStart() {
    console.log("Diagnostic container lifecycle: started");
  }

  override onStop(params: { exitCode?: number; reason?: string }) {
    console.log("Diagnostic container lifecycle: stopped", params);
  }

  override onError(error: unknown) {
    console.error("Diagnostic container lifecycle: error", error);
  }
}

function rewriteForContainer(request: Request): Request {
  const originalUrl = new URL(request.url);
  const rewrittenUrl = new URL(request.url);

  let path = originalUrl.pathname;

  if (path === "/remark42") {
    path = "/";
  } else if (path.startsWith("/remark42/")) {
    path = path.slice("/remark42".length);
  }

  if (!path) {
    path = "/";
  }

  rewrittenUrl.pathname = path;

  return new Request(rewrittenUrl.toString(), request);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const originalUrl = new URL(request.url);

    if (!originalUrl.pathname.startsWith("/remark42")) {
      return new Response("Not found", { status: 404 });
    }

    const rewrittenRequest = rewriteForContainer(request);
    const rewrittenUrl = new URL(rewrittenRequest.url);

    console.log("Diagnostic routing to container", {
      originalPath: originalUrl.pathname,
      rewrittenPath: rewrittenUrl.pathname,
    });

    try {
      const container = getContainer(env.REMARK42_CONTAINER, "diagnostic-main");
      return await container.fetch(rewrittenRequest);
    } catch (error) {
      console.error("Diagnostic container proxy failed", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return new Response(
        `Diagnostic container proxy failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { status: 500 }
      );
    }
  },
};