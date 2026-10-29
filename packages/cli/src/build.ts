import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Environment, ResolvedSite } from '@saito/core';

export function outputDir(root: string, env: Environment, siteId: string): string {
  return join(root, 'dist', env, siteId);
}

/** Runs the Astro renderer for one site. Resolves with the process exit code. */
export function runAstro(root: string, command: 'build' | 'dev' | 'preview', siteId: string, env: Environment): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['astro', command], {
      cwd: join(root, 'apps', 'renderer'),
      stdio: 'inherit',
      env: { ...process.env, SAITO_SITE: siteId, SAITO_ENV: env, SAITO_ROOT: root },
    });
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

/**
 * CDN hints written next to the built site.
 * `_headers` is understood by Cloudflare Pages and Netlify; other CDNs use the same values via deploy scripts.
 */
export function writeEdgeArtifacts(dir: string, site: ResolvedSite): void {
  mkdirSync(dir, { recursive: true });
  // Astro's content layer leaves empty module stubs in outDirs outside the project; they are never served.
  for (const stub of ['content-assets.mjs', 'content-modules.mjs']) rmSync(join(dir, stub), { force: true });
  const indexable = site.env === 'production' && !site.seo.noindex;
  const { commerce } = site.integrations;
  const { pwa } = site.brand;
  // Only the whatsapp delivery map asks for the device location.
  const geolocation = commerce?.provider === 'whatsapp' && commerce.location?.enabled ? '(self)' : '()';
  const security = [
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  X-Frame-Options: SAMEORIGIN',
    `  Permissions-Policy: camera=(), microphone=(), geolocation=${geolocation}`,
  ];
  writeFileSync(
    join(dir, '_headers'),
    [
      '/_astro/*',
      '  Cache-Control: public, max-age=31536000, immutable',
      '',
      '/*',
      '  Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      ...security,
      ...(indexable ? [] : ['  X-Robots-Tag: noindex']),
      '',
      // After /* on purpose: Cloudflare applies matching rules in file order, so the detach drops the
      // inherited s-maxage (which would pin an old worker at the edge) before no-cache is set.
      ...(pwa ? [pwa.serviceWorker, '  ! Cache-Control', '  Cache-Control: no-cache', ''] : []),
    ].join('\n'),
  );

  writeFileSync(
    join(dir, 'saito-manifest.json'),
    `${JSON.stringify(
      {
        site: site.id,
        tenant: site.tenant,
        env: site.env,
        url: site.url,
        template: site.template,
        pages: site.pages.map((p) => p.path),
        builtAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  );
}
