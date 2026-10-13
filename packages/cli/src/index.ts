import { parseArgs } from 'node:util';
import { environments, findProjectRoot, type Environment } from '@saito/core';
import * as commands from './commands.ts';
import { red } from './output.ts';
import { seed } from './seed.ts';

const HELP = `saito — Saito Builder website factory

Usage: npm run saito -- <command> [options]

Commands
  sites [--tenant <t>] [--json]                 List sites
  templates [<template>] [--json]               Browse the template marketplace
  create <site> --template <t>[@range] --tenant <t> [--name "…"] [--url https://…]
                                                Create a site from a template
  validate [<site>…] [--all] [--tenant <t>]     Validate site configs against their templates
  build <site>… | --all | --tenant <t>          Build static sites into dist/<env>/<site>
  dev <site>                                    Start the dev server for one site
  outdated                                      Sites with a newer template major available
  affected [<file>…] [--json]                   Sites affected by changed files (reads stdin if no files)
  upgrade <site> [--to <version>] [--dry-run]   Upgrade a site to a new template major
  seed [<site>…|--all|--tenant <t>] [--dry-run] [--overwrite]
                                                Push local content + images to Sanity (needs SANITY_WRITE_TOKEN)

Options
  --env <development|staging|production>        Target environment (default: $SAITO_ENV or development)
`;

async function main(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      all: { type: 'boolean' },
      tenant: { type: 'string' },
      template: { type: 'string' },
      name: { type: 'string' },
      url: { type: 'string' },
      to: { type: 'string' },
      env: { type: 'string' },
      json: { type: 'boolean' },
      'dry-run': { type: 'boolean' },
      overwrite: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  const [command, ...rest] = positionals;
  if (!command || values.help) {
    console.log(HELP);
    return 0;
  }

  const env = (values.env ?? process.env.SAITO_ENV ?? 'development') as Environment;
  if (!environments.includes(env)) throw new Error(`--env must be one of ${environments.join(', ')}`);
  const ctx: commands.Context = { root: findProjectRoot(), env };
  const selection = { sites: rest, all: values.all, tenant: values.tenant };

  switch (command) {
    case 'sites':
      commands.sites(ctx, { tenant: values.tenant, json: values.json });
      return 0;
    case 'templates':
      commands.templates(ctx, { id: rest[0], json: values.json });
      return 0;
    case 'create':
      commands.create(ctx, { id: rest[0], template: values.template, tenant: values.tenant, name: values.name, url: values.url });
      return 0;
    case 'validate':
      return (await commands.validate(ctx, selection)) ? 0 : 1;
    case 'build':
      return (await commands.build(ctx, selection)) ? 0 : 1;
    case 'dev':
      return (await commands.dev(ctx, selection)) ? 0 : 1;
    case 'outdated':
      commands.outdated(ctx);
      return 0;
    case 'affected': {
      // Changed files come from arguments or stdin, e.g. `git diff --name-only origin/main | saito affected`.
      const files = rest.length > 0 ? rest : (await readStdin()).split('\n');
      const ids = commands.affected(ctx, files);
      console.log(values.json ? JSON.stringify(ids) : ids.join('\n'));
      return 0;
    }
    case 'seed': {
      const ids = commands.selectSites(ctx.root, { ...selection, all: values.all ?? rest.length === 0 });
      return (await seed(ctx, ids, { dryRun: values['dry-run'], overwrite: values.overwrite })) ? 0 : 1;
    }
    case 'upgrade':
      return (await commands.upgrade(ctx, { sites: rest, to: values.to, dryRun: values['dry-run'] })) ? 0 : 1;
    default:
      console.error(`Unknown command "${command}"\n\n${HELP}`);
      return 1;
  }
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return '';
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error(red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  },
);
