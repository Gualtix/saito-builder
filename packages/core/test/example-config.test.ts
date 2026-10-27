import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { registry } from '@saito/templates';
import { environments, findProjectRoot, parseSiteConfig, readYamlFile, resolveSite, sectionTypes } from '../src/index.ts';

// sites/example.config.yaml is the annotated master reference; keep it valid as the schema evolves.
const path = join(findProjectRoot(import.meta.dirname), 'sites', 'example.config.yaml');

describe('sites/example.config.yaml', () => {
  const config = parseSiteConfig(readYamlFile(path), 'sites/example.config.yaml');
  const template = registry.resolve(config.template).manifest;

  it.each(environments)('resolves against its template in %s', (env) => {
    expect(() => resolveSite(config, template, { env })).not.toThrow();
  });

  it('section catalog shows every section type', () => {
    const catalog = resolveSite(config, template, { env: 'production' }).pages.find((p) => p.slug === 'reference/section-catalog');
    expect(new Set(catalog?.sections.map((s) => s.type))).toEqual(new Set(sectionTypes));
  });
});
