import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { SiteConfigError, zodIssues } from './errors.ts';
import { environments, siteConfigSchema, type Environment, type SiteConfig } from './schema/site.ts';

export const SITES_DIR = 'sites';
export const SITE_CONFIG_FILE = 'site.config.yaml';

/** Locates the repository root: $SAITO_ROOT, or the nearest ancestor containing a `sites/` directory and package.json. */
export function findProjectRoot(start = process.cwd()): string {
  if (process.env.SAITO_ROOT) return resolve(process.env.SAITO_ROOT);
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, SITES_DIR)) && existsSync(join(dir, 'package.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`Could not find the Saito project root from ${start} (set SAITO_ROOT)`);
    dir = parent;
  }
}

export function siteDir(root: string, siteId: string): string {
  return join(root, SITES_DIR, siteId);
}

export function siteConfigPath(root: string, siteId: string): string {
  return join(siteDir(root, siteId), SITE_CONFIG_FILE);
}

export function listSiteIds(root: string): string[] {
  const dir = join(root, SITES_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => existsSync(join(dir, name, SITE_CONFIG_FILE)))
    .sort();
}

export function readYamlFile(path: string): unknown {
  return parse(readFileSync(path, 'utf8')) ?? {};
}

export function parseSiteConfig(raw: unknown, subject: string): SiteConfig {
  const parsed = siteConfigSchema.safeParse(raw);
  if (!parsed.success) throw new SiteConfigError(subject, zodIssues(parsed.error));
  return parsed.data;
}

export function loadSiteConfig(root: string, siteId: string): SiteConfig {
  const path = siteConfigPath(root, siteId);
  if (!existsSync(path)) throw new Error(`Site "${siteId}" not found (expected ${relative(root, path)})`);
  const config = parseSiteConfig(readYamlFile(path), relative(root, path));
  if (config.id !== siteId) {
    throw new SiteConfigError(relative(root, path), [{ path: 'id', message: `must match its directory name "${siteId}"` }]);
  }
  return config;
}

/** Recursively lists `*.yaml` files below `dir`, returned as paths relative to it. */
export function listYamlFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  const walk = (current: string) => {
    for (const name of readdirSync(current).sort()) {
      const full = join(current, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith('.yaml') || name.endsWith('.yml')) out.push(relative(dir, full).split(sep).join('/'));
    }
  };
  walk(dir);
  return out;
}

export function environmentFromProcess(): Environment {
  const value = process.env.SAITO_ENV ?? 'development';
  if (!(environments as readonly string[]).includes(value)) {
    throw new Error(`SAITO_ENV must be one of ${environments.join(', ')} (got "${value}")`);
  }
  return value as Environment;
}
