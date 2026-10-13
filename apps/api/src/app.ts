import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import rateLimit from '@fastify/rate-limit';
import { environments, listSiteIds, loadSiteConfig, type Environment, type SiteConfig } from '@saito/core';
import Fastify, { type FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { SubmissionSink } from './sink.ts';

export interface AppOptions {
  root: string;
  sink: SubmissionSink;
  env: Environment;
  /** Forwards submissions to a site's webhook. Injected so tests never hit the network. */
  forward?: (url: string, payload: unknown) => Promise<void>;
  logger?: boolean;
}

const contactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  message: z.string().trim().min(1).max(5000),
  page: z.string().max(500).optional(),
  // Honeypot: real visitors never see this field.
  company_website: z.string().optional(),
});

async function defaultForward(url: string, payload: unknown): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`Webhook responded with ${response.status}`);
}

/** Origins a site's pages are served from, for the target environment(s). */
function siteOrigins(config: SiteConfig, env: Environment): Set<string> {
  const origins = new Set<string>();
  for (const name of environments) {
    const url = config.environments[name]?.url;
    if (url) origins.add(new URL(url).origin);
  }
  if (env !== 'production') {
    origins.add('http://localhost:4321');
    origins.add('http://127.0.0.1:4321');
  }
  return origins;
}

export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false, bodyLimit: 32 * 1024, trustProxy: true });
  const forward = options.forward ?? defaultForward;

  // The site registry is the same set of configs the builder uses; only sites with forms enabled are served.
  const sites = new Map<string, { config: SiteConfig; origins: Set<string> }>();
  for (const id of listSiteIds(options.root)) {
    const config = loadSiteConfig(options.root, id);
    if (config.integrations.forms) sites.set(id, { config, origins: siteOrigins(config, options.env) });
  }
  const allOrigins = new Set([...sites.values()].flatMap((s) => [...s.origins]));

  await app.register(cors, {
    origin: (origin, cb) => cb(null, !origin || allOrigins.has(origin)),
    methods: ['POST'],
  });
  await app.register(formbody);
  await app.register(rateLimit, { global: false });

  app.get('/health', async () => ({ ok: true, sites: sites.size }));

  app.post<{ Params: { siteId: string } }>(
    '/v1/sites/:siteId/contact',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const site = sites.get(request.params.siteId);
      if (!site) return reply.code(404).send({ ok: false, error: 'Unknown site' });

      const origin = request.headers.origin;
      if (origin && !site.origins.has(origin)) return reply.code(403).send({ ok: false, error: 'Origin not allowed for this site' });

      const parsed = contactSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ ok: false, error: 'Invalid submission', issues: parsed.error.issues.map((i) => i.path.join('.')) });
      }

      const wantsHtml = !(request.headers.accept ?? '').includes('application/json');
      const { company_website: honeypot, ...data } = parsed.data;
      // Pretend success to bots so they do not retry.
      if (!honeypot) {
        const submission = {
          siteId: site.config.id,
          tenant: site.config.tenant,
          kind: 'contact' as const,
          receivedAt: new Date().toISOString(),
          data,
        };
        await options.sink.save(submission);
        const webhook = site.config.integrations.forms?.webhookUrl;
        if (webhook) {
          forward(webhook, submission).catch((error: unknown) => request.log.error({ err: error, site: site.config.id }, 'webhook forwarding failed'));
        }
      }

      if (wantsHtml) {
        // Non-JS form post: send the visitor back to the page on the site's own domain (never an arbitrary URL).
        const base = origin && site.origins.has(origin) ? origin : (site.config.environments[options.env]?.url ?? '').replace(/\/+$/, '');
        const page = data.page?.startsWith('/') && !data.page.startsWith('//') ? data.page : '/';
        return reply.redirect(`${base}${page}?sent=1#${encodeURIComponent('contact')}`, 303);
      }
      return reply.code(202).send({ ok: true });
    },
  );

  return app;
}
