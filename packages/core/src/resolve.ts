import { SiteConfigError, zodIssues, type ConfigIssue } from './errors.ts';
import { deepMerge, isPlainObject } from './merge.ts';
import { sectionSchema, type Section } from './schema/sections.ts';
import {
  footerSchema,
  seoSchema,
  type Environment,
  type Footer,
  type Integrations,
  type Navigation,
  type PageOverride,
  type Seo,
  type SiteConfig,
} from './schema/site.ts';
import type { TemplateManifest } from './schema/template.ts';
import { themeSchema, type Theme } from './schema/theme.ts';
import type { Image } from './schema/primitives.ts';

export interface ResolvedPage {
  slug: string;
  /** URL path with leading and trailing slash, e.g. "/" or "/about/". */
  path: string;
  title: string;
  description: string;
  sections: Section[];
}

/** Integrations safe to expose to the browser (server-only secrets removed). */
export type PublicIntegrations = Omit<Integrations, 'forms'> & { forms?: { endpoint: string } };

export interface ResolvedSite {
  id: string;
  tenant: string;
  name: string;
  description: string;
  locale: string;
  env: Environment;
  /** Absolute base URL for the target environment, without trailing slash. */
  url: string;
  template: { id: string; version: string };
  brand: { logo?: Image; logoText: string; favicon?: string; pwa?: SiteConfig['brand']['pwa'] };
  theme: Theme;
  navigation: Navigation;
  footer: Footer;
  seo: Seo & { titleTemplate: string };
  integrations: PublicIntegrations;
  pages: ResolvedPage[];
}

export interface ResolveOptions {
  env: Environment;
}

const DEV_URL = 'http://localhost:4321';

export function pagePath(slug: string): string {
  return slug === 'index' ? '/' : `/${slug}/`;
}

/**
 * Turns a generic template plus a site's overrides into a fully-specified, validated site.
 * Precedence (lowest → highest): template defaults → site config (incl. content overlays).
 */
export function resolveSite(config: SiteConfig, template: TemplateManifest, options: ResolveOptions): ResolvedSite {
  const issues: ConfigIssue[] = [];

  const theme = themeSchema.safeParse(deepMerge(template.theme, config.theme));
  if (!theme.success) issues.push(...zodIssues(theme.error, 'theme'));

  const footer = footerSchema.safeParse(deepMerge(template.footer, config.footer ?? {}));
  if (!footer.success) issues.push(...zodIssues(footer.error, 'footer'));

  const seo = seoSchema.parse(deepMerge(template.seo, config.seo));

  const pages: ResolvedPage[] = [];
  const templateSlugs = new Set(template.pages.map((p) => p.slug));

  for (const page of template.pages) {
    const override = config.pages[page.slug];
    if (override?.enabled === false) continue;
    const sections = applySectionOverrides(page.sections, override, `pages.${page.slug}`, issues);
    pages.push({
      slug: page.slug,
      path: pagePath(page.slug),
      title: override?.title ?? page.title,
      description: override?.description ?? page.description ?? config.description,
      sections,
    });
  }

  for (const [slug, override] of Object.entries(config.pages)) {
    if (templateSlugs.has(slug) || !override.enabled) continue;
    const at = `pages.${slug}`;
    if (!override.title) issues.push({ path: `${at}.title`, message: 'required for pages that are not part of the template' });
    const sections = applySectionOverrides([], override, at, issues);
    if (sections.length === 0) issues.push({ path: `${at}.sections`, message: 'a new page needs at least one section with a "type"' });
    pages.push({
      slug,
      path: pagePath(slug),
      title: override.title ?? slug,
      description: override.description ?? config.description,
      sections,
    });
  }

  if (!pages.some((p) => p.slug === 'index')) issues.push({ path: 'pages', message: 'the site must have an "index" page' });

  if (issues.length > 0 || !theme.success || !footer.success) {
    throw new SiteConfigError(`Site "${config.id}"`, issues);
  }

  const { forms, ...integrations } = config.integrations;

  return {
    id: config.id,
    tenant: config.tenant,
    name: config.name,
    description: config.description,
    locale: config.locale,
    env: options.env,
    url: siteUrl(config, options.env),
    template: { id: template.id, version: template.version },
    brand: { ...config.brand, logoText: config.brand.logoText ?? config.name },
    theme: theme.data,
    navigation: config.navigation ?? template.navigation,
    footer: footer.data,
    seo: { ...seo, titleTemplate: seo.titleTemplate ?? `%s | ${config.name}` },
    integrations: { ...integrations, ...(forms ? { forms: { endpoint: forms.endpoint } } : {}) },
    pages,
  };
}

export function siteUrl(config: SiteConfig, env: Environment): string {
  const url = config.environments[env]?.url ?? (env === 'development' ? DEV_URL : config.environments.production?.url ?? DEV_URL);
  return url.replace(/\/+$/, '');
}

function applySectionOverrides(
  templateSections: Section[],
  override: PageOverride | undefined,
  at: string,
  issues: ConfigIssue[],
): Section[] {
  const byId = new Map<string, unknown>(templateSections.map((s) => [s.id, s]));
  const order = templateSections.map((s) => s.id);

  for (const [id, patch] of Object.entries(override?.sections ?? {})) {
    const path = `${at}.sections.${id}`;
    const existing = byId.get(id) as Section | undefined;

    if (patch === false) {
      if (!existing) issues.push({ path, message: 'cannot remove a section that does not exist' });
      byId.delete(id);
      continue;
    }

    if (existing) {
      if (patch.type !== undefined && patch.type !== existing.type) {
        issues.push({ path: `${path}.type`, message: `cannot change section type from "${existing.type}" to "${String(patch.type)}"` });
        continue;
      }
      byId.set(id, deepMerge(existing, patch));
    } else if (typeof patch.type === 'string') {
      byId.set(id, { ...patch, id });
      order.push(id);
    } else {
      issues.push({ path, message: 'unknown section id; to add a new section, include its "type"' });
    }
  }

  const ordered = [...new Set([...(override?.order ?? []), ...order])];
  for (const id of override?.order ?? []) {
    if (!byId.has(id)) issues.push({ path: `${at}.order`, message: `unknown section id "${id}"` });
  }

  const sections: Section[] = [];
  for (const id of ordered) {
    const candidate = byId.get(id);
    if (!isPlainObject(candidate)) continue;
    const parsed = sectionSchema.safeParse(candidate);
    if (parsed.success) sections.push(parsed.data);
    else issues.push(...zodIssues(parsed.error, `${at}.sections.${id}`));
  }
  return sections;
}
