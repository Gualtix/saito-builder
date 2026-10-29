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

// --- section-variants: shared fields (mirror `mediaSplit` in packages/core/src/schema/sections.ts) ---
const mediaSplitFields = () => [
  image('image', 'Image beside the text'),
  defineField({ name: 'imagePosition', title: 'Image position', type: 'string', options: { list: ['start', 'end'] } }),
  link('action', 'Action'),
  defineField({
    name: 'slab',
    title: 'Colour slab behind the image',
    type: 'string',
    options: { list: ['accent', 'accent2', 'accent3', 'primary'] },
  }),
];
// --- end section-variants shared fields ---

const sections = [
  section('hero', 'Hero', [
    defineField({ name: 'layout', type: 'string', options: { list: ['centered', 'split', 'image-background'] } }),
    text('eyebrow'),
    text('heading', 'Heading', true),
    longText('subheading'),
    link('primaryAction', 'Primary action'),
    link('secondaryAction', 'Secondary action'),
    image(),
    // site-chrome
    defineField({
      name: 'headingSize',
      title: 'Heading size',
      type: 'string',
      options: { list: ['default', 'display'] },
      description: '"display" sets the heading as a large wordmark.',
    }),
  ]),
  section('features', 'Features', [
    text('heading'),
    longText('intro'),
    defineField({ name: 'columns', type: 'number', options: { list: [2, 3, 4] } }),
    // section-variants: icon style and dividers
    defineField({
      name: 'iconStyle',
      title: 'Icon style',
      type: 'string',
      description: 'badge: each icon is a name from the shared set (pot, heart, home, family, leaf, mail, …) in a round accent badge.',
      options: { list: ['emoji', 'badge'] },
    }),
    defineField({ name: 'dividers', type: 'boolean', description: 'Plain centred columns with thin rules between them instead of cards.' }),
    list('items', 'Items', [text('icon', 'Icon (emoji, or an icon name with the badge style)'), text('title', 'Title', true), longText('description')]),
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
  section('cta', 'Call to action', [
    text('heading', 'Heading', true),
    longText('body'),
    link('primaryAction', 'Primary action'),
    link('secondaryAction', 'Secondary action'),
    // section-variants: photo band
    defineField({ name: 'layout', type: 'string', options: { list: ['band', 'photo-band'] } }),
    defineField({
      ...image('image', 'Background photo (required for photo-band)'),
      validation: (r) =>
        r.custom((value, context) =>
          (context.parent as { layout?: string } | undefined)?.layout === 'photo-band' && !value ? 'Required for the photo-band layout' : true,
        ),
    }),
  ]),
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
    ...mediaSplitFields(), // section-variants
    // site-chrome
    defineField({
      name: 'doodle',
      type: 'string',
      options: { list: ['leaf', 'citrus', 'pod'] },
      description: 'A faint line drawing under the text, on wide screens only.',
    }),
  ]),
  section('gallery', 'Gallery', [
    text('heading'),
    defineField({ name: 'columns', type: 'number', options: { list: [2, 3, 4] } }),
    // section-variants: layout and header action
    defineField({ name: 'layout', type: 'string', options: { list: ['grid', 'marquee', 'masonry'] } }),
    link('action', 'Action beside the heading'),
    defineField({
      name: 'images',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            text('alt', 'Alt text'),
            text('caption'),
            defineField({ name: 'span', title: 'Span (masonry)', type: 'string', options: { list: ['tall'] } }),
          ],
        }),
      ],
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
    // whatsapp-commerce: layout, item image and ingredients
    defineField({ name: 'layout', type: 'string', options: { list: ['list', 'cards'] } }),
    list('categories', 'Categories', [
      text('name', 'Name', true),
      list('items', 'Dishes', [
        text('id', 'Id (required for online ordering)'),
        text('name', 'Name', true),
        longText('description'),
        defineField({ name: 'price', type: 'number', validation: (r) => r.required().min(0) }),
        defineField({ name: 'tags', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
        defineField({ name: 'orderable', type: 'boolean' }),
        image(),
        defineField({ name: 'ingredients', title: 'Removable ingredients', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
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
    ...mediaSplitFields(), // section-variants
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
  // section-variants: daily specials
  section('specials', 'Specials', [
    text('heading', 'Heading', true),
    longText('intro'),
    text('price', 'Price (display text, e.g. "Q65")', true),
    text('priceNote', 'Price note (e.g. "por plato")'),
    defineField({ name: 'badge', type: 'boolean', description: 'Show the price as a star badge (default on).' }),
    defineField({ name: 'items', title: 'Dishes', type: 'array', of: [defineArrayMember({ type: 'string' })], validation: (r) => r.required().min(1) }),
    defineField({
      name: 'images',
      type: 'array',
      of: [defineArrayMember({ type: 'image', options: { hotspot: true }, fields: [text('alt', 'Alt text')] })],
      validation: (r) => r.max(3),
    }),
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
      fields: [
        list('links', 'Links', [text('label', 'Label', true), text('href', 'Href', true)]),
        link('cta', 'Call to action'),
        // --- site-chrome (mirror navigationSchema in packages/core/src/schema/site.ts) ---
        defineField({
          name: 'transparent',
          title: 'Transparent over the hero',
          type: 'boolean',
          description: 'Only when the page starts with an image-background hero that has an image.',
        }),
        list('iconLinks', 'Icon links (wide screens)', [
          defineField({
            name: 'icon',
            type: 'string',
            options: { list: ['email', 'x', 'facebook', 'instagram', 'linkedin', 'youtube', 'github', 'tiktok'] },
            validation: (r) => r.required(),
          }),
          text('href', 'URL (mailto: for email)', true),
        ]),
        // --- end site-chrome ---
      ],
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
