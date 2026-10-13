import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { environmentFromProcess, findProjectRoot, listSiteIds, loadSiteConfig, siteDir, siteUrl } from '@saito/core';
import { defineConfig } from 'astro/config';

/**
 * One renderer, many sites: SAITO_SITE picks the site, SAITO_ENV the environment.
 * Each site gets its own public/ directory (media, favicon) and output folder.
 */
const root = findProjectRoot(import.meta.dirname);
// `astro check` only type-checks, so any site will do.
const siteId = process.env.SAITO_SITE ?? (process.argv.includes('check') ? listSiteIds(root)[0] : undefined);
if (!siteId) throw new Error('Set SAITO_SITE to the site to render, e.g. `npm run saito -- build acme-corp`');
process.env.SAITO_SITE = siteId;

const env = environmentFromProcess();
const config = loadSiteConfig(root, siteId);
const publicDir = join(siteDir(root, siteId), 'public');

export default defineConfig({
  site: siteUrl(config, env),
  output: 'static',
  trailingSlash: 'ignore',
  publicDir: existsSync(publicDir) ? publicDir : resolve(import.meta.dirname, 'public'),
  outDir: process.env.SAITO_OUT_DIR ?? join(root, 'dist', env, siteId),
  cacheDir: join(import.meta.dirname, 'node_modules', '.astro', siteId),
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()],
    ssr: { noExternal: [/^@saito\//] },
  },
});
