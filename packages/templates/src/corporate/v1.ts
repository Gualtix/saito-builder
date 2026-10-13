import { defineTemplate } from '@saito/core';
import { themes } from '../themes.ts';

export default defineTemplate({
  id: 'corporate',
  name: 'Corporate Website',
  version: '1.0.0',
  description: 'Multi-page company website: home, about, services and contact.',
  websiteTypes: ['corporate', 'homepage', 'brand', 'service-business', 'marketing'],
  tags: ['multi-page', 'b2b', 'company'],
  theme: themes.slate,
  navigation: {
    links: [
      { label: 'About', href: '/about/' },
      { label: 'Services', href: '/services/' },
      { label: 'Contact', href: '/contact/' },
    ],
    cta: { label: 'Talk to us', href: '/contact/' },
  },
  footer: {
    columns: [
      {
        title: 'Company',
        links: [
          { label: 'About', href: '/about/' },
          { label: 'Services', href: '/services/' },
        ],
      },
      { title: 'Get in touch', links: [{ label: 'Contact', href: '/contact/' }] },
    ],
  },
  seo: { schemaType: 'Organization' },
  pages: [
    {
      slug: 'index',
      title: 'Home',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          layout: 'split',
          heading: 'We help organisations grow with confidence',
          subheading: 'Strategy, delivery and support from a team that has done it before.',
          primaryAction: { label: 'Our services', href: '/services/' },
          secondaryAction: { label: 'Contact us', href: '/contact/' },
        },
        {
          id: 'stats',
          type: 'stats',
          background: 'surface',
          items: [
            { value: '25+', label: 'Years in business' },
            { value: '400+', label: 'Clients served' },
            { value: '12', label: 'Countries' },
          ],
        },
        {
          id: 'services',
          type: 'features',
          heading: 'What we do',
          items: [
            { title: 'Consulting', description: 'Clear strategy grounded in data.' },
            { title: 'Delivery', description: 'Experienced teams that ship.' },
            { title: 'Support', description: 'Around-the-clock operational care.' },
          ],
        },
        {
          id: 'testimonials',
          type: 'testimonials',
          heading: 'What clients say',
          items: [{ quote: 'A dependable partner from day one.', author: 'Jordan Lee', role: 'COO, Northwind' }],
        },
        {
          id: 'cta',
          type: 'cta',
          heading: "Let's work together",
          primaryAction: { label: 'Get in touch', href: '/contact/' },
          background: 'dark',
        },
      ],
    },
    {
      slug: 'about',
      title: 'About us',
      sections: [
        { id: 'intro', type: 'richText', heading: 'Our story', body: 'Tell visitors who you are, what you believe and why you do what you do.' },
        {
          id: 'team',
          type: 'team',
          heading: 'Leadership',
          background: 'surface',
          members: [
            { name: 'Alex Morgan', role: 'Chief Executive Officer' },
            { name: 'Sam Rivera', role: 'Chief Operating Officer' },
          ],
        },
      ],
    },
    {
      slug: 'services',
      title: 'Services',
      sections: [
        {
          id: 'list',
          type: 'features',
          heading: 'Services',
          columns: 2,
          items: [
            { title: 'Strategy', description: 'Roadmaps and operating models.' },
            { title: 'Implementation', description: 'Programme and project delivery.' },
          ],
        },
        {
          id: 'faq',
          type: 'faq',
          heading: 'Common questions',
          items: [{ question: 'How do engagements start?', answer: 'With a free 30-minute discovery call.' }],
        },
      ],
    },
    {
      slug: 'contact',
      title: 'Contact',
      sections: [{ id: 'contact', type: 'contact', heading: 'Contact us', intro: "We'd love to hear from you." }],
    },
  ],
  changelog: [{ version: '1.0.0', notes: 'Initial release.' }],
});
