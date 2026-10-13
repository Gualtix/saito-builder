import type { TemplateManifest } from '@saito/core';
import { stringify } from 'yaml';

export interface ScaffoldInput {
  id: string;
  tenant: string;
  name: string;
  productionUrl?: string;
  template: TemplateManifest;
}

/** Renders a commented starter site.config.yaml that pins the template's current major version. */
export function scaffoldSiteConfig({ id, tenant, name, productionUrl, template }: ScaffoldInput): string {
  const major = template.version.split('.')[0];
  const firstSection = template.pages[0]?.sections[0];
  const environments = {
    staging: { url: `https://${id}.staging.example.com` },
    production: { url: productionUrl ?? `https://${id}.example.com` },
  };

  return `# ${name} — generated from template "${template.id}@${template.version}"
# Everything here overrides the template; anything omitted is inherited from it.
# Reference: docs/CONFIGURATION.md

id: ${id}
tenant: ${tenant}
name: ${JSON.stringify(name)}
description: ""
locale: en

# Major-version pin: minor and patch template updates are picked up automatically on the next build.
# Breaking (major) updates are applied with \`npm run saito -- upgrade ${id}\`.
template: ${template.id}@${major}

environments:
${indent(stringify(environments), 2)}
brand:
  logoText: ${JSON.stringify(name)}

# Override any theme token from the template, e.g.:
# theme:
#   colors:
#     primary: "#7c3aed"
#   fonts:
#     heading: Poppins
theme: {}

seo:
  titleTemplate: "%s | ${name.replace(/"/g, '\\"')}"

integrations: {}
  # forms:
  #   endpoint: https://api.example.com
  # analytics:
  #   provider: plausible
  #   id: ${id}.example.com

# Page content overrides. Section ids come from the template (see \`npm run saito -- templates ${template.id}\`).
pages:
  index:
    sections:
      ${firstSection?.id ?? 'hero'}:
        ${firstSection && 'heading' in firstSection ? `heading: ${JSON.stringify(`Welcome to ${name}`)}` : '{}'}
`;
}

function indent(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line ? pad + line : line))
    .join('\n');
}
