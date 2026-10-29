#!/usr/bin/env bash
# Build and deploy sites from your machine: ./deploy.sh <local|staging|production> <site...|--all> [--yes]
#
#   local       build for development and serve it at http://localhost:4321 (no upload)
#   staging     build for staging and upload it (Cloudflare branch "staging")
#   production  build for production and upload it (Cloudflare branch "main"); asks for confirmation
#
# Each site loads its own settings from environments/<site>/.<local|staging|prod>.env (git-ignored).
# The file is optional for local and required for staging and production. Sanity publishes do not use
# this script: they trigger Cloudflare deploy hooks, which run scripts/pages-build.sh.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
usage() { sed -n '2,10p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 1; }

target="${1:-}"; shift || true
case "$target" in
  local) saito_env=development; file_env=local ;;
  staging) saito_env=staging; file_env=staging ;;
  production) saito_env=production; file_env=prod ;;
  *) usage ;;
esac

sites=() yes=false
for arg in "$@"; do
  case "$arg" in
    --yes) yes=true ;;
    --all) for cfg in "$root"/sites/*/site.config.yaml; do sites+=("$(basename "$(dirname "$cfg")")"); done ;;
    -*) usage ;;
    *) sites+=("$arg") ;;
  esac
done
[ ${#sites[@]} -gt 0 ] || usage

for site in "${sites[@]}"; do
  [[ "$site" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] && [ -f "$root/sites/$site/site.config.yaml" ] || { echo "Unknown site: $site" >&2; exit 1; }
  env_file="$root/environments/$site/.$file_env.env"
  if [ "$target" != local ] && [ ! -s "$env_file" ]; then
    echo "Missing or empty $env_file (needs DEPLOY_PROVIDER and the provider's credentials)" >&2; exit 1
  fi
done

if [ "$target" = production ] && [ "$yes" = false ]; then
  [ -t 0 ] || { echo "Production deploy needs --yes when not run from a terminal" >&2; exit 1; }
  read -r -p "Deploy ${sites[*]} to PRODUCTION? Type 'production' to continue: " answer
  [ "$answer" = production ] || { echo "Cancelled."; exit 1; }
fi

failed=()
for site in "${sites[@]}"; do
  echo "▸ $site → $target"
  # Subshell: each site's env file stays out of the next site's build.
  if ! (
    env_file="$root/environments/$site/.$file_env.env"
    if [ -f "$env_file" ]; then set -a; . "$env_file"; set +a; fi
    export SAITO_ENV="$saito_env" # the target wins over whatever the file says
    cd "$root"
    npm run -s saito -- build "$site" --env "$saito_env"
    dist="dist/$saito_env/$site"
    if [ "$target" = local ]; then
      [ ${#sites[@]} -eq 1 ] || exit 0 # several sites: build only, there is one preview port
      cd apps/renderer && SAITO_SITE="$site" SAITO_ROOT="$root" exec npx astro preview
    fi
    [ -n "${DEPLOY_PROVIDER:-}" ] && [ "$DEPLOY_PROVIDER" != none ] || { echo "Set DEPLOY_PROVIDER in $env_file" >&2; exit 1; }
    ./scripts/deploy.sh "$DEPLOY_PROVIDER" "$dist" "$site"
  ); then
    failed+=("$site")
  fi
done

[ ${#failed[@]} -eq 0 ] || { echo "Failed: ${failed[*]}" >&2; exit 1; }
echo "Done: ${sites[*]} → $target"
