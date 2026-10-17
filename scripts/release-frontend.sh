#!/usr/bin/env bash
# Package an already-built dist; never build or start/stop the backend here.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
: "${PUBLIC_CONFIG_FILE:?Set PUBLIC_CONFIG_FILE to an absolute public config.js path}"
: "${APP_IMAGE_TAG:?Set a unique APP_IMAGE_TAG for rollback}"
[[ "$PUBLIC_CONFIG_FILE" = /* && -f "$PUBLIC_CONFIG_FILE" ]] || { echo 'Public config.js must exist at an absolute path.' >&2; exit 1; }
[[ -s dist/index.html ]] || { echo 'Missing dist: run npm ci and npm run build first.' >&2; exit 1; }
node scripts/check-public-config.mjs "$PUBLIC_CONFIG_FILE"
command -v docker >/dev/null || { echo 'Docker is required on the release server.' >&2; exit 1; }
COMPOSE=(docker compose --project-name "${APP_COMPOSE_PROJECT:-hadratech-frontend}" --env-file /dev/null -f "$ROOT/docker-compose.frontend.yml")
"${COMPOSE[@]}" config -q
"${COMPOSE[@]}" build app
"${COMPOSE[@]}" up -d --no-deps --wait app
bash scripts/check-frontend-http.sh "http://127.0.0.1:${APP_PORT:-8088}"
echo 'Frontend released. Backend migrations, functions and authenticated workflows require separate validation.'