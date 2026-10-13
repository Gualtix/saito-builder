import { createClient, type SanityClient } from '@sanity/client';
import { isPlainObject, type PlainObject } from '../merge.ts';
import type { Environment } from '../schema/site.ts';
import type { ContentOverlay, ContentSource } from './types.ts';

export interface SanityOptions {
  projectId: string;
  /** Defaults to the environment name, so staging builds read the staging dataset. */
  dataset?: string;
  apiVersion?: string;
  token?: string;
}

const QUERY = /* groq */ `{
  "settings": *[_type == "siteSettings" && site == $siteId][0]{ navigation, footer, seo },
  "pages": *[_type == "page" && site == $siteId]{ "slug": slug.current, title, description, enabled, sections }
}`;

interface SanityResult {
  settings: PlainObject | null;
  pages: Array<{ slug: string; title?: string; description?: string; enabled?: boolean; sections?: PlainObject[] }>;
}

export function sanityContentSource(options: SanityOptions): ContentSource {
  const clients = new Map<string, SanityClient>();
  const clientFor = (env: Environment) => {
    const dataset = options.dataset || env;
    let client = clients.get(dataset);
    if (!client) {
      client = createClient({
        projectId: options.projectId,
        dataset,
        apiVersion: options.apiVersion ?? '2025-01-01',
        token: options.token,
        useCdn: !options.token,
        perspective: 'published',
      });
      clients.set(dataset, client);
    }
    return { client, dataset };
  };

  return {
    name: 'sanity',
    async getOverlay(config, env) {
      const { client, dataset } = clientFor(env);
      const result = await client.fetch<SanityResult>(QUERY, { siteId: config.id });
      return sanityToOverlay(result, { projectId: options.projectId, dataset });
    },
  };
}

/** Converts Sanity documents into the site-config override format. Exported for tests. */
export function sanityToOverlay(result: SanityResult, assets: { projectId: string; dataset: string }): ContentOverlay {
  const overlay: ContentOverlay = {};
  const clean = (value: unknown) => normalize(value, assets) as PlainObject;

  if (result.settings) {
    const settings = clean(result.settings);
    for (const key of ['navigation', 'footer', 'seo'] as const) {
      if (isPlainObject(settings[key])) overlay[key] = settings[key];
    }
  }

  if (result.pages.length > 0) {
    overlay.pages = {};
    for (const page of result.pages) {
      const sections: PlainObject = {};
      const order: string[] = [];
      for (const raw of page.sections ?? []) {
        const { _type, sectionId, ...props } = raw as PlainObject & { _type: string; sectionId?: string };
        const id = sectionId ?? (raw._key as string);
        sections[id] = { type: _type, ...clean(props) };
        order.push(id);
      }
      overlay.pages[page.slug] = clean({
        enabled: page.enabled ?? undefined,
        title: page.title ?? undefined,
        description: page.description ?? undefined,
        sections,
        order,
      });
    }
  }
  return overlay;
}

/**
 * Strips Sanity bookkeeping fields, drops nulls and turns image objects into `{ src, alt, width, height, … }`
 * (extra fields such as gallery captions are kept; dimensions come from the asset reference).
 */
function normalize(value: unknown, assets: { projectId: string; dataset: string }): unknown {
  if (Array.isArray(value)) return value.map((v) => normalize(v, assets));
  if (!isPlainObject(value)) return value;

  const asset = value.asset as PlainObject | undefined;
  if (value._type === 'image' && asset && typeof asset._ref === 'string') {
    const { asset: _asset, alt, ...rest } = value;
    const size = /-(\d+)x(\d+)-\w+$/.exec(asset._ref);
    return {
      ...(normalize(rest, assets) as PlainObject),
      src: imageUrl(asset._ref, assets),
      alt: typeof alt === 'string' ? alt : '',
      ...(size ? { width: Number(size[1]), height: Number(size[2]) } : {}),
    };
  }

  const out: PlainObject = {};
  for (const [key, v] of Object.entries(value)) {
    if (key.startsWith('_') || v === null || v === undefined) continue;
    out[key] = normalize(v, assets);
  }
  return out;
}

/** Sanity image refs look like "image-<hash>-<w>x<h>-<ext>". */
export function imageUrl(ref: string, { projectId, dataset }: { projectId: string; dataset: string }): string {
  const match = /^image-([a-zA-Z0-9]+)-(\d+x\d+)-(\w+)$/.exec(ref);
  if (!match) throw new Error(`Unrecognised Sanity image reference "${ref}"`);
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${match[1]}-${match[2]}.${match[3]}`;
}
