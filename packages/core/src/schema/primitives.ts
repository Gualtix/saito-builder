import { z } from 'zod';

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be lowercase kebab-case (a-z, 0-9, -)');

/** Page slugs may be nested ("about/team"); "index" is the homepage. */
export const pageSlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/, 'must be kebab-case segments separated by "/"');

export const linkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

export const imageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().default(''),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export type Link = z.infer<typeof linkSchema>;
export type Image = z.infer<typeof imageSchema>;
