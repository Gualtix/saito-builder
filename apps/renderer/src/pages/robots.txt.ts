import type { APIRoute } from 'astro';
import { getSite } from '../site.ts';

export const GET: APIRoute = async () => {
  const site = await getSite();
  const indexable = site.env === 'production' && !site.seo.noindex;
  const body = indexable
    ? `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
