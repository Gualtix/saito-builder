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
});

export const featuresSection = z.object({
  ...base,
  type: z.literal('features'),
  heading,
  intro,
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
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
});

export const richTextSection = z.object({
  ...base,
  type: z.literal('richText'),
  heading,
  /** Paragraphs separated by blank lines. Supports **bold**, *italic* and [links](https://…). */
  body: z.string().min(1),
  width: z.enum(['narrow', 'wide']).default('narrow'),
});

export const gallerySection = z.object({
  ...base,
  type: z.literal('gallery'),
  heading,
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  images: z.array(imageSchema.extend({ caption: z.string().optional() })).min(1),
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

export const sectionSchema = z.discriminatedUnion('type', [
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
]);

export type Section = z.infer<typeof sectionSchema>;
export type SectionInput = z.input<typeof sectionSchema>;
export type SectionType = Section['type'];
export type SectionOf<T extends SectionType> = Extract<Section, { type: T }>;

export const sectionTypes = sectionSchema.options.map((o) => o.shape.type.value) as SectionType[];
