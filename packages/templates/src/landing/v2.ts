import { defineTemplate, isPlainObject, type SiteConfigInput } from '@saito/core';
import { themes } from '../themes.ts';

/**
 * v2 (breaking): the closing call to action is renamed "signup" → "get-started",
 * and the page gains logo-cloud and FAQ sections. The migration carries site overrides across.
 */
export default defineTemplate(
  {
    id: 'landing',
    name: 'Launch Landing Page',
    version: '2.0.0',
    description: 'Single-page product launch with hero, logos, features, pricing, FAQ and a closing call to action.',
    websiteTypes: ['landing-page', 'campaign', 'product-showcase', 'microsite'],
    tags: ['single-page', 'saas', 'conversion'],
    theme: themes.ocean,
    navigation: {
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'FAQ', href: '#faq' },
      ],
      cta: { label: 'Get started', href: '#get-started' },
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
            layout: 'split',
            eyebrow: 'New',
            heading: 'Launch your product in days, not months',
            subheading: 'Everything you need to go from idea to customers.',
            primaryAction: { label: 'Get started', href: '#get-started' },
            secondaryAction: { label: 'See features', href: '#features' },
          },
          {
            id: 'logos',
            type: 'logoCloud',
            heading: 'Trusted by teams at',
            logos: [{ name: 'Northwind' }, { name: 'Contoso' }, { name: 'Globex' }, { name: 'Initech' }],
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
              { name: 'Starter', price: '$0', period: '/month', features: ['1 project', 'Community support'], action: { label: 'Start free', href: '#get-started' } },
              {
                name: 'Pro',
                price: '$29',
                period: '/month',
                features: ['Unlimited projects', 'Priority support'],
                action: { label: 'Go Pro', href: '#get-started' },
                highlighted: true,
              },
            ],
          },
          {
            id: 'faq',
            type: 'faq',
            heading: 'Frequently asked questions',
            items: [
              { question: 'Can I cancel anytime?', answer: 'Yes. Plans are month-to-month.' },
              { question: 'Do you offer discounts?', answer: 'Non-profits and education get 50% off.' },
            ],
          },
          {
            id: 'get-started',
            type: 'cta',
            heading: 'Ready to launch?',
            body: 'Join thousands of teams shipping faster.',
            primaryAction: { label: 'Create your account', href: '#' },
            background: 'primary',
          },
        ],
      },
    ],
    changelog: [{ version: '2.0.0', notes: 'Renamed section "signup" → "get-started"; added logo cloud and FAQ.' }],
  },
  [
    {
      from: 1,
      to: 2,
      notes: 'Renames page section "signup" to "get-started" and rewrites #signup links.',
      migrate: (config: SiteConfigInput) => {
        const next = structuredClone(config);
        const sections = next.pages?.index?.sections;
        if (sections && 'signup' in sections) {
          const renamed: Record<string, unknown> = {};
          for (const [id, value] of Object.entries(sections)) renamed[id === 'signup' ? 'get-started' : id] = value;
          next.pages!.index!.sections = renamed as typeof sections;
        }
        const order = next.pages?.index?.order;
        if (order) next.pages!.index!.order = order.map((id) => (id === 'signup' ? 'get-started' : id));
        return rewriteHrefs(next, '#signup', '#get-started');
      },
    },
  ],
);

function rewriteHrefs<T>(value: T, from: string, to: string): T {
  if (Array.isArray(value)) return value.map((v) => rewriteHrefs(v, from, to)) as T;
  if (!isPlainObject(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) out[key] = key === 'href' && v === from ? to : rewriteHrefs(v, from, to);
  return out as T;
}
