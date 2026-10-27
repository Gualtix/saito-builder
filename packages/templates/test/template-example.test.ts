import { describe, expect, it } from 'vitest';
import { environments, parseSiteConfig, resolveSite, sectionTypes } from '@saito/core';
import { registry } from '../src/index.ts';
import template, { exampleMigration, overrideContract } from '../src/template.example.ts';

// template.example.ts is the annotated master reference (validated by defineTemplate on import); keep it complete.
describe('template.example.ts', () => {
  const { manifest } = template;

  it('covers every section type', () => {
    expect(new Set(manifest.pages.flatMap((p) => p.sections.map((s) => s.type)))).toEqual(new Set(sectionTypes));
  });

  it.each(environments)('resolves for a site with no overrides in %s', (env) => {
    const config = parseSiteConfig({ id: 'example-site', tenant: 'example', name: 'Example Co', template: 'example@1' }, 'test');
    expect(() => resolveSite(config, manifest, { env })).not.toThrow();
  });

  it('is never registered in the marketplace', () => {
    expect(registry.ids()).not.toContain(manifest.id);
  });

  it('exposes the override contract', () => {
    expect(overrideContract.index).toEqual(['hero', 'stats', 'services', 'clients', 'testimonials', 'cta']);
  });

  it('example migration renames the section, its order entry and its links', () => {
    const migrated = exampleMigration.migrate({
      id: 's',
      tenant: 't',
      name: 'S',
      template: 'example@1',
      navigation: { links: [{ label: 'Services', href: '#services' }] },
      pages: { index: { sections: { services: { heading: 'Ours' }, hero: false }, order: ['services', 'hero'] } },
    });
    expect(migrated.pages?.index?.sections).toEqual({ offerings: { heading: 'Ours' }, hero: false });
    expect(migrated.pages?.index?.order).toEqual(['offerings', 'hero']);
    expect(migrated.navigation?.links?.[0]?.href).toBe('#offerings');
  });
});
