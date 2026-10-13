import { defineTemplate } from '@saito/core';
import { themes } from '../themes.ts';

export default defineTemplate({
  id: 'restaurant',
  name: 'Restaurant',
  version: '1.0.0',
  description: 'Restaurant website with menu, story, opening hours and optional online ordering (via a commerce provider).',
  websiteTypes: ['restaurant', 'service-business'],
  tags: ['hospitality', 'menu', 'ordering'],
  theme: themes.bistro,
  navigation: {
    links: [
      { label: 'Menu', href: '/menu/' },
      { label: 'About', href: '/#story' },
      { label: 'Visit', href: '/#visit' },
    ],
    cta: { label: 'Book a table', href: '/#visit' },
  },
  footer: {},
  seo: { schemaType: 'Restaurant' },
  pages: [
    {
      slug: 'index',
      title: 'Home',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          layout: 'image-background',
          heading: 'Seasonal food, made with care',
          subheading: 'Neighbourhood dining since 2010.',
          primaryAction: { label: 'See the menu', href: '/menu/' },
          secondaryAction: { label: 'Book a table', href: '#visit' },
        },
        {
          id: 'story',
          type: 'richText',
          heading: 'Our story',
          body: 'Share the history of your kitchen, your philosophy and the people behind the food.',
        },
        {
          id: 'highlights',
          type: 'features',
          background: 'surface',
          items: [
            { icon: '🌿', title: 'Local produce', description: 'Sourced from farms within 50 miles.' },
            { icon: '🍷', title: 'Natural wines', description: 'A short list, chosen with care.' },
            { icon: '👨‍🍳', title: 'Open kitchen', description: 'Watch your meal come together.' },
          ],
        },
        {
          id: 'visit',
          type: 'contact',
          heading: 'Visit us',
          hours: [
            { days: 'Tue – Fri', hours: '17:00 – 22:00' },
            { days: 'Sat – Sun', hours: '12:00 – 23:00' },
          ],
          form: { enabled: true, submitLabel: 'Request a booking', successMessage: "Thanks! We'll confirm your booking by email." },
        },
      ],
    },
    {
      slug: 'menu',
      title: 'Menu',
      sections: [
        {
          id: 'menu',
          type: 'menu',
          heading: 'Menu',
          categories: [
            {
              name: 'Starters',
              items: [{ id: 'soup', name: 'Soup of the day', price: 8, tags: ['v'] }],
            },
            {
              name: 'Mains',
              items: [{ id: 'main', name: "Chef's special", price: 22 }],
            },
          ],
        },
      ],
    },
  ],
  changelog: [{ version: '1.0.0', notes: 'Initial release.' }],
});
