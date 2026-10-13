import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  SiteConfigError,
  compareVersions,
  listSiteIds,
  loadResolvedSite,
  loadSiteConfig,
  parseSiteConfig,
  parseTemplateRef,
  readYamlFile,
  resolveSite,
  sectionTypes,
  siteConfigPath,
  siteDir,
  slugSchema,
  type Environment,
  type SiteConfigInput,
} from '@saito/core';
import { registry } from '@saito/templates';
import { parseDocument } from 'yaml';
import { outputDir, runAstro, writeEdgeArtifacts } from './build.ts';
import { bold, cyan, dim, green, red, table, yellow } from './output.ts';
import { scaffoldSiteConfig } from './scaffold.ts';

export interface Context {
  root: string;
  env: Environment;
}

function selectSites(root: string, args: { sites: string[]; all?: boolean; tenant?: string }): string[] {
  if (args.sites.length > 0) return args.sites;
  const ids = listSiteIds(root);
  if (args.tenant) return ids.filter((id) => loadSiteConfig(root, id).tenant === args.tenant);
  if (args.all) return ids;
  throw new Error('Name one or more sites, or pass --all or --tenant <tenant>');
}

export function sites(ctx: Context, opts: { tenant?: string; json?: boolean }): void {
  const configs = listSiteIds(ctx.root)
    .map((id) => loadSiteConfig(ctx.root, id))
    .filter((c) => !opts.tenant || c.tenant === opts.tenant);
  if (opts.json) {
    console.log(JSON.stringify(configs.map(({ id, tenant, name, template }) => ({ id, tenant, name, template })), null, 2));
    return;
  }
  if (configs.length === 0) return console.log('No sites yet. Create one with `npm run saito -- create <id> --template <template>`');
  console.log(
    table([
      [bold('SITE'), bold('TENANT'), bold('NAME'), bold('TEMPLATE'), bold('RESOLVES TO')],
      ...configs.map((c) => [c.id, c.tenant, c.name, c.template, safeResolveVersion(c.template)]),
    ]),
  );
}

function safeResolveVersion(ref: string): string {
  try {
    return registry.resolve(ref).manifest.version;
  } catch {
    return red('unresolvable');
  }
}

export function templates(_ctx: Context, opts: { id?: string; json?: boolean }): void {
  if (opts.id) {
    const versions = registry.versions(opts.id);
    if (versions.length === 0) throw new Error(`Unknown template "${opts.id}"`);
    const latest = versions.at(-1)!.manifest;
    if (opts.json) return console.log(JSON.stringify(latest, null, 2));
    console.log(`${bold(latest.name)} ${dim(`(${latest.id})`)}\n${latest.description}\n`);
    console.log(`Versions: ${versions.map((v) => v.manifest.version).join(', ')}`);
    console.log(`Website types: ${latest.websiteTypes.join(', ')}\n`);
    for (const page of latest.pages) {
      console.log(`${cyan(page.slug)} ${dim(`(${page.title})`)}`);
      for (const section of page.sections) console.log(`  ${section.id.padEnd(16)} ${dim(section.type)}`);
    }
    return;
  }

  const catalog = registry.list().map(({ manifest: m }) => ({
    id: m.id,
    name: m.name,
    latest: m.version,
    versions: registry.versions(m.id).map((v) => v.manifest.version),
    websiteTypes: m.websiteTypes,
    tags: m.tags,
    description: m.description,
  }));
  if (opts.json) return console.log(JSON.stringify(catalog, null, 2));
  console.log(
    table([
      [bold('TEMPLATE'), bold('LATEST'), bold('VERSIONS'), bold('WEBSITE TYPES')],
      ...catalog.map((t) => [t.id, t.latest, t.versions.join(', '), t.websiteTypes.join(', ')]),
    ]),
  );
  console.log(dim(`\nSection types available to every template: ${sectionTypes.join(', ')}`));
}

export function create(ctx: Context, opts: { id?: string; template?: string; tenant?: string; name?: string; url?: string }): void {
  const { id, template: ref, tenant } = opts;
  if (!id || !ref || !tenant) throw new Error('Usage: saito create <site-id> --template <template>[@range] --tenant <tenant> [--name "Name"] [--url https://…]');
  for (const [label, value] of [['site id', id], ['tenant', tenant]] as const) {
    const check = slugSchema.safeParse(value);
    if (!check.success) throw new Error(`Invalid ${label} "${value}": ${check.error.issues[0]?.message}`);
  }
  const path = siteConfigPath(ctx.root, id);
  if (existsSync(path)) throw new Error(`Site "${id}" already exists (${relative(ctx.root, path)})`);

  const template = registry.resolve(ref.includes('@') ? ref : `${ref}@latest`).manifest;
  const name = opts.name ?? id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const yaml = scaffoldSiteConfig({ id, tenant, name, productionUrl: opts.url, template });

  // Validate before writing so a bad scaffold never lands on disk.
  parseSiteConfig(parseDocument(yaml).toJS(), 'generated site config');

  mkdirSync(join(siteDir(ctx.root, id), 'public'), { recursive: true });
  mkdirSync(join(siteDir(ctx.root, id), 'content', 'pages'), { recursive: true });
  writeFileSync(path, yaml);
  console.log(`${green('✔')} Created ${bold(id)} from ${template.id}@${template.version}`);
  console.log(dim(`  ${relative(ctx.root, path)}\n  Next: npm run saito -- dev ${id}`));
}

export async function validate(ctx: Context, opts: { sites: string[]; all?: boolean; tenant?: string }): Promise<boolean> {
  let ok = true;
  for (const id of selectSites(ctx.root, { ...opts, all: opts.all ?? opts.sites.length === 0 })) {
    try {
      const site = await loadResolvedSite(id, { root: ctx.root, env: ctx.env, registry });
      const sections = site.pages.reduce((n, p) => n + p.sections.length, 0);
      console.log(`${green('✔')} ${id} ${dim(`${site.template.id}@${site.template.version} · ${site.pages.length} pages · ${sections} sections`)}`);
    } catch (error) {
      ok = false;
      console.log(`${red('✖')} ${id}\n${indentMessage(error)}`);
    }
  }
  return ok;
}

export async function build(ctx: Context, opts: { sites: string[]; all?: boolean; tenant?: string }): Promise<boolean> {
  const ids = selectSites(ctx.root, opts);
  const failures: string[] = [];
  for (const id of ids) {
    console.log(`\n${bold(`▸ Building ${id}`)} ${dim(`(${ctx.env})`)}`);
    try {
      // Resolve first: config errors are reported clearly instead of as an Astro stack trace.
      const site = await loadResolvedSite(id, { root: ctx.root, env: ctx.env, registry });
      const code = await runAstro(ctx.root, 'build', id, ctx.env);
      if (code !== 0) throw new Error(`astro build exited with code ${code}`);
      const dir = outputDir(ctx.root, ctx.env, id);
      writeEdgeArtifacts(dir, site);
      console.log(`${green('✔')} ${id} → ${relative(ctx.root, dir)}`);
    } catch (error) {
      failures.push(id);
      console.log(`${red('✖')} ${id}\n${indentMessage(error)}`);
    }
  }
  console.log(`\n${ids.length - failures.length}/${ids.length} sites built${failures.length ? `, failed: ${failures.join(', ')}` : ''}`);
  return failures.length === 0;
}

export async function dev(ctx: Context, opts: { sites: string[] }): Promise<boolean> {
  const [id] = opts.sites;
  if (!id) throw new Error('Usage: saito dev <site-id>');
  await loadResolvedSite(id, { root: ctx.root, env: ctx.env, registry });
  return (await runAstro(ctx.root, 'dev', id, ctx.env)) === 0;
}

export function outdated(ctx: Context): void {
  const rows = listSiteIds(ctx.root).flatMap((id) => {
    const config = loadSiteConfig(ctx.root, id);
    const { id: templateId } = parseTemplateRef(config.template);
    const current = safeResolveVersion(config.template);
    const latest = registry.latest(templateId)?.manifest.version;
    if (!latest || current === latest) return [];
    return [[id, config.template, current, yellow(latest)]];
  });
  if (rows.length === 0) return console.log(`${green('✔')} All sites are on the latest major version of their template.`);
  console.log(table([[bold('SITE'), bold('PINNED'), bold('CURRENT'), bold('LATEST')], ...rows]));
  console.log(dim('\nUpgrade with: npm run saito -- upgrade <site> [--to <version>] [--dry-run]'));
}

/**
 * Moves a site to a new template major: runs migrations over the site's overrides
 * (so customisations survive), re-pins the template, and validates the result before writing.
 */
export async function upgrade(ctx: Context, opts: { sites: string[]; to?: string; dryRun?: boolean }): Promise<boolean> {
  const [id] = opts.sites;
  if (!id) throw new Error('Usage: saito upgrade <site-id> [--to <version>] [--dry-run]');
  const path = siteConfigPath(ctx.root, id);
  const original = readYamlFile(path) as SiteConfigInput;
  const config = loadSiteConfig(ctx.root, id);
  const { id: templateId } = parseTemplateRef(config.template);
  const current = registry.resolve(config.template).manifest.version;
  const target = opts.to ? registry.resolve(`${templateId}@${opts.to}`).manifest.version : registry.latest(templateId)!.manifest.version;

  if (compareVersions(target, current) <= 0) {
    console.log(`${green('✔')} ${id} already uses ${templateId}@${current}`);
    return true;
  }

  const steps = registry.migrationPath(templateId, current, target);
  let migrated = structuredClone(original);
  for (const step of steps) {
    console.log(`${cyan('↻')} v${step.from} → v${step.to}: ${step.notes}`);
    migrated = step.migrate(migrated);
  }
  const targetMajor = target.split('.')[0];
  migrated.template = `${templateId}@${targetMajor}`;

  // Prove the upgraded site still resolves before touching the file.
  const parsed = parseSiteConfig(migrated, `${id} after upgrade`);
  resolveSite(parsed, registry.resolve(migrated.template).manifest, { env: ctx.env });

  const text = readFileSync(path, 'utf8');
  const doc = parseDocument(text);
  const contentChanged = JSON.stringify({ ...migrated, template: undefined }) !== JSON.stringify({ ...original, template: undefined });
  if (contentChanged) doc.contents = doc.createNode(migrated) as typeof doc.contents;
  else doc.set('template', migrated.template);

  if (opts.dryRun) {
    console.log(dim('--- dry run: resulting site.config.yaml ---'));
    console.log(doc.toString());
    return true;
  }
  writeFileSync(path, doc.toString());
  console.log(`${green('✔')} ${id}: ${templateId} ${current} → ${target}${contentChanged ? dim(' (overrides migrated; YAML comments were not preserved)') : ''}`);
  return true;
}

/**
 * Sites affected by a set of changed files (for CI matrices):
 *  - sites/<id>/**                         → that site
 *  - packages/templates/src/<template>/**  → sites using that template
 *  - any other platform code               → every site
 *  - docs, markdown, the studio            → nothing
 */
export function affected(ctx: Context, changedFiles: string[]): string[] {
  const ids = listSiteIds(ctx.root);
  const result = new Set<string>();
  for (const file of changedFiles.map((f) => f.trim()).filter(Boolean)) {
    if (/^(docs\/|apps\/studio\/)|\.md$/.test(file)) continue;
    const site = /^sites\/([^/]+)\//.exec(file);
    if (site) {
      if (ids.includes(site[1]!)) result.add(site[1]!);
      continue;
    }
    const template = /^packages\/templates\/src\/([^/]+)\//.exec(file);
    if (template) {
      for (const id of ids) if (parseTemplateRef(loadSiteConfig(ctx.root, id).template).id === template[1]) result.add(id);
      continue;
    }
    return ids;
  }
  return [...result].sort();
}

function indentMessage(error: unknown): string {
  const message = error instanceof SiteConfigError || error instanceof Error ? error.message : String(error);
  return message
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n');
}
