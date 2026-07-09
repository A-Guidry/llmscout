import Fastify from "fastify";
import { scan, FetchError, gradeFor } from "../core/index.js";
import { landingPage, reportPage, methodologyPage, errorPage } from "./html.js";

interface RecentScan {
  site: string;
  grade: string;
}

export async function startServer(opts: { port: number; host: string }) {
  const app = Fastify({ logger: false });
  const recent: RecentScan[] = [];
  // naive in-memory rate limit: per-IP scans per minute
  const hits = new Map<string, { count: number; reset: number }>();
  const LIMIT = 10;

  function rateLimited(ip: string): boolean {
    const now = Date.now();
    const h = hits.get(ip);
    if (!h || now > h.reset) {
      hits.set(ip, { count: 1, reset: now + 60_000 });
      return false;
    }
    h.count++;
    return h.count > LIMIT;
  }

  app.get("/", async (_req, reply) => {
    reply.type("text/html").send(landingPage(recent.slice(0, 5)));
  });

  app.get("/methodology", async (_req, reply) => {
    reply.type("text/html").send(methodologyPage());
  });

  app.get<{ Querystring: { url?: string } }>("/scan", async (req, reply) => {
    const url = req.query.url;
    if (!url) return reply.redirect("/");
    if (rateLimited(req.ip))
      return reply
        .code(429)
        .type("text/html")
        .send(
          errorPage(
            "Too many scans from your address — try again in a minute.",
          ),
        );
    try {
      const result = await scan(url);
      const host = new URL(result.finalUrl).hostname;
      if (!recent.some((r) => r.site === host)) {
        recent.unshift({ site: host, grade: gradeFor(result.score).grade });
        if (recent.length > 10) recent.pop();
      }
      reply.type("text/html").send(reportPage(result));
    } catch (err) {
      const { message, hint } = describeError(err);
      reply
        .code(err instanceof FetchError ? 422 : 500)
        .type("text/html")
        .send(errorPage(message, hint));
    }
  });

  app.get<{ Querystring: { url?: string } }>(
    "/scan.json",
    async (req, reply) => {
      const url = req.query.url;
      if (!url) return reply.code(400).send({ error: "missing ?url=" });
      if (rateLimited(req.ip))
        return reply.code(429).send({ error: "rate limited" });
      try {
        reply.send(await scan(url));
      } catch (err) {
        const { message } = describeError(err);
        reply
          .code(err instanceof FetchError ? 422 : 500)
          .send({ error: message });
      }
    },
  );

  app.get("/healthz", async (_req, reply) => reply.send({ ok: true }));

  await app.listen({ port: opts.port, host: opts.host });
  console.log(`\n  LLMScout web UI → http://${opts.host}:${opts.port}\n`);
  return app;
}

function describeError(err: unknown): { message: string; hint?: string } {
  if (err instanceof FetchError) {
    const hints: Record<string, string> = {
      "bad-url": "Pass a full URL like https://example.com/page.",
      timeout:
        "The site was slow to respond — it may be blocking bots, which is itself a finding.",
      unreachable: "Check the domain spelling, or the site may be down.",
      "http-error":
        "The page returned an error status — AI crawlers would see the same thing.",
    };
    return { message: err.message, hint: hints[err.kind] };
  }
  return { message: err instanceof Error ? err.message : "Unexpected error" };
}
