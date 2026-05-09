import { Container, getContainer } from "@cloudflare/containers";

export { Remark42Container };

interface Env {
  REMARK42_CONTAINER: DurableObjectNamespace<Remark42Container>;

  SECRET: string;

  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;

  R2_BUCKET_NAME?: string;
  R2_ACCOUNT_ID?: string;
  R2_ENDPOINT?: string;

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
    STORE_BOLT_PATH: "/mnt/r2/remark42/db",
    BACKUP_PATH: "/mnt/r2/remark42/backup",

    SECRET: this.env.SECRET,

    R2_BUCKET_NAME: this.env.R2_BUCKET_NAME || "abuyaareb-remark42",
    R2_ACCOUNT_ID: this.env.R2_ACCOUNT_ID || "",
    R2_ENDPOINT:
      this.env.R2_ENDPOINT ||
      `https://${this.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,

    AWS_ACCESS_KEY_ID: this.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: this.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: "auto",
  };

  override onStart() {
    console.log("Remark42 R2 container lifecycle: started");
  }

  override onStop(params: { exitCode?: number; reason?: string }) {
    console.log("Remark42 R2 container lifecycle: stopped", params);
  }

  override onError(error: unknown) {
    console.error("Remark42 R2 container lifecycle: error", error);
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

    console.log("Routing request to Remark42 R2 container", {
      originalPath: originalUrl.pathname,
      rewrittenPath: rewrittenUrl.pathname,
      hasSecret: Boolean(env.SECRET),
      hasAccessKey: Boolean(env.AWS_ACCESS_KEY_ID),
      hasSecretKey: Boolean(env.AWS_SECRET_ACCESS_KEY),
      hasR2BucketName: Boolean(env.R2_BUCKET_NAME),
      hasR2AccountId: Boolean(env.R2_ACCOUNT_ID),
      hasR2Endpoint: Boolean(env.R2_ENDPOINT),
    });

    try {
      // New instance name so we do not reuse the no-FUSE container instance.
      const container = getContainer(env.REMARK42_CONTAINER, "remark42-r2-main");
      return await container.fetch(rewrittenRequest);
    } catch (error) {
      console.error("Remark42 R2 container proxy failed", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return new Response(
        `Remark42 R2 container proxy failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { status: 500 }
      );
    }
  },
};