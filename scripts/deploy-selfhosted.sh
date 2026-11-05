#!/usr/bin/env bash
# Différent de scripts/deploy.sh (migrations via la CLI Supabase, cloud ou local).
# Self-hosted pipeline: build → sync functions → backend → migrations → frontend.
# Secrets come from supabase/docker/.env (not versioned); falls back to .env.hadratech placeholders.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
DOCKER_DIR="$ROOT/supabase/docker"
ENV_FILE="${BACKEND_ENV_FILE:-$DOCKER_DIR/.env}"
[ -f "$ENV_FILE" ] || ENV_FILE="$DOCKER_DIR/.env.hadratech"
for c in docker curl; do command -v $c >/dev/null || { echo "Missing prerequisite: $c" >&2; exit 1; }; done
docker compose version >/dev/null 2>&1 || { echo "Missing prerequisite: docker compose v2" >&2; exit 1; }
if [ "${SKIP_BUILD:-0}" != 1 ]; then
  command -v node >/dev/null || { echo "Node $(cat "$ROOT/.nvmrc") required to build (or use SKIP_BUILD=1 with a packaged dist)." >&2; exit 1; }
  [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 18 ] || { echo "Node >= 18 required (recommended: $(cat "$ROOT/.nvmrc"))." >&2; exit 1; }
fi
echo "Backend env: $ENV_FILE"
grep -q 'your-super-secret\|your_smtp_password' "$ENV_FILE" && echo "⚠ Placeholder secrets detected: use supabase/docker/.env for production." >&2

echo "1/5 Build frontend"
if [ "${SKIP_BUILD:-0}" = 1 ]; then [ -s dist/index.html ] || { echo "SKIP_BUILD=1 but dist/ missing" >&2; exit 1; }; else npm ci && npm run build; fi

echo "2/5 Sync Edge Functions"
mkdir -p "$DOCKER_DIR/volumes/functions"
for d in supabase/functions/*/; do
  n="$(basename "$d")"; [ "$n" = "_templates" ] && continue
  [ "$n" = "main" ] && continue  # keep upstream dispatcher
  rm -rf "$DOCKER_DIR/volumes/functions/$n"; cp -r "$d" "$DOCKER_DIR/volumes/functions/$n"
done

echo "3/5 Start backend"
(cd "$DOCKER_DIR" && docker compose --env-file "$ENV_FILE" up -d --wait)

echo "4/5 Migrations"
POSTGRES_DB="$(grep -E '^POSTGRES_DB=' "$ENV_FILE" | cut -d= -f2)" bash scripts/apply-selfhosted-migrations.sh

echo "5/5 Frontend release"
SRK="$(grep -E '^SERVICE_ROLE_KEY=' "$ENV_FILE" | cut -d= -f2-)"
if [ -n "$SRK" ] && grep -rqF "$SRK" dist/; then echo "Service role key found in bundle: aborting." >&2; exit 1; fi
: "${PUBLIC_CONFIG_FILE:?Set PUBLIC_CONFIG_FILE (absolute path to reviewed config.js with the public URL and anon key)}"
export APP_IMAGE_TAG="${APP_IMAGE_TAG:-$(date -u +%Y%m%d%H%M%S)}"
bash scripts/release-frontend.sh
echo "Deployed. Check: curl -s http://localhost:8000/functions/v1/hello"
