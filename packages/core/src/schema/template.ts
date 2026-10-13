import { z } from 'zod';
import { pageSlugSchema, slugSchema } from './primitives.ts';
import { sectionSchema } from './sections.ts';
import { footerSchema, navigationSchema, seoSchema, type SiteConfigInput } from './site.ts';
import { themeSchema } from './theme.ts';

export const websiteTypes = [
  'landing-page',
  'homepage',
  'corporate',
  'marketing',
  'product-showcase',
  'service-business',
  'restaurant',
  'real-estate',
  'portfolio',
  'event',
  'microsite',
  'campaign',
  'brand',
] as const;

export const templateManifestSchema = z.object({
  id: slugSchema,
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'must be a semantic version like 1.2.0'),
  description: z.string(),
  author: z.string().default('Saito'),
  websiteTypes: z.array(z.enum(websiteTypes)).min(1),
  tags: z.array(z.string()).default([]),
  /** Path or URL of a preview image shown in the marketplace. */
  preview: z.string().optional(),
  theme: themeSchema,
  navigation: navigationSchema,
  footer: footerSchema,
  seo: seoSchema.partial().default({}),
  pages: z
    .array(
      z.object({
        slug: pageSlugSchema,
        title: z.string().min(1),
        description: z.string().optional(),
        sections: z.array(sectionSchema).min(1),
      }),
    )
    .min(1),
  changelog: z.array(z.object({ version: z.string(), notes: z.string() })).default([]),
});

export type TemplateManifest = z.infer<typeof templateManifestSchema>;
export type TemplateManifestInput = z.input<typeof templateManifestSchema>;

/**
 * Upgrades a site config across a breaking (major) template release.
 * Receives the raw site config object and returns the transformed one.
 */
export interface TemplateMigration {
  from: number;
  to: number;
  notes: string;
  migrate: (config: SiteConfigInput) => SiteConfigInput;
}

export interface TemplateModule {
  manifest: TemplateManifest;
  /** Migrations that lead *into* this version's major. */
  migrations?: TemplateMigration[];
}
