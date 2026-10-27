#!/usr/bin/env bash
# Follows the images CI publishes on every push to main. Run by the
# devprofile-deploy timer every 5 minutes (infra/systemd/):
#   1. reads the commit behind ghcr.io/.../devprofile-*:main;
#   2. if all three images are on the same new commit, starts that version;
#   3. if it doesn't come up healthy, goes back to the previous one.
# The deployed commit is kept as DEVPROFILE_VERSION in .env, so manual
# `docker compose` commands use the same version.
#
# `scripts/deploy.sh <commit>` deploys (or rolls back to) a specific commit.
set -euo pipefail
cd "$(dirname "$0")/.."

REGISTRY=ghcr.io/vitorpinhoalcantara
IMAGES=(devprofile-api devprofile-migrate devprofile-web)
COMPOSE=(docker compose -p devprofile)

log() { printf '%s %s\n' "$(date '+%F %T')" "$*"; }

exec 9> /tmp/devprofile-deploy.lock
flock -n 9 || exit 0

env_value() { sed -n "s/^$1=//p" .env | tail -1; }

report() {
  local url token
  url="$(env_value GATUS_URL)"
  token="$(env_value GATUS_DEPLOY_TOKEN)"
  [[ -n "$url" && -n "$token" ]] || return 0
  curl -fsS -X POST -H "Authorization: Bearer $token" -o /dev/null --get \
    --data-urlencode "success=$1" --data-urlencode "error=${2:-}" \
    "$url/api/v1/endpoints/homelab_deploy-devprofile/external" ||
    log "could not report to Gatus"
}

revision() {
  docker image inspect "$1" \
    --format '{{index .Config.Labels "org.opencontainers.image.revision"}}'
}

set_version() {
  if grep -q '^DEVPROFILE_VERSION=' .env; then
    sed -i "s/^DEVPROFILE_VERSION=.*/DEVPROFILE_VERSION=$1/" .env
  else
    printf '\n# Commit running in production (managed by scripts/deploy.sh).\nDEVPROFILE_VERSION=%s\n' "$1" >> .env
  fi
}

start() {
  DEVPROFILE_VERSION="$1" "${COMPOSE[@]}" up -d --wait --no-build --remove-orphans
}

current="$(env_value DEVPROFILE_VERSION)"
target="${1:-}"

if [[ -z "$target" ]]; then
  # CI publishes the three images in parallel; only deploy once all of them
  # point at the same commit.
  revisions=()
  for image in "${IMAGES[@]}"; do
    if ! docker pull -q "$REGISTRY/$image:main" > /dev/null 2>&1; then
      # Nothing published yet, or GHCR unreachable: try again on the next run.
      log "could not pull $image:main"
      exit 0
    fi
    revisions+=("$(revision "$REGISTRY/$image:main")")
  done
  target="${revisions[0]}"
  for r in "${revisions[@]}"; do
    [[ "$r" == "$target" ]] || {
      log "images not on the same commit yet (${revisions[*]}), waiting"
      exit 0
    }
  done
fi

[[ "$target" == "$current" ]] && exit 0

log "deploying ${target:0:7} (running: ${current:0:7})"
for image in "${IMAGES[@]}"; do
  docker pull -q "$REGISTRY/$image:$target" > /dev/null
done

if start "$target"; then
  set_version "$target"
  log "deployed ${target:0:7}"
  report true
  # Keep the images of the last few deploys for rollbacks; drop older ones.
  for image in "${IMAGES[@]}"; do
    docker images "$REGISTRY/$image" --format '{{.Tag}}' |
      grep -E '^[0-9a-f]{40}$' | tail -n +4 |
      xargs -r -I{} docker rmi -f "$REGISTRY/$image:{}" > /dev/null
  done
  docker image prune -f > /dev/null
  exit 0
fi

log "${target:0:7} did not come up healthy"
if [[ -n "$current" && "$current" != "local" ]]; then
  # The database is not rolled back: a migration that already ran stays.
  start "$current" && log "rolled back to ${current:0:7}"
fi
report false "${target:0:7} não subiu; voltou para ${current:0:7}"
exit 1
