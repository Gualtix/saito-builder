#!/usr/bin/env bash
# Cloudflare Pages build command for one Git-connected project per site: ./scripts/pages-build.sh <site>
# Output directory: dist/pages. SAITO_ENV comes from the project's variables (Production: production,
# Preview: staging); Cloudflare has no env files. Triggered by deploy hooks (Sanity publish webhooks).
set -euo pipefail

site="${1:?site id required}"
env="${SAITO_ENV:?Set SAITO_ENV in the Pages project settings}"
cd "$(dirname "${BASH_SOURCE[0]}")/.."

npm run -s saito -- build "$site" --env "$env"
rm -rf dist/pages
cp -R "dist/$env/$site" dist/pages
