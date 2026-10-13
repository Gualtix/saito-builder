import { join } from 'node:path';
import { listYamlFiles, readYamlFile, siteDir } from '../loader.ts';
import { isPlainObject, type PlainObject } from '../merge.ts';
import type { ContentOverlay, ContentSource } from './types.ts';

/**
 * Reads page content from `sites/<id>/content/pages/<slug>.yaml` (nested folders → nested slugs).
 * Keeps editorial copy out of site.config.yaml while using exactly the page-override format.
 */
export function localContentSource(root: string): ContentSource {
  return {
    name: 'local',
    async getOverlay(config) {
      const pagesDir = join(siteDir(root, config.id), 'content', 'pages');
      const pages: Record<string, PlainObject> = {};
      for (const file of listYamlFiles(pagesDir)) {
        const slug = file.replace(/\.ya?ml$/, '');
        const data = readYamlFile(join(pagesDir, file));
        if (!isPlainObject(data)) throw new Error(`${join(pagesDir, file)} must contain a YAML mapping`);
        pages[slug] = data;
      }
      const overlay: ContentOverlay = {};
      if (Object.keys(pages).length > 0) overlay.pages = pages;
      return overlay;
    },
  };
}
