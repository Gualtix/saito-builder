import { describe, expect, it } from 'vitest';
import { registry } from '@saito/templates';
import {
  collectImageSources,
  composeContentSources,
  findProjectRoot,
  imageUrl,
  isPlainObject,
  listSiteIds,
  loadResolvedSite,
  localContentSource,
  sanityToOverlay,
  siteToSanityDocuments,
  type ContentSource,
  type SanityDocument,
} from '../src/index.ts';

const root = findProjectRoot(import.meta.dirname);
const sanity = { projectId: 'proj', dataset: 'production' };

/** What the GROQ query in content/sanity.ts would return for these documents. */
function asQueryResult(docs: SanityDocument[]) {
  const settings = docs.find((d) => d._type === 'siteSettings')!;
  return {
    settings: { navigation: settings.navigation, footer: settings.footer, seo: settings.seo } as Record<string, unknown>,
    pages: docs
      .filter((d) => d._type === 'page')
      .map((d) => ({
        slug: (d.slug as { current: string }).current,
        title: d.title as string,
        description: d.description as string,
        enabled: d.enabled as boolean,
        sections: d.sections as Record<string, unknown>[],
      })),
  };
}

describe('seed round trip (local → Sanity documents → overlay → site)', () => {
  it.each(listSiteIds(root))('%s renders identically from seeded Sanity content', async (siteId) => {
    const local = localContentSource(root);
    const fromLocal = await loadResolvedSite(siteId, { root, env: 'production', registry, contentSource: local });

    const sources = collectImageSources(fromLocal);
    const assets = new Map(sources.map((src, i) => [src, `image-h${i}-800x600-svg`]));
    const docs = siteToSanityDocuments(fromLocal, assets);

    for (const doc of docs) expect(doc._id).not.toContain('.');

    const fakeSanity: ContentSource = { name: 'sanity', getOverlay: async () => sanityToOverlay(asQueryResult(docs), sanity) };
    const fromSanity = await loadResolvedSite(siteId, {
      root,
      env: 'production',
      registry,
      contentSource: composeContentSources(local, fakeSanity),
    });

    // Images come back as Sanity CDN URLs with dimensions; map them back to compare everything else exactly.
    const urlToSrc = new Map([...assets].map(([src, ref]) => [imageUrl(ref, sanity), src]));
    const canonical = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(canonical);
      if (!isPlainObject(value)) return value;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) out[k] = canonical(v);
      if (typeof out.src === 'string' && urlToSrc.has(out.src)) {
        out.src = urlToSrc.get(out.src);
        delete out.width;
        delete out.height;
      }
      return out;
    };
    expect(canonical(fromSanity)).toEqual(canonical(fromLocal));
  });

  it('collects section images and leaves non-image src fields alone', async () => {
    const site = await loadResolvedSite('bella-trattoria', { root, env: 'production', registry, contentSource: localContentSource(root) });
    expect(collectImageSources(site).sort()).toEqual(['/images/dish-1.svg', '/images/dish-2.svg', '/images/dish-3.svg', '/images/hero.svg']);
  });

  it('turns images into asset references with keys, and drops images that were not uploaded', async () => {
    const site = await loadResolvedSite('bella-trattoria', { root, env: 'production', registry, contentSource: localContentSource(root) });
    const docs = siteToSanityDocuments(site, new Map([['/images/dish-1.svg', 'image-a1-800x600-svg']]));
    const index = docs.find((d) => d._id === 'saito-bella-trattoria-page-index')!;
    const gallery = (index.sections as Array<Record<string, unknown>>).find((s) => s.sectionId === 'gallery')!;
    expect(gallery).toMatchObject({ _key: 'gallery', _type: 'gallery' });
    expect(gallery.images).toEqual([
      { _key: 'k0', _type: 'image', asset: { _type: 'reference', _ref: 'image-a1-800x600-svg' }, alt: 'Tagliatelle al ragù', caption: 'Tagliatelle al ragù' },
    ]);
  });
});
