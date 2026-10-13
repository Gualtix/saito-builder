import { relative } from 'node:path';
import { contentSourceFromEnv, type ContentSource } from './content/index.ts';
import { loadSiteConfig, parseSiteConfig, siteConfigPath } from './loader.ts';
import { deepMerge } from './merge.ts';
import type { TemplateRegistry } from './registry.ts';
import { resolveSite, type ResolvedSite } from './resolve.ts';
import type { Environment } from './schema/site.ts';

export interface LoadSiteOptions {
  root: string;
  env: Environment;
  registry: TemplateRegistry;
  /** Defaults to the source selected by SAITO_CONTENT_SOURCE. */
  contentSource?: ContentSource;
}

/** site.config.yaml + content overlay + template → validated ResolvedSite. */
export async function loadResolvedSite(siteId: string, options: LoadSiteOptions): Promise<ResolvedSite> {
  const config = loadSiteConfig(options.root, siteId);
  const source = options.contentSource ?? contentSourceFromEnv(options.root);
  const overlay = await source.getOverlay(config, options.env);
  const merged = overlay
    ? parseSiteConfig(
        deepMerge(config, overlay),
        `${relative(options.root, siteConfigPath(options.root, siteId))} (with ${source.name} content)`,
      )
    : config;
  const template = options.registry.resolve(merged.template);
  return resolveSite(merged, template.manifest, { env: options.env });
}
