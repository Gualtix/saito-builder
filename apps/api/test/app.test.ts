import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.ts';
import { memorySink } from '../src/sink.ts';

function makeProject(): string {
  const root = mkdtempSync(join(tmpdir(), 'saito-api-'));
  writeFileSync(join(root, 'package.json'), '{}');
  const site = (id: string, forms: string) => {
    mkdirSync(join(root, 'sites', id), { recursive: true });
    writeFileSync(
      join(root, 'sites', id, 'site.config.yaml'),
      `id: ${id}\ntenant: t-${id}\nname: ${id}\ntemplate: landing@1\nenvironments:\n  production:\n    url: https://${id}.example\n${forms}`,
    );
  };
  site('with-forms', 'integrations:\n  forms:\n    endpoint: https://api.example\n    webhookUrl: https://hooks.example/x\n');
  site('no-forms', '');
  return root;
}

describe('contact API', () => {
  const sink = memorySink();
  const forward = vi.fn(async () => {});
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ root: makeProject(), sink, env: 'production', forward });
  });
  afterAll(() => app.close());

  const valid = { name: 'Ada', email: 'ada@example.com', message: 'Hello', page: '/contact/' };
  const json = { accept: 'application/json', origin: 'https://with-forms.example' };

  it('accepts a valid submission, stores it per tenant and forwards it', async () => {
    const res = await app.inject({ method: 'POST', url: '/v1/sites/with-forms/contact', headers: json, payload: valid });
    expect(res.statusCode).toBe(202);
    expect(sink.items.at(-1)).toMatchObject({ siteId: 'with-forms', tenant: 't-with-forms', data: { email: 'ada@example.com' } });
    expect(forward).toHaveBeenCalledWith('https://hooks.example/x', expect.objectContaining({ siteId: 'with-forms' }));
  });

  it('rejects unknown sites and sites without forms', async () => {
    for (const id of ['nope', 'no-forms']) {
      const res = await app.inject({ method: 'POST', url: `/v1/sites/${id}/contact`, headers: json, payload: valid });
      expect(res.statusCode).toBe(404);
    }
  });

  it("rejects origins that are not the site's own", async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/sites/with-forms/contact',
      headers: { ...json, origin: 'https://evil.example' },
      payload: valid,
    });
    expect(res.statusCode).toBe(403);
  });

  it('validates input', async () => {
    const res = await app.inject({ method: 'POST', url: '/v1/sites/with-forms/contact', headers: json, payload: { ...valid, email: 'nope' } });
    expect(res.statusCode).toBe(400);
  });

  it('silently drops honeypot submissions', async () => {
    const before = sink.items.length;
    const res = await app.inject({
      method: 'POST',
      url: '/v1/sites/with-forms/contact',
      headers: json,
      payload: { ...valid, company_website: 'spam.example' },
    });
    expect(res.statusCode).toBe(202);
    expect(sink.items.length).toBe(before);
  });

  it('redirects non-JS form posts back to the page on the site domain only', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/sites/with-forms/contact',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: new URLSearchParams({ ...valid, page: '//evil.example/' }).toString(),
    });
    expect(res.statusCode).toBe(303);
    expect(res.headers.location).toBe('https://with-forms.example/?sent=1#contact');
  });
});
