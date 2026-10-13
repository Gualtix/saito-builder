import { isPlainObject, type PlainObject } from '../merge.ts';
import type { ResolvedSite } from '../resolve.ts';

/**
 * Local → Sanity conversion: the inverse of `sanityToOverlay`.
 * Used by `saito seed` to push a site's effective content (template + local overrides) into the CMS
 * so editors start from what the site currently shows.
 */

export interface SanityDocument {
  _id: string;
  _type: 'page' | 'siteSettings';
  [field: string]: unknown;
}

/** Image-valued fields in the section schemas (single images, and arrays of images). */
const IMAGE_FIELDS = new Set(['image', 'avatar', 'photo']);
const IMAGE_LIST_FIELDS = new Set(['images']);

/** Ids contain no "." so documents stay readable without a token (dotted ids are private in Sanity). */
export function sanityDocumentId(siteId: string, kind: 'settings'): string;
export function sanityDocumentId(siteId: string, kind: 'page', slug: string): string;
export function sanityDocumentId(siteId: string, kind: 'settings' | 'page', slug?: string): string {
  return kind === 'settings' ? `saito-${siteId}-settings` : `saito-${siteId}-page-${slug!.replace(/\//g, '--')}`;
}

/** Every image `src` in the site's sections that must exist as a Sanity asset before seeding. */
export function collectImageSources(site: ResolvedSite): string[] {
  const found = new Set<string>();
  const visit = (value: unknown, key?: string): void => {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (key && IMAGE_LIST_FIELDS.has(key) && isPlainObject(item) && typeof item.src === 'string') found.add(item.src);
        else visit(item);
      }
    } else if (isPlainObject(value)) {
      if (key && IMAGE_FIELDS.has(key) && typeof value.src === 'string') found.add(value.src);
      else for (const [k, v] of Object.entries(value)) visit(v, k);
    }
  };
  for (const page of site.pages) visit(page.sections);
  return [...found];
}

/**
 * Builds the Sanity documents for a site.
 * @param assets image `src` → uploaded Sanity asset id (`image-<hash>-<w>x<h>-<ext>`). Images without an asset are dropped.
 */
export function siteToSanityDocuments(site: ResolvedSite, assets: ReadonlyMap<string, string>): SanityDocument[] {
  const convert = (value: unknown, key?: string): unknown => {
    if (Array.isArray(value)) {
      const isImageList = key !== undefined && IMAGE_LIST_FIELDS.has(key);
      return value
        .map((item, i) => {
          const converted = isImageList ? toImage(item, assets) : convert(item);
          // Sanity needs a unique _key on every object inside an array.
          return isPlainObject(converted) ? { _key: `k${i}`, ...converted } : converted;
        })
        .filter((item) => item !== undefined);
    }
    if (!isPlainObject(value)) return value;
    if (key !== undefined && IMAGE_FIELDS.has(key)) return toImage(value, assets);
    const out: PlainObject = {};
    for (const [k, v] of Object.entries(value)) {
      const converted = convert(v, k);
      if (converted !== undefined) out[k] = converted;
    }
    return out;
  };

  const settings: SanityDocument = {
    _id: sanityDocumentId(site.id, 'settings'),
    _type: 'siteSettings',
    site: site.id,
    navigation: convert(site.navigation),
    footer: convert({ tagline: site.footer.tagline, columns: site.footer.columns, social: site.footer.social, legal: site.footer.legal }),
    seo: convert({ titleTemplate: site.seo.titleTemplate, defaultImage: site.seo.defaultImage }),
  };

  const pages = site.pages.map<SanityDocument>((page) => ({
    _id: sanityDocumentId(site.id, 'page', page.slug),
    _type: 'page',
    site: site.id,
    slug: { _type: 'slug', current: page.slug },
    title: page.title,
    description: page.description,
    enabled: true,
    sections: page.sections.map((section) => {
      const { id, type, ...fields } = section;
      return { _key: id, _type: type, sectionId: id, ...(convert(fields) as PlainObject) };
    }),
  }));

  return [settings, ...pages];
}

function toImage(value: unknown, assets: ReadonlyMap<string, string>): PlainObject | undefined {
  if (!isPlainObject(value) || typeof value.src !== 'string') return undefined;
  const assetId = assets.get(value.src);
  if (!assetId) return undefined;
  // Dimensions live on the asset; src is replaced by the asset reference.
  const { src: _src, width: _w, height: _h, ...rest } = value;
  return { _type: 'image', asset: { _type: 'reference', _ref: assetId }, ...rest };
}
