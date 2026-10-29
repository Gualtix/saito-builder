import { z } from 'zod';
import { imageSchema, linkSchema, pageSlugSchema, slugSchema } from './primitives.ts';
import { themeSchema } from './theme.ts';

export const environments = ['development', 'staging', 'production'] as const;
export type Environment = (typeof environments)[number];

// --- site-chrome: header icon links (same platforms as `footer.social`, plus email) ---
export const navigationIconNames = ['email', 'x', 'facebook', 'instagram', 'linkedin', 'youtube', 'github', 'tiktok'] as const;
// --- end site-chrome ---

export const navigationSchema = z.object({
  links: z.array(linkSchema).default([]),
  cta: linkSchema.optional(),
  // --- site-chrome ---
  /** Transparent header over the hero; applies only when the page starts with an `image-background` hero that has an image. */
  transparent: z.boolean().default(false),
  /** Round icon buttons after the links, on wide screens only. */
  iconLinks: z.array(z.object({ icon: z.enum(navigationIconNames), href: z.string().min(1) })).default([]),
  // --- end site-chrome ---
});

export const footerSchema = z.object({
  tagline: z.string().optional(),
  columns: z.array(z.object({ title: z.string(), links: z.array(linkSchema) })).default([]),
  social: z
    .array(z.object({ platform: z.enum(['x', 'facebook', 'instagram', 'linkedin', 'youtube', 'github', 'tiktok']), href: z.string() }))
    .default([]),
  legal: z.string().optional(),
});

export const seoSchema = z.object({
  /** "%s" is replaced with the page title. */
  titleTemplate: z.string().optional(),
  defaultImage: z.string().optional(),
  twitterHandle: z.string().optional(),
  noindex: z.boolean().default(false),
  /** schema.org type used for the site-wide JSON-LD block. */
  schemaType: z.enum(['Organization', 'LocalBusiness', 'Restaurant', 'Event', 'Person']).default('Organization'),
});

export const integrationsSchema = z.object({
  analytics: z
    .object({
      provider: z.enum(['plausible', 'ga4']),
      id: z.string().min(1),
    })
    .optional(),
  commerce: z
    .discriminatedUnion('provider', [
      z.object({ provider: z.literal('snipcart'), publicKey: z.string().min(1), currency: z.string().length(3).default('USD') }),
      z.object({ provider: z.literal('shopify'), storeDomain: z.string().min(1), storefrontToken: z.string().min(1) }),
      z.object({ provider: z.literal('commerce-layer'), organization: z.string().min(1), clientId: z.string().min(1) }),
      // Order by WhatsApp: the cart lives in the browser and hands off to wa.me. Every field is public by design.
      z.object({
        provider: z.literal('whatsapp'),
        /** Any format; reduced to digits for wa.me. */
        phone: z.string().min(6),
        currency: z.string().length(3),
        orderIdPrefix: z.string().regex(/^[A-Z0-9]{1,6}$/),
        maxQty: z.number().int().min(1).max(99).default(20),
        /** Optional delivery pin; also switches the build's Permissions-Policy to geolocation=(self). */
        location: z
          .object({
            enabled: z.boolean().default(false),
            center: z.tuple([z.number(), z.number()]),
            zoom: z.number().int().min(1).max(19).default(16),
          })
          .optional(),
      }),
    ])
    .optional(),
  forms: z
    .object({
      /** Base URL of the Saito API (apps/api). Forms post to `${endpoint}/v1/sites/<id>/contact`. */
      endpoint: z.string().url(),
      /** Server-side only: the API forwards submissions here. Never rendered into pages. */
      webhookUrl: z.string().url().optional(),
      notifyEmail: z.string().email().optional(),
    })
    .optional(),
});

/**
 * Per-page customisation on top of the template.
 *  - `sections.<id>: {...}` deep-merges into the template section with that id
 *  - `sections.<id>: {type: ..., ...}` with an id the template does not have adds a new section
 *  - `sections.<id>: false` removes it
 *  - `order` lists section ids to put first, in that order
 *  - `enabled: false` drops a template page entirely
 * Pages that do not exist in the template need a `title` and at least one new section.
 */
export const pageOverrideSchema = z.object({
  enabled: z.boolean().default(true),
  title: z.string().optional(),
  description: z.string().optional(),
  sections: z.record(z.union([z.literal(false), z.record(z.unknown())])).default({}),
  order: z.array(z.string()).optional(),
});

/** Template reference: "<template-id>@<range>", e.g. "corporate@1", "landing@^2.1.0", "restaurant@latest". */
export const templateRefSchema = z.string().regex(/^[a-z0-9-]+@[\w.^~-]+$/, 'must look like "<template>@<version-range>"');

export const siteConfigSchema = z.object({
  id: slugSchema,
  tenant: slugSchema,
  name: z.string().min(1),
  description: z.string().default(''),
  locale: z.string().default('en'),
  template: templateRefSchema,
  environments: z.record(z.enum(environments), z.object({ url: z.string().url() })).default({}),
  brand: z
    .object({
      logo: imageSchema.optional(),
      /** Text used when no logo is provided. Defaults to the site name. */
      logoText: z.string().optional(),
      favicon: z.string().optional(),
    })
    .default({}),
  /** Partial theme; deep-merged over the template theme. */
  theme: z.record(z.unknown()).default({}),
  navigation: navigationSchema.optional(),
  footer: footerSchema.partial().optional(),
  seo: seoSchema.partial().default({}),
  integrations: integrationsSchema.default({}),
  pages: z.record(pageSlugSchema, pageOverrideSchema).default({}),
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;
export type SiteConfigInput = z.input<typeof siteConfigSchema>;
export type PageOverride = z.infer<typeof pageOverrideSchema>;
export type Navigation = z.infer<typeof navigationSchema>;
export type Footer = z.infer<typeof footerSchema>;
export type Seo = z.infer<typeof seoSchema>;
export type Integrations = z.infer<typeof integrationsSchema>;

export { themeSchema };
