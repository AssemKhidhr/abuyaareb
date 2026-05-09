import { Container, getContainer } from "@cloudflare/containers";
import { env } from "cloudflare:workers";

export class Remark42Container extends Container {
  defaultPort = 8080;
  requiredPorts = [8080];
  sleepAfter = "10m";
  enableInternet = true;

  envVars = {
    REMARK_URL: "https://abuyaareb.org/remark42",
    SITE: "abuyaareb",
    AUTH_ANON: "true",
    STORE_BOLT_PATH: "/srv/var/db",
    BACKUP_PATH: "/srv/var/backup",
    BUCKET_NAME: "abuyaareb-remark42",

    SECRET: env.SECRET,
    R2_ENDPOINT: env.R2_ENDPOINT,
    AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY
  };

  override async fetch(request: Request): Promise<Response> {
    return this.containerFetch(request);
  }

  override onStart() {
    console.log("Remark42 container started");
  }

  override onStop(params: { exitCode?: number; reason?: string }) {
    console.log("Remark42 container stopped", params);
  }

  override onError(error: unknown) {
    console.error("Remark42 container error", error);
  }
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith("/remark42")) {
      return new Response("Not found", { status: 404 });
    }

    console.log("Routing request to Remark42 container", {
      path: url.pathname,
      hasSecret: Boolean(env.SECRET),
      hasR2Endpoint: Boolean(env.R2_ENDPOINT),
      hasAccessKey: Boolean(env.AWS_ACCESS_KEY_ID),
      hasSecretKey: Boolean(env.AWS_SECRET_ACCESS_KEY)
    });

    const container = getContainer(env.REMARK42_CONTAINER, "abuyaareb-remark42");

    return container.fetch(request);
  }
};