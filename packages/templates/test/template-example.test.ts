import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { environments, findProjectRoot, parseSiteConfig, readYamlFile, resolveSite, sectionTypes } from '@saito/core';
import { registry } from '../src/index.ts';
import template, { exampleMigration, overrideContract, templateExtensions } from '../src/template.example.ts';

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

type Flag = { affects: string[]; purpose: string; expectedBehavior: string; requirements: string[]; fallback: string };

// Unsupported-capability flags are the platform's requirements backlog: keep templates, the registry
// in template.example.ts and the x-patterns catalog in step.
describe('unsupported capabilities', () => {
  const src = join(import.meta.dirname, '../src');
  const root = findProjectRoot(import.meta.dirname);
  const patterns = Object.keys((readYamlFile(join(root, 'sites/example.config.yaml')) as { 'x-patterns': object })['x-patterns']);
  const registryEntries = templateExtensions.capabilities as Record<string, { support: string }>;
  const modules = readdirSync(src, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) => readdirSync(join(src, d.name)).map((f) => join(src, d.name, f)))
    .concat(join(src, 'template.example.ts'));

  it('every registered capability is an x-patterns key', () => {
    expect(Object.keys(registryEntries).filter((k) => !patterns.includes(k))).toEqual([]);
  });

  it.each(modules)('%s flags only registered, unsupported capabilities, completely', async (file) => {
    const mod = await import(file);
    const flags = (mod.templateExtensions?.unsupportedCapabilities ?? {}) as Record<string, Flag>;
    const ids = new Set(['header', 'footer', 'site', ...mod.default.manifest.pages.flatMap((p: { sections: { id: string }[] }) => p.sections.map((s) => s.id))]);
    for (const [key, flag] of Object.entries(flags)) {
      expect(registryEntries[key]?.support, key).toBe('unsupported');
      expect([flag.purpose, flag.expectedBehavior, flag.fallback].every(Boolean) && flag.requirements.length > 0, key).toBe(true);
      expect(flag.affects.filter((id) => !ids.has(id)), key).toEqual([]);
    }
  });
});
