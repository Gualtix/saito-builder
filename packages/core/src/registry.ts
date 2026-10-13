import { SiteConfigError, zodIssues } from './errors.ts';
import { compareVersions, parseTemplateRef, parseVersion, satisfies } from './semver.ts';
import {
  templateManifestSchema,
  type TemplateManifestInput,
  type TemplateMigration,
  type TemplateModule,
} from './schema/template.ts';

/** Validates a template definition at load time so broken templates never reach a build. */
export function defineTemplate(input: TemplateManifestInput, migrations: TemplateMigration[] = []): TemplateModule {
  const parsed = templateManifestSchema.safeParse(input);
  if (!parsed.success) {
    throw new SiteConfigError(`Template "${input.id}@${input.version}"`, zodIssues(parsed.error));
  }
  return { manifest: parsed.data, migrations };
}

/**
 * Holds every published version of every template (the "marketplace").
 * Multiple majors of the same template can coexist so sites can upgrade on their own schedule.
 */
export class TemplateRegistry {
  private readonly modules = new Map<string, TemplateModule[]>();

  constructor(modules: TemplateModule[] = []) {
    for (const mod of modules) this.register(mod);
  }

  register(mod: TemplateModule): this {
    const { id, version } = mod.manifest;
    const versions = this.modules.get(id) ?? [];
    if (versions.some((m) => m.manifest.version === version)) {
      throw new Error(`Template ${id}@${version} is registered twice`);
    }
    versions.push(mod);
    versions.sort((a, b) => compareVersions(a.manifest.version, b.manifest.version));
    this.modules.set(id, versions);
    return this;
  }

  ids(): string[] {
    return [...this.modules.keys()].sort();
  }

  versions(id: string): TemplateModule[] {
    return this.modules.get(id) ?? [];
  }

  latest(id: string): TemplateModule | undefined {
    return this.versions(id).at(-1);
  }

  /** Latest version of each template. */
  list(): TemplateModule[] {
    return this.ids().map((id) => this.latest(id)!);
  }

  /** Resolves "<id>@<range>" to the highest matching version. */
  resolve(ref: string): TemplateModule {
    const { id, range } = parseTemplateRef(ref);
    const versions = this.versions(id);
    if (versions.length === 0) {
      throw new Error(`Unknown template "${id}". Available: ${this.ids().join(', ') || '(none)'}`);
    }
    const match = versions.filter((m) => satisfies(m.manifest.version, range)).at(-1);
    if (!match) {
      throw new Error(
        `No version of template "${id}" matches "${range}". Available: ${versions.map((m) => m.manifest.version).join(', ')}`,
      );
    }
    return match;
  }

  /** Migrations needed to move a site from one major version to another, in order. */
  migrationPath(id: string, fromVersion: string, toVersion: string): TemplateMigration[] {
    const from = parseVersion(fromVersion).major;
    const to = parseVersion(toVersion).major;
    if (to < from) throw new Error(`Downgrading ${id} from ${fromVersion} to ${toVersion} is not supported`);

    const all = this.versions(id).flatMap((m) => m.migrations ?? []);
    const path: TemplateMigration[] = [];
    for (let major = from; major < to; major++) {
      const step = all.find((m) => m.from === major && m.to === major + 1);
      if (!step) throw new Error(`Template ${id} has no migration from v${major} to v${major + 1}`);
      path.push(step);
    }
    return path;
  }
}
