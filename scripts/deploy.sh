#!/usr/bin/env bash
# Hosting-agnostic deploy of one built site directory.
# Usage: scripts/deploy.sh <provider> <dist-dir> <site-id>
# Providers: cloudflare-pages | netlify | s3-cloudfront | none
# Credentials are read from the environment (see .github/workflows/deploy.yml); nothing is hard-coded.
set -euo pipefail

provider="${1:?provider required}"
dir="${2:?dist directory required}"
site="${3:?site id required}"
env="${SAITO_ENV:-staging}"

[ -d "$dir" ] || { echo "No build output at $dir" >&2; exit 1; }
[[ "$site" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] || { echo "Invalid site id: $site" >&2; exit 1; }

case "$provider" in
  cloudflare-pages)
    # One Pages project per site; the branch name selects preview vs production deployment.
    branch=$([ "$env" = production ] && echo main || echo "$env")
    npx --yes wrangler@3 pages deploy "$dir" --project-name "saito-$site" --branch "$branch"
    ;;
  netlify)
    # Expects a NETLIFY_SITE_ID_<SITE_ID_UPPER_SNAKE> variable per site.
    var="NETLIFY_SITE_ID_$(echo "$site" | tr 'a-z-' 'A-Z_')"
    site_id="${!var:?Set $var}"
    if [ "$env" = production ]; then flag=--prod; else flag="--alias=$env"; fi
    npx --yes netlify-cli@17 deploy --dir "$dir" --site "$site_id" "$flag"
    ;;
  s3-cloudfront)
    bucket="${S3_BUCKET_PREFIX:?Set S3_BUCKET_PREFIX}-$site-$env"
    # Fingerprinted assets are immutable; HTML is revalidated so content updates show immediately.
    aws s3 sync "$dir" "s3://$bucket" --delete --exclude "*.html" --exclude "_headers" \
      --cache-control "public, max-age=31536000, immutable"
    aws s3 sync "$dir" "s3://$bucket" --delete --exclude "*" --include "*.html" \
      --cache-control "public, max-age=0, s-maxage=3600, must-revalidate"
    # CLOUDFRONT_DISTRIBUTIONS is a JSON object: {"<site>-<env>": "<distribution-id>"}
    dist_id=$(printf '%s' "${CLOUDFRONT_DISTRIBUTIONS:-}" | jq -r --arg k "$site-$env" 'if . == null then empty else .[$k] // empty end' 2>/dev/null || true)
    if [ -n "$dist_id" ]; then
      aws cloudfront create-invalidation --distribution-id "$dist_id" --paths "/*" >/dev/null
    fi
    ;;
  none)
    echo "DEPLOY_PROVIDER not set; built $site for $env at $dir (no upload)."
    ;;
  *)
    echo "Unknown provider: $provider" >&2
    exit 1
    ;;
esac
