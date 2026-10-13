import { environmentFromProcess, findProjectRoot, loadResolvedSite, type ResolvedSite } from '@saito/core';
import { registry } from '@saito/templates';

let cached: Promise<ResolvedSite> | undefined;

/** Resolves the site selected by SAITO_SITE once per build and shares it across pages. */
export function getSite(): Promise<ResolvedSite> {
  const siteId = process.env.SAITO_SITE;
  if (!siteId) throw new Error('SAITO_SITE is not set');
  cached ??= loadResolvedSite(siteId, {
    root: findProjectRoot(),
    env: environmentFromProcess(),
    registry,
  });
  return cached;
}
