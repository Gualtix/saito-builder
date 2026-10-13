import { readFile } from 'node:fs/promises';
import { basename, resolve, sep } from 'node:path';
import { createClient } from '@sanity/client';
import { collectImageSources, loadResolvedSite, localContentSource, siteDir, siteToSanityDocuments } from '@saito/core';
import { registry } from '@saito/templates';
import type { Context } from './commands.ts';
import { bold, dim, green, yellow } from './output.ts';

export interface SeedOptions {
  dryRun?: boolean;
  /** Replace documents that already exist (discards edits made in Sanity). Default: only create missing ones. */
  overwrite?: boolean;
}

/**
 * Pushes each site's effective local content (template + site config + content files) and its images into Sanity.
 * Idempotent: documents have deterministic ids and Sanity de-duplicates identical image uploads.
 */
export async function seed(ctx: Context, siteIds: string[], options: SeedOptions): Promise<boolean> {
  const projectId = process.env.SANITY_PROJECT_ID;
  if (!projectId) throw new Error('Set SANITY_PROJECT_ID');
  const dataset = process.env.SANITY_DATASET || ctx.env;
  const token = process.env.SANITY_WRITE_TOKEN;
  if (!options.dryRun && !token) throw new Error('Set SANITY_WRITE_TOKEN (a token with Editor permission), or use --dry-run');

  const client =
    token && !options.dryRun
      ? createClient({ projectId, dataset, apiVersion: process.env.SANITY_API_VERSION || '2025-01-01', token, useCdn: false })
      : undefined;
  console.log(
    `${bold('Seeding')} ${projectId}/${dataset} ${dim(options.dryRun ? '(dry run)' : options.overwrite ? '(overwrite existing)' : '(create missing only)')}`,
  );

  const uploaded = new Map<string, string>(); // file path or URL → asset id, shared across sites
  let ok = true;

  for (const id of siteIds) {
    console.log(`\n${bold(`▸ ${id}`)}`);
    // Always read local content here, never Sanity: this is the local → Sanity direction.
    const site = await loadResolvedSite(id, { root: ctx.root, env: ctx.env, registry, contentSource: localContentSource(ctx.root) });

    const assets = new Map<string, string>();
    for (const src of collectImageSources(site)) {
      try {
        const image = await readImage(ctx.root, id, src);
        if (!client) {
          assets.set(src, 'image-dryrun-1x1-png');
          console.log(`  ${dim('image')} ${src} ${dim(`(${image.data.length} bytes)`)}`);
          continue;
        }
        let assetId = uploaded.get(image.key);
        if (!assetId) {
          assetId = (await client.assets.upload('image', image.data, { filename: image.filename }))._id;
          uploaded.set(image.key, assetId);
        }
        assets.set(src, assetId);
        console.log(`  ${green('↑')} ${src} ${dim(assetId)}`);
      } catch (error) {
        ok = false;
        console.log(`  ${yellow('!')} image ${src} skipped: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const documents = siteToSanityDocuments(site, assets);
    if (!client) {
      for (const doc of documents) {
        const sections = Array.isArray(doc.sections) ? dim(` · ${doc.sections.length} sections`) : '';
        console.log(`  ${dim(doc._type.padEnd(12))} ${doc._id}${sections}`);
      }
      continue;
    }

    const ids = documents.map((d) => d._id);
    const existing = new Set(await client.fetch<string[]>('*[_id in $ids]._id', { ids }));
    const tx = client.transaction();
    for (const doc of documents) {
      if (options.overwrite) tx.createOrReplace(doc);
      else tx.createIfNotExists(doc);
    }
    await tx.commit();

    const created = ids.filter((d) => !existing.has(d)).length;
    const kept = ids.length - created;
    console.log(
      `  ${green('✔')} ${created} created, ${kept} ${options.overwrite ? 'replaced' : 'already existed (kept; use --overwrite to replace)'}`,
    );
  }
  return ok;
}

async function readImage(root: string, siteId: string, src: string): Promise<{ data: Buffer; key: string; filename: string }> {
  if (/^https?:\/\//i.test(src)) {
    const response = await fetch(src, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`download failed (HTTP ${response.status})`);
    return { data: Buffer.from(await response.arrayBuffer()), key: src, filename: basename(new URL(src).pathname) || 'image' };
  }
  if (!src.startsWith('/')) throw new Error('expected a site path like /images/x.jpg or an http(s) URL');
  const publicDir = resolve(siteDir(root, siteId), 'public');
  const file = resolve(publicDir, `.${src}`);
  if (!file.startsWith(publicDir + sep)) throw new Error('path escapes the site public/ directory');
  return { data: await readFile(file), key: file, filename: basename(file) };
}
