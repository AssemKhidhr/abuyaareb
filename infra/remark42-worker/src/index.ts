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
    // Defaults are safe for your current PoC. Override from wrangler vars if needed.
    REMARK_URL: this.env.REMARK_URL || "https://abuyaareb.org/remark42",
    SITE: this.env.SITE || "abuyaareb",

    // Minimal usable anonymous-auth PoC.
    AUTH_ANON: "true",
    AUTH_EMAIL_ENABLE: "false",
    AUTH_TELEGRAM: "false",
    AUTH_GOOGLE_CID: "",
    AUTH_FACEBOOK_CID: "",
    AUTH_GITHUB_CID: "",

    // Remark42 storage paths.
    STORE_TYPE: "bolt",
    STORE_BOLT_PATH: "/srv/var/db",
    BACKUP_PATH: "/srv/var/backup",

    // Required by Remark42.
    SECRET: this.env.SECRET,

    // Required by our FUSE/R2 mount script.
    BUCKET_NAME: this.env.BUCKET_NAME || "abuyaareb-remark42",
    R2_ENDPOINT: this.env.R2_ENDPOINT,
    AWS_ACCESS_KEY_ID: this.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: this.env.AWS_SECRET_ACCESS_KEY,

    // AWS-compatible S3 clients often expect this.
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith("/remark42")) {
      return new Response("Not found", { status: 404 });
    }

    console.log("Routing request to Remark42 container", {
      path: url.pathname,
      hasSecret: Boolean(env.SECRET),
      hasR2Endpoint: Boolean(env.R2_ENDPOINT),
      hasAccessKey: Boolean(env.AWS_ACCESS_KEY_ID),
      hasSecretKey: Boolean(env.AWS_SECRET_ACCESS_KEY),
    });

    try {
      const container = getContainer(env.REMARK42_CONTAINER, "remark42-main");

      // Use the Container class fetch() wrapper, not containerFetch().
      // Cloudflare notes that fetch() starts the container if needed and forwards
      // to defaultPort; it is also the right path for WebSockets.
      return await container.fetch(request);
    } catch (error) {
      console.error("Failed to route to Remark42 container", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return new Response(
        `Failed to start or reach Remark42 container: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { status: 500 }
      );
    }
  },
};