import type { PlainObject } from '../merge.ts';
import type { Environment, SiteConfig } from '../schema/site.ts';

/**
 * Content managed outside site.config.yaml, deep-merged over it before resolution.
 * Same shape as the matching parts of a site config, so every source composes the same way.
 */
export interface ContentOverlay {
  navigation?: PlainObject;
  footer?: PlainObject;
  seo?: PlainObject;
  pages?: Record<string, PlainObject>;
}

export interface ContentSource {
  readonly name: string;
  getOverlay(config: SiteConfig, env: Environment): Promise<ContentOverlay | undefined>;
}
