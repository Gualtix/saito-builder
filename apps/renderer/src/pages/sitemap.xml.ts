import type { APIRoute } from 'astro';
import { escapeHtml } from '@saito/core';
import { getSite } from '../site.ts';

export const GET: APIRoute = async () => {
  const site = await getSite();
  const urls = site.pages
    .map((page) => `  <url><loc>${escapeHtml(`${site.url}${page.path}`)}</loc></url>`)
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
