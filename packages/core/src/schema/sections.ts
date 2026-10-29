import { z } from 'zod';
import { imageSchema, linkSchema } from './primitives.ts';

/** Fields shared by every section. */
const base = {
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'section ids must be kebab-case'),
  /** Optional HTML anchor; defaults to the section id. */
  anchor: z.string().optional(),
  background: z.enum(['default', 'surface', 'primary', 'dark']).default('default'),
};

const heading = z.string().optional();
const intro = z.string().optional();

// --- section-variants: shared presentation fields (all optional; defaults keep today's rendering) ---
/** A photo beside the text ("media-text split"), on the `start` or `end` side (stacked on phones). */
const mediaSplit = {
  image: imageSchema.optional(),
  imagePosition: z.enum(['start', 'end']).default('end'),
  action: linkSchema.optional(),
  /** Flat colour block offset behind `image`, with the theme's panel radius. */
  slab: z.enum(['accent', 'accent2', 'accent3', 'primary']).optional(),
};
// --- end section-variants shared fields ---

export const heroSection = z.object({
  ...base,
  type: z.literal('hero'),
  layout: z.enum(['centered', 'split', 'image-background']).default('centered'),
  eyebrow: z.string().optional(),
  heading: z.string().min(1),
  subheading: z.string().optional(),
  primaryAction: linkSchema.optional(),
  secondaryAction: linkSchema.optional(),
  image: imageSchema.optional(),
  /** site-chrome: `display` sets the heading as a large fluid wordmark. */
  headingSize: z.enum(['default', 'display']).default('default'),
});

export const featuresSection = z.object({
  ...base,
  type: z.literal('features'),
  heading,
  intro,
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  /** section-variants: `emoji` renders `icon` as text; `badge` treats it as a name from the shared icon set, in a round accent badge. */
  iconStyle: z.enum(['emoji', 'badge']).default('emoji'),
  /** section-variants: plain centred columns with thin rules between them instead of cards. */
  dividers: z.boolean().default(false),
  items: z
    .array(z.object({ icon: z.string().optional(), title: z.string().min(1), description: z.string().default('') }))
    .min(1),
});

export const statsSection = z.object({
  ...base,
  type: z.literal('stats'),
  heading,
  items: z.array(z.object({ value: z.string().min(1), label: z.string().min(1) })).min(1),
});

export const logoCloudSection = z.object({
  ...base,
  type: z.literal('logoCloud'),
  heading,
  logos: z.array(z.object({ name: z.string().min(1), src: z.string().optional(), href: z.string().optional() })).min(1),
});

export const testimonialsSection = z.object({
  ...base,
  type: z.literal('testimonials'),
  heading,
  items: z
    .array(
      z.object({
        quote: z.string().min(1),
        author: z.string().min(1),
        role: z.string().optional(),
        avatar: imageSchema.optional(),
      }),
    )
    .min(1),
});

export const pricingSection = z.object({
  ...base,
  type: z.literal('pricing'),
  heading,
  intro,
  plans: z
    .array(
      z.object({
        name: z.string().min(1),
        price: z.string().min(1),
        period: z.string().optional(),
        description: z.string().optional(),
        features: z.array(z.string()).default([]),
        action: linkSchema,
        highlighted: z.boolean().default(false),
      }),
    )
    .min(1),
});

export const faqSection = z.object({
  ...base,
  type: z.literal('faq'),
  heading,
  items: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).min(1),
});

export const ctaSection = z.object({
  ...base,
  type: z.literal('cta'),
  heading: z.string().min(1),
  body: z.string().optional(),
  primaryAction: linkSchema,
  secondaryAction: linkSchema.optional(),
  /** section-variants: `photo-band` puts `image` full-bleed under the scrim, with the content in a centred card. */
  layout: z.enum(['band', 'photo-band']).default('band'),
  /** Required when `layout` is `photo-band` (checked on `sectionSchema`). */
  image: imageSchema.optional(),
});

export const richTextSection = z.object({
  ...base,
  type: z.literal('richText'),
  heading,
  /** Paragraphs separated by blank lines. Supports **bold**, *italic* and [links](https://…). */
  body: z.string().min(1),
  width: z.enum(['narrow', 'wide']).default('narrow'),
  /** section-variants: image, imagePosition, action, slab. */
  ...mediaSplit,
  /** site-chrome: a faint line drawing under the text column, wide screens only. */
  doodle: z.enum(['leaf', 'citrus', 'pod']).optional(),
});

export const gallerySection = z.object({
  ...base,
  type: z.literal('gallery'),
  heading,
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  /** section-variants: `marquee` scrolls one row in a loop; `masonry` is a photo wall where `span: tall` tiles take two rows. */
  layout: z.enum(['grid', 'marquee', 'masonry']).default('grid'),
  /** section-variants: a button beside the heading. */
  action: linkSchema.optional(),
  images: z
    .array(imageSchema.extend({ caption: z.string().optional(), span: z.enum(['tall']).optional() }))
    .min(1),
});

export const teamSection = z.object({
  ...base,
  type: z.literal('team'),
  heading,
  intro,
  members: z
    .array(
      z.object({
        name: z.string().min(1),
        role: z.string().default(''),
        photo: imageSchema.optional(),
        bio: z.string().optional(),
      }),
    )
    .min(1),
});

const price = z.number().nonnegative();

export const menuSection = z.object({
  ...base,
  type: z.literal('menu'),
  heading,
  intro,
  currency: z.string().length(3).default('USD'),
  /** whatsapp-commerce: `cards` is a photo card grid (category label, name, description, price). */
  layout: z.enum(['list', 'cards']).default('list'),
  categories: z
    .array(
      z.object({
        name: z.string().min(1),
        items: z
          .array(
            z.object({
              /** Stable identifier; required for online ordering. */
              id: z.string().optional(),
              name: z.string().min(1),
              description: z.string().optional(),
              price,
              tags: z.array(z.string()).default([]),
              orderable: z.boolean().default(false),
              /** whatsapp-commerce: card photo, also shown in the product dialog. */
              image: imageSchema.optional(),
              /** whatsapp-commerce: removable ingredients (all included by default). */
              ingredients: z.array(z.string().min(1)).optional(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

export const productsSection = z.object({
  ...base,
  type: z.literal('products'),
  heading,
  intro,
  currency: z.string().length(3).default('USD'),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        price,
        image: imageSchema.optional(),
        /** External product / checkout URL, used when no cart provider is configured. */
        url: z.string().optional(),
      }),
    )
    .min(1),
});

export const contactSection = z.object({
  ...base,
  type: z.literal('contact'),
  heading,
  intro,
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  hours: z.array(z.object({ days: z.string(), hours: z.string() })).default([]),
  mapEmbedUrl: z.string().url().optional(),
  form: z
    .object({
      enabled: z.boolean().default(true),
      // Unset: the component uses the locale string (packages/components/src/strings.ts).
      submitLabel: z.string().optional(),
      successMessage: z.string().optional(),
    })
    .default({}),
  /** section-variants: image, imagePosition, action, slab. */
  ...mediaSplit,
});

export const scheduleSection = z.object({
  ...base,
  type: z.literal('schedule'),
  heading,
  intro,
  days: z
    .array(
      z.object({
        label: z.string().min(1),
        items: z
          .array(
            z.object({
              time: z.string().min(1),
              title: z.string().min(1),
              speaker: z.string().optional(),
              description: z.string().optional(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

export const countdownSection = z.object({
  ...base,
  type: z.literal('countdown'),
  heading: z.string().min(1),
  /** ISO 8601 date-time, e.g. 2027-03-14T09:00:00Z */
  target: z.string().datetime({ offset: true }),
  /** Unset: the component uses the locale string. */
  expiredText: z.string().optional(),
  action: linkSchema.optional(),
});

/** section-variants: a daily offer, dish names under one shared display price. */
export const specialsSection = z.object({
  ...base,
  type: z.literal('specials'),
  heading: z.string().min(1),
  intro,
  /** Display string, formatted by you, e.g. "Q65". */
  price: z.string().min(1),
  /** Small note under the price, e.g. "por plato". */
  priceNote: z.string().optional(),
  /** Shows the price as a rotated star badge on the panel edge; `false` shows it as text. */
  badge: z.boolean().default(true),
  items: z.array(z.string().min(1)).min(1),
  /** Up to three photos, shown as a collage. */
  images: z.array(imageSchema).max(3).default([]),
  action: linkSchema.optional(),
});

const sectionUnion = z.discriminatedUnion('type', [
  heroSection,
  featuresSection,
  statsSection,
  logoCloudSection,
  testimonialsSection,
  pricingSection,
  faqSection,
  ctaSection,
  richTextSection,
  gallerySection,
  teamSection,
  menuSection,
  productsSection,
  contactSection,
  scheduleSection,
  countdownSection,
  specialsSection,
]);

// Cross-field rules live here: a refined object can't be a discriminated-union member.
export const sectionSchema = sectionUnion.superRefine((section, ctx) => {
  if (section.type === 'cta' && section.layout === 'photo-band' && !section.image) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['image'], message: 'required when layout is "photo-band"' });
  }
});

export type Section = z.infer<typeof sectionSchema>;
export type SectionInput = z.input<typeof sectionSchema>;
export type SectionType = Section['type'];
export type SectionOf<T extends SectionType> = Extract<Section, { type: T }>;

export const sectionTypes = sectionUnion.options.map((o) => o.shape.type.value) as SectionType[];
