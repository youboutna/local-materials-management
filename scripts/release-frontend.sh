#!/usr/bin/env bash
# Package an already-built dist; never build or start/stop the backend here.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
: "${PUBLIC_CONFIG_FILE:?Set PUBLIC_CONFIG_FILE to an absolute public config.js path}"
: "${APP_IMAGE_TAG:?Set a unique APP_IMAGE_TAG for rollback}"
[[ "$APP_IMAGE_TAG" =~ ^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$ && "$APP_IMAGE_TAG" != latest && "$APP_IMAGE_TAG" != local ]] || { echo 'Use an immutable release tag, not latest or local.' >&2; exit 1; }
[[ "$PUBLIC_CONFIG_FILE" = /* && -f "$PUBLIC_CONFIG_FILE" ]] || { echo 'Public config.js must exist at an absolute path.' >&2; exit 1; }
[[ -s dist/index.html ]] || { echo 'Missing dist: run npm ci and npm run build first.' >&2; exit 1; }
node scripts/check-public-config.mjs "$PUBLIC_CONFIG_FILE"
command -v docker >/dev/null || { echo 'Docker is required on the release server.' >&2; exit 1; }
command -v curl >/dev/null || { echo 'curl is required for release acceptance checks.' >&2; exit 1; }
if docker image inspect "hadratech-frontend:$APP_IMAGE_TAG" >/dev/null 2>&1; then
  echo 'Release image already exists. Use a new tag; use the rollback procedure to reuse an image.' >&2
  exit 1
fi
COMPOSE=(docker compose --project-name "${APP_COMPOSE_PROJECT:-hadratech-frontend}" --env-file /dev/null -f "$ROOT/docker-compose.frontend.yml")
"${COMPOSE[@]}" config -q
"${COMPOSE[@]}" build app
"${COMPOSE[@]}" up -d --no-build --no-deps --wait app
bash scripts/check-frontend-http.sh "http://127.0.0.1:${APP_PORT:-8088}"
echo 'Frontend released. Backend migrations, functions and authenticated workflows require separate validation.'