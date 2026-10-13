import { defineTemplate } from '@saito/core';
import { themes } from '../themes.ts';

export default defineTemplate({
  id: 'landing',
  name: 'Launch Landing Page',
  version: '1.2.0',
  description: 'Single-page product launch with hero, features, social proof, pricing and a sign-up call to action.',
  websiteTypes: ['landing-page', 'campaign', 'product-showcase', 'microsite'],
  tags: ['single-page', 'saas', 'conversion'],
  theme: themes.ocean,
  navigation: {
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
    ],
    cta: { label: 'Get started', href: '#signup' },
  },
  footer: { legal: '© All rights reserved.' },
  pages: [
    {
      slug: 'index',
      title: 'Home',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          eyebrow: 'New',
          heading: 'Launch your product in days, not months',
          subheading: 'Everything you need to go from idea to customers.',
          primaryAction: { label: 'Get started', href: '#signup' },
          secondaryAction: { label: 'See features', href: '#features' },
        },
        {
          id: 'features',
          type: 'features',
          heading: 'Why teams choose us',
          items: [
            { icon: '⚡', title: 'Fast', description: 'Pages served from the edge in milliseconds.' },
            { icon: '🔒', title: 'Secure', description: 'No servers to patch, nothing to hack.' },
            { icon: '📈', title: 'Scalable', description: 'From ten visitors to ten million.' },
          ],
        },
        {
          id: 'pricing',
          type: 'pricing',
          heading: 'Simple pricing',
          background: 'surface',
          plans: [
            { name: 'Starter', price: '$0', period: '/month', features: ['1 project', 'Community support'], action: { label: 'Start free', href: '#signup' } },
            {
              name: 'Pro',
              price: '$29',
              period: '/month',
              features: ['Unlimited projects', 'Priority support'],
              action: { label: 'Go Pro', href: '#signup' },
              highlighted: true,
            },
          ],
        },
        {
          id: 'signup',
          type: 'cta',
          heading: 'Ready to launch?',
          body: 'Join thousands of teams shipping faster.',
          primaryAction: { label: 'Create your account', href: '#' },
          background: 'primary',
        },
      ],
    },
  ],
  changelog: [
    { version: '1.2.0', notes: 'Pricing section uses the surface background.' },
    { version: '1.1.0', notes: 'Added feature icons.' },
    { version: '1.0.0', notes: 'Initial release.' },
  ],
});
