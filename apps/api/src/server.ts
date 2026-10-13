import { join } from 'node:path';
import { environmentFromProcess, findProjectRoot } from '@saito/core';
import { buildApp } from './app.ts';
import { fileSink } from './sink.ts';

const root = findProjectRoot(import.meta.dirname);
const app = await buildApp({
  root,
  env: environmentFromProcess(),
  sink: fileSink(process.env.API_DATA_DIR ?? join(import.meta.dirname, '..', 'data')),
  logger: true,
});

await app.listen({ port: Number(process.env.API_PORT ?? 8787), host: process.env.API_HOST ?? '0.0.0.0' });
