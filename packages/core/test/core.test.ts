import { describe, expect, it } from 'vitest';
import {
  SiteConfigError,
  deepMerge,
  parseSiteConfig,
  renderRichText,
  resolveSite,
  sanityToOverlay,
  satisfies,
  safeHref,
  themeToCss,
  type SiteConfigInput,
} from '../src/index.ts';
import { registry } from '@saito/templates';

const base: SiteConfigInput = { id: 'demo', tenant: 'acme', name: 'Demo', template: 'landing@1' };
const resolve = (input: Partial<SiteConfigInput>, env: 'development' | 'production' = 'production') => {
  const config = parseSiteConfig({ ...base, ...input }, 'test');
  return resolveSite(config, registry.resolve(config.template).manifest, { env });
};

describe('deepMerge', () => {
  it('merges objects, replaces arrays and removes keys set to null', () => {
    expect(deepMerge({ a: { b: 1, c: 2 }, list: [1, 2], gone: true }, { a: { c: 3 }, list: [9], gone: null })).toEqual({
      a: { b: 1, c: 3 },
      list: [9],
    });
  });

  it('does not mutate its inputs', () => {
    const original = { a: { b: 1 } };
    deepMerge(original, { a: { b: 2 } });
    expect(original.a.b).toBe(1);
  });
});

describe('semver ranges', () => {
  it.each([
    ['1.2.0', '1', true],
    ['2.0.0', '1', false],
    ['1.4.0', '1.2', true],
    ['1.1.9', '1.2', false],
    ['1.2.5', '^1.2.3', true],
    ['1.3.0', '~1.2.0', false],
    ['3.0.0', 'latest', true],
  ])('%s satisfies %s → %s', (version, range, expected) => {
    expect(satisfies(version, range)).toBe(expected);
  });
});

describe('template registry', () => {
  it('resolves the highest version within the pinned major', () => {
    expect(registry.resolve('landing@1').manifest.version).toBe('1.2.0');
    expect(registry.resolve('landing@latest').manifest.version).toBe('2.0.0');
  });

  it('reports unknown templates and unsatisfiable ranges', () => {
    expect(() => registry.resolve('nope@1')).toThrow(/Unknown template/);
    expect(() => registry.resolve('landing@9')).toThrow(/No version/);
  });

  it('builds migration paths between majors', () => {
    expect(registry.migrationPath('landing', '1.2.0', '2.0.0').map((m) => `${m.from}->${m.to}`)).toEqual(['1->2']);
  });
});

describe('resolveSite', () => {
  it('inherits everything from the template when nothing is overridden', () => {
    const site = resolve({});
    expect(site.pages.map((p) => p.path)).toEqual(['/']);
    expect(site.pages[0]!.sections.map((s) => s.id)).toEqual(['hero', 'features', 'pricing', 'signup']);
    expect(site.theme.colors.primary).toBe('#1d4ed8');
    expect(site.seo.titleTemplate).toBe('%s | Demo');
  });

  it('applies theme, section, removal, addition and ordering overrides', () => {
    const site = resolve({
      theme: { colors: { primary: '#ff0000' } },
      pages: {
        index: {
          sections: {
            hero: { heading: 'Custom heading' },
            pricing: false,
            faq: { type: 'faq', items: [{ question: 'Q?', answer: 'A.' }] },
          },
          order: ['faq'],
        },
      },
    });
    const sections = site.pages[0]!.sections;
    expect(sections.map((s) => s.id)).toEqual(['faq', 'hero', 'features', 'signup']);
    expect(sections.find((s) => s.id === 'hero')).toMatchObject({ heading: 'Custom heading', subheading: expect.any(String) });
    expect(site.theme.colors.primary).toBe('#ff0000');
    expect(site.theme.colors.background).toBe('#ffffff');
  });

  it('adds pages that the template does not have', () => {
    const site = resolve({
      pages: { 'legal/privacy': { title: 'Privacy', sections: { body: { type: 'richText', body: 'We respect your privacy.' } } } },
    });
    expect(site.pages.find((p) => p.slug === 'legal/privacy')?.path).toBe('/legal/privacy/');
  });

  it('collects every problem into one SiteConfigError', () => {
    try {
      resolve({
        theme: { colors: { primary: 'red' } },
        pages: {
          index: { sections: { hero: { type: 'faq' }, unknown: { heading: 'x' }, features: { columns: 7 } } },
          extra: { sections: {} },
        },
      });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(SiteConfigError);
      const paths = (error as SiteConfigError).issues.map((i) => i.path);
      expect(paths).toEqual(
        expect.arrayContaining([
          'theme.colors.primary',
          'pages.index.sections.hero.type',
          'pages.index.sections.unknown',
          'pages.index.sections.features.columns',
          'pages.extra.title',
        ]),
      );
    }
  });

  it('never exposes server-side form secrets to the renderer', () => {
    const site = resolve({ integrations: { forms: { endpoint: 'https://api.example', webhookUrl: 'https://hooks.example/secret' } } });
    expect(site.integrations.forms).toEqual({ endpoint: 'https://api.example' });
  });

  it('picks the URL for the target environment', () => {
    const environments = { production: { url: 'https://demo.example/' } };
    expect(resolve({ environments }, 'production').url).toBe('https://demo.example');
    expect(resolve({ environments }, 'development').url).toBe('http://localhost:4321');
  });
});

describe('template upgrades', () => {
  it('landing v1 → v2 migration keeps customisations on renamed sections', () => {
    const v1: SiteConfigInput = {
      ...base,
      navigation: { links: [], cta: { label: 'Join', href: '#signup' } },
      pages: { index: { sections: { signup: { heading: 'Join the waitlist' } }, order: ['signup'] } },
    };
    const [step] = registry.migrationPath('landing', '1.2.0', '2.0.0');
    const v2 = { ...step!.migrate(v1), template: 'landing@2' };

    expect(v2.navigation?.cta?.href).toBe('#get-started');
    const site = resolveSite(parseSiteConfig(v2, 'test'), registry.resolve('landing@2').manifest, { env: 'production' });
    const sections = site.pages[0]!.sections;
    expect(sections[0]).toMatchObject({ id: 'get-started', heading: 'Join the waitlist' });
    expect(sections.map((s) => s.id)).toContain('faq');
  });
});

describe('sanity overlay', () => {
  it('converts CMS documents into page overrides with image URLs', () => {
    const overlay = sanityToOverlay(
      {
        settings: { navigation: { links: [{ _key: 'a', label: 'Home', href: '/' }] }, footer: null, seo: null },
        pages: [
          {
            slug: 'index',
            title: 'Home',
            sections: [
              {
                _key: 'k1',
                _type: 'hero',
                sectionId: 'hero',
                heading: 'From the CMS',
                image: { _type: 'image', asset: { _ref: 'image-abc123-1200x800-jpg' }, alt: 'Alt' },
              },
            ],
          },
        ],
      },
      { projectId: 'proj', dataset: 'production' },
    );
    expect(overlay.navigation).toEqual({ links: [{ label: 'Home', href: '/' }] });
    expect(overlay.pages?.index).toEqual({
      title: 'Home',
      order: ['hero'],
      sections: {
        hero: {
          type: 'hero',
          heading: 'From the CMS',
          image: { src: 'https://cdn.sanity.io/images/proj/production/abc123-1200x800.jpg', alt: 'Alt' },
        },
      },
    });
  });
});

describe('rendering helpers', () => {
  it('escapes HTML and neutralises javascript: links in rich text', () => {
    const html = renderRichText('<script>x</script> **bold** [ok](https://a.example) [bad](javascript:alert(1))');
    expect(html).not.toContain('<script>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('href="https://a.example"');
    expect(html).toContain('href="#"');
  });

  it('only allows safe link protocols', () => {
    expect(safeHref('javascript:alert(1)')).toBe('#');
    expect(safeHref('/about/')).toBe('/about/');
    expect(safeHref('mailto:a@b.c')).toBe('mailto:a@b.c');
  });

  it('emits theme CSS variables', () => {
    const css = themeToCss(registry.resolve('corporate@1').manifest.theme);
    expect(css).toContain('--saito-color-primary: #0f766e;');
    expect(css).toContain('--saito-font-heading: "Manrope"');
  });
});
