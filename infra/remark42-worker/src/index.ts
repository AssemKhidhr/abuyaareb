import { Container } from "@cloudflare/containers";

export class Remark42Container extends Container {
  defaultPort = 8080;
  sleepAfter = "10m";

  envVars = {
    REMARK_URL: "https://abuyaareb.org/remark42",
    SITE: "abuyaareb",
    AUTH_ANON: "true",
    STORE_BOLT_PATH: "/srv/var/db",
    BACKUP_PATH: "/srv/var/backup"
  };
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith("/remark42")) {
      return new Response("Not found", { status: 404 });
    }

    // One fixed container identity for the whole comments database.
    // Do not route by article URL, or you risk multiple stores.
    const id = env.REMARK42_CONTAINER.idFromName("abuyaareb-remark42");
    const stub = env.REMARK42_CONTAINER.get(id);

    return stub.fetch(request);
  }
};