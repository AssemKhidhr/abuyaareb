import { Container, getContainer } from "@cloudflare/containers";

export { Remark42Container };

interface Env {
  REMARK42_CONTAINER: DurableObjectNamespace<Remark42Container>;

  SECRET: string;
  R2_ENDPOINT: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;

  BUCKET_NAME?: string;
  REMARK_URL?: string;
  SITE?: string;
}

class Remark42Container extends Container {
  defaultPort = 8080;
  requiredPorts = [8080];
  sleepAfter = "10m";
  enableInternet = true;

  envVars = {
    REMARK_URL: this.env.REMARK_URL || "https://abuyaareb.org/remark42",
    SITE: this.env.SITE || "abuyaareb",

    AUTH_ANON: "true",

    STORE_TYPE: "bolt",
    STORE_BOLT_PATH: "/srv/var/db",
    BACKUP_PATH: "/srv/var/backup",

    SECRET: this.env.SECRET,

    BUCKET_NAME: this.env.BUCKET_NAME || "abuyaareb-remark42",
    R2_ENDPOINT: this.env.R2_ENDPOINT,
    AWS_ACCESS_KEY_ID: this.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: this.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: "auto",
  };

  override onStart() {
    console.log("Remark42 container lifecycle: started");
  }

  override onStop(params: { exitCode?: number; reason?: string }) {
    console.log("Remark42 container lifecycle: stopped", params);
  }

  override onError(error: unknown) {
    console.error("Remark42 container lifecycle: error", error);
  }
}

function rewriteForContainer(request: Request): Request {
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(request.url);

  let path = incomingUrl.pathname;

  if (path === "/remark42") {
    path = "/";
  } else if (path.startsWith("/remark42/")) {
    path = path.slice("/remark42".length);
  }

  // Normalize empty path.
  if (!path) {
    path = "/";
  }

  targetUrl.pathname = path;

  return new Request(targetUrl.toString(), request);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith("/remark42")) {
      return new Response("Not found", { status: 404 });
    }

    console.log("Routing request to Remark42 container", {
      originalPath: url.pathname,
      hasSecret: Boolean(env.SECRET),
      hasR2Endpoint: Boolean(env.R2_ENDPOINT),
      hasAccessKey: Boolean(env.AWS_ACCESS_KEY_ID),
      hasSecretKey: Boolean(env.AWS_SECRET_ACCESS_KEY),
    });

    try {
      const container = getContainer(env.REMARK42_CONTAINER, "remark42-main");
      const rewrittenRequest = rewriteForContainer(request);

      console.log("Forwarding rewritten request to container", {
        originalPath: url.pathname,
        rewrittenPath: new URL(rewrittenRequest.url).pathname,
      });

      return await container.fetch(rewrittenRequest);
    } catch (error) {
      console.error("Error proxying request to container", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return new Response(
        `Error proxying request to container: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { status: 500 }
      );
    }
  },
};