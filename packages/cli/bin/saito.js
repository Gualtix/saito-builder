#!/usr/bin/env node
// Thin launcher so `saito` works as an installed binary; the CLI itself is TypeScript run through tsx.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const entry = fileURLToPath(new URL('../src/index.ts', import.meta.url));
const result = spawnSync(process.execPath, ['--import', 'tsx', entry, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(result.status ?? 1);
