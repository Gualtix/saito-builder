import { defineArrayMember, defineField, defineType, type FieldDefinition } from 'sanity';

/*
 * These schemas mirror packages/core/src/schema/sections.ts.
 * Each section object carries a `sectionId`: when it matches a template section id the CMS content
 * overrides that section; otherwise it is added as a new section. Field names match the core schema exactly.
 */

const siteField = defineField({
  name: 'site',
  title: 'Site id',
  type: 'string',
  description: 'The site id from sites/<id>/site.config.yaml, e.g. "acme-corp".',
  validation: (r) => r.required().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { name: 'kebab-case' }),
});

const link = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'object',
    fields: [
      defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
      defineField({ name: 'href', type: 'string', validation: (r) => r.required() }),
    ],
  });

const image = (name = 'image', title = 'Image') =>
  defineField({ name, title, type: 'image', options: { hotspot: true }, fields: [defineField({ name: 'alt', type: 'string', title: 'Alt text' })] });

const text = (name: string, title?: string, required = false) =>
  defineField({ name, title, type: 'string', validation: required ? (r) => r.required() : undefined });
const longText = (name: string, title?: string, required = false) =>
  defineField({ name, title, type: 'text', rows: 4, validation: required ? (r) => r.required() : undefined });

const list = (name: string, title: string, fields: FieldDefinition[]) =>
  defineField({ name, title, type: 'array', of: [defineArrayMember({ type: 'object', fields })] });

function section(name: string, title: string, fields: FieldDefinition[]) {
  return defineType({
    name,
    title,
    type: 'object',
    fields: [
      defineField({
        name: 'sectionId',
        title: 'Section id',
        type: 'string',
        description: 'Use the template section id (e.g. "hero") to override it, or a new id to add a section.',
        validation: (r) => r.required().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { name: 'kebab-case' }),
      }),
      defineField({ name: 'background', type: 'string', options: { list: ['default', 'surface', 'primary', 'dark'] } }),
      defineField({ name: 'anchor', type: 'string', description: 'HTML anchor; defaults to the section id.' }),
      ...fields,
    ],
    preview: {
      select: { heading: 'heading', sectionId: 'sectionId' },
      prepare: ({ heading, sectionId }) => ({ title: heading ?? title, subtitle: `${title} · ${sectionId}` }),
    },
  });
}

const sections = [
  section('hero', 'Hero', [
    defineField({ name: 'layout', type: 'string', options: { list: ['centered', 'split', 'image-background'] } }),
    text('eyebrow'),
    text('heading', 'Heading', true),
    longText('subheading'),
    link('primaryAction', 'Primary action'),
    link('secondaryAction', 'Secondary action'),
    image(),
  ]),
  section('features', 'Features', [
    text('heading'),
    longText('intro'),
    defineField({ name: 'columns', type: 'number', options: { list: [2, 3, 4] } }),
    list('items', 'Items', [text('icon', 'Icon (emoji)'), text('title', 'Title', true), longText('description')]),
  ]),
  section('stats', 'Stats', [text('heading'), list('items', 'Items', [text('value', 'Value', true), text('label', 'Label', true)])]),
  section('logoCloud', 'Logo cloud', [text('heading'), list('logos', 'Logos', [text('name', 'Name', true), text('src', 'Image URL'), text('href', 'Link')])]),
  section('testimonials', 'Testimonials', [
    text('heading'),
    list('items', 'Testimonials', [longText('quote', 'Quote', true), text('author', 'Author', true), text('role'), image('avatar', 'Avatar')]),
  ]),
  section('pricing', 'Pricing', [
    text('heading'),
    longText('intro'),
    list('plans', 'Plans', [
      text('name', 'Name', true),
      text('price', 'Price', true),
      text('period'),
      longText('description'),
      defineField({ name: 'features', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
      link('action', 'Action'),
      defineField({ name: 'highlighted', type: 'boolean' }),
    ]),
  ]),
  section('faq', 'FAQ', [text('heading'), list('items', 'Questions', [text('question', 'Question', true), longText('answer', 'Answer', true)])]),
  section('cta', 'Call to action', [text('heading', 'Heading', true), longText('body'), link('primaryAction', 'Primary action'), link('secondaryAction', 'Secondary action')]),
  section('richText', 'Rich text', [
    text('heading'),
    defineField({
      name: 'body',
      type: 'text',
      rows: 10,
      description: 'Blank line between paragraphs. Supports **bold**, *italic* and [links](https://…).',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'width', type: 'string', options: { list: ['narrow', 'wide'] } }),
  ]),
  section('gallery', 'Gallery', [
    text('heading'),
    defineField({ name: 'columns', type: 'number', options: { list: [2, 3, 4] } }),
    defineField({
      name: 'images',
      type: 'array',
      of: [defineArrayMember({ type: 'image', options: { hotspot: true }, fields: [text('alt', 'Alt text'), text('caption')] })],
    }),
  ]),
  section('team', 'Team', [
    text('heading'),
    longText('intro'),
    list('members', 'Members', [text('name', 'Name', true), text('role'), image('photo', 'Photo'), longText('bio')]),
  ]),
  section('menu', 'Menu', [
    text('heading'),
    longText('intro'),
    text('currency', 'Currency (ISO code)'),
    list('categories', 'Categories', [
      text('name', 'Name', true),
      list('items', 'Dishes', [
        text('id', 'Id (required for online ordering)'),
        text('name', 'Name', true),
        longText('description'),
        defineField({ name: 'price', type: 'number', validation: (r) => r.required().min(0) }),
        defineField({ name: 'tags', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
        defineField({ name: 'orderable', type: 'boolean' }),
      ]),
    ]),
  ]),
  section('products', 'Products', [
    text('heading'),
    longText('intro'),
    text('currency', 'Currency (ISO code)'),
    list('items', 'Products', [
      text('id', 'Id', true),
      text('name', 'Name', true),
      longText('description'),
      defineField({ name: 'price', type: 'number', validation: (r) => r.required().min(0) }),
      image(),
      text('url', 'Product / checkout URL'),
    ]),
  ]),
  section('contact', 'Contact', [
    text('heading'),
    longText('intro'),
    text('email'),
    text('phone'),
    longText('address'),
    list('hours', 'Opening hours', [text('days', 'Days', true), text('hours', 'Hours', true)]),
    defineField({ name: 'mapEmbedUrl', type: 'url' }),
    defineField({
      name: 'form',
      title: 'Contact form',
      type: 'object',
      fields: [defineField({ name: 'enabled', type: 'boolean' }), text('submitLabel', 'Button label'), text('successMessage', 'Success message')],
    }),
  ]),
  section('schedule', 'Schedule', [
    text('heading'),
    longText('intro'),
    list('days', 'Days', [
      text('label', 'Label', true),
      list('items', 'Sessions', [text('time', 'Time', true), text('title', 'Title', true), text('speaker'), longText('description')]),
    ]),
  ]),
  section('countdown', 'Countdown', [
    text('heading', 'Heading', true),
    defineField({ name: 'target', type: 'datetime', validation: (r) => r.required() }),
    text('expiredText', 'Text after the countdown ends'),
    link('action', 'Action'),
  ]),
];

const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    siteField,
    defineField({
      name: 'slug',
      type: 'slug',
      description: 'Use "index" for the homepage. Must match a template page to override it, or a new slug to add a page.',
      validation: (r) => r.required(),
    }),
    text('title'),
    longText('description', 'SEO description'),
    defineField({ name: 'enabled', type: 'boolean', description: 'Turn off to hide a template page.', initialValue: true }),
    defineField({ name: 'sections', type: 'array', of: sections.map((s) => defineArrayMember({ type: s.name })) }),
  ],
  preview: {
    select: { title: 'title', site: 'site', slug: 'slug.current' },
    prepare: ({ title, site, slug }) => ({ title: title ?? slug, subtitle: `${site} · /${slug === 'index' ? '' : slug}` }),
  },
});

const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    siteField,
    defineField({
      name: 'navigation',
      type: 'object',
      fields: [list('links', 'Links', [text('label', 'Label', true), text('href', 'Href', true)]), link('cta', 'Call to action')],
    }),
    defineField({
      name: 'footer',
      type: 'object',
      fields: [
        text('tagline'),
        list('columns', 'Columns', [text('title', 'Title', true), list('links', 'Links', [text('label', 'Label', true), text('href', 'Href', true)])]),
        list('social', 'Social links', [
          defineField({
            name: 'platform',
            type: 'string',
            options: { list: ['x', 'facebook', 'instagram', 'linkedin', 'youtube', 'github', 'tiktok'] },
            validation: (r) => r.required(),
          }),
          text('href', 'URL', true),
        ]),
        text('legal'),
      ],
    }),
    defineField({ name: 'seo', type: 'object', fields: [text('titleTemplate', 'Title template (%s = page title)'), text('defaultImage', 'Default share image URL')] }),
  ],
  preview: { select: { title: 'site' }, prepare: ({ title }) => ({ title: `${title} settings` }) },
});

export const schemaTypes = [...sections, page, siteSettings];
