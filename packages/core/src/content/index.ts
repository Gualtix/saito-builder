import { deepMerge } from '../merge.ts';
import { localContentSource } from './local.ts';
import { sanityContentSource } from './sanity.ts';
import type { ContentOverlay, ContentSource } from './types.ts';

export type { ContentOverlay, ContentSource } from './types.ts';
export { localContentSource } from './local.ts';
export { sanityContentSource, sanityToOverlay, imageUrl } from './sanity.ts';

/** Applies sources in order; later sources win. */
export function composeContentSources(...sources: ContentSource[]): ContentSource {
  return {
    name: sources.map((s) => s.name).join('+'),
    async getOverlay(config, env) {
      let overlay: ContentOverlay = {};
      for (const source of sources) overlay = deepMerge(overlay, (await source.getOverlay(config, env)) ?? {});
      return overlay;
    },
  };
}

/**
 * SAITO_CONTENT_SOURCE=local  → local content files only (default)
 * SAITO_CONTENT_SOURCE=sanity → local content files, then Sanity on top
 */
export function contentSourceFromEnv(root: string, env: NodeJS.ProcessEnv = process.env): ContentSource {
  const local = localContentSource(root);
  const kind = env.SAITO_CONTENT_SOURCE ?? 'local';
  if (kind === 'local') return local;
  if (kind === 'sanity') {
    if (!env.SANITY_PROJECT_ID) throw new Error('SAITO_CONTENT_SOURCE=sanity requires SANITY_PROJECT_ID');
    return composeContentSources(
      local,
      sanityContentSource({
        projectId: env.SANITY_PROJECT_ID,
        dataset: env.SANITY_DATASET || undefined,
        apiVersion: env.SANITY_API_VERSION || undefined,
        token: env.SANITY_READ_TOKEN || undefined,
      }),
    );
  }
  throw new Error(`Unknown SAITO_CONTENT_SOURCE "${kind}" (expected "local" or "sanity")`);
}
