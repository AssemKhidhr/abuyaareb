import { Container, getContainer } from "@cloudflare/containers";

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
    BUCKET_NAME: "abuyaareb-remark42"
  };
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith("/remark42")) {
      return new Response("Not found", { status: 404 });
    }

    const container = getContainer(env.REMARK42_CONTAINER, "abuyaareb-remark42");

    await container.startAndWaitForPorts({
      ports: [8080],
      startOptions: {
        envVars: {
          SECRET: env.SECRET,
          R2_ENDPOINT: env.R2_ENDPOINT,
          AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY,
          BUCKET_NAME: "abuyaareb-remark42",
          REMARK_URL: "https://abuyaareb.org/remark42",
          SITE: "abuyaareb",
          AUTH_ANON: "true",
          STORE_BOLT_PATH: "/srv/var/db",
          BACKUP_PATH: "/srv/var/backup"
        }
      },
      cancellationOptions: {
        portReadyTimeoutMS: 60_000
      }
    });

    return container.fetch(request);
  }
};