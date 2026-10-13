import { defineTemplate } from '@saito/core';
import { themes } from '../themes.ts';

export default defineTemplate({
  id: 'event',
  name: 'Event',
  version: '1.0.0',
  description: 'Conference or meetup site with countdown, speakers, schedule, tickets and FAQ.',
  websiteTypes: ['event', 'campaign', 'microsite'],
  tags: ['conference', 'countdown', 'tickets'],
  theme: themes.midnight,
  navigation: {
    links: [
      { label: 'Speakers', href: '#speakers' },
      { label: 'Schedule', href: '#schedule' },
      { label: 'Tickets', href: '#tickets' },
    ],
    cta: { label: 'Get tickets', href: '#tickets' },
  },
  footer: {},
  seo: { schemaType: 'Event' },
  pages: [
    {
      slug: 'index',
      title: 'Home',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          eyebrow: 'Date · City',
          heading: 'Your Event Name',
          subheading: 'One day of talks, workshops and good conversations.',
          primaryAction: { label: 'Get tickets', href: '#tickets' },
        },
        { id: 'countdown', type: 'countdown', heading: 'Doors open in', target: '2030-01-01T09:00:00Z', background: 'surface' },
        {
          id: 'speakers',
          type: 'team',
          heading: 'Speakers',
          members: [
            { name: 'Speaker One', role: 'Topic' },
            { name: 'Speaker Two', role: 'Topic' },
          ],
        },
        {
          id: 'schedule',
          type: 'schedule',
          heading: 'Schedule',
          background: 'surface',
          days: [
            {
              label: 'Day 1',
              items: [
                { time: '09:00', title: 'Registration' },
                { time: '10:00', title: 'Opening keynote' },
              ],
            },
          ],
        },
        {
          id: 'tickets',
          type: 'pricing',
          heading: 'Tickets',
          plans: [
            { name: 'Standard', price: '$99', features: ['All talks', 'Lunch'], action: { label: 'Buy', href: '#' } },
            { name: 'VIP', price: '$249', features: ['All talks', 'Workshops', 'Speaker dinner'], action: { label: 'Buy', href: '#' }, highlighted: true },
          ],
        },
        {
          id: 'faq',
          type: 'faq',
          heading: 'FAQ',
          background: 'surface',
          items: [{ question: 'Is there a code of conduct?', answer: 'Yes, and we enforce it.' }],
        },
      ],
    },
  ],
  changelog: [{ version: '1.0.0', notes: 'Initial release.' }],
});
