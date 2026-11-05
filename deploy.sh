#!/usr/bin/env bash
# Self-hosted pipeline: build → sync functions → backend → migrations → frontend.
# Secrets come from supabase/docker/.env (not versioned); falls back to .env.hadratech placeholders.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
DOCKER_DIR="$ROOT/supabase/docker"
ENV_FILE="${BACKEND_ENV_FILE:-$DOCKER_DIR/.env}"
[ -f "$ENV_FILE" ] || ENV_FILE="$DOCKER_DIR/.env.hadratech"
echo "Backend env: $ENV_FILE"
grep -q 'your-super-secret\|your_smtp_password' "$ENV_FILE" && echo "⚠ Placeholder secrets detected: use supabase/docker/.env for production." >&2

echo "1/5 Build frontend"
npm ci && npm run build

echo "2/5 Sync Edge Functions"
mkdir -p "$DOCKER_DIR/volumes/functions"
for d in supabase/functions/*/; do
  n="$(basename "$d")"; [ "$n" = "_templates" ] && continue
  rm -rf "$DOCKER_DIR/volumes/functions/$n"; cp -r "$d" "$DOCKER_DIR/volumes/functions/$n"
done

echo "3/5 Start backend"
(cd "$DOCKER_DIR" && docker compose --env-file "$ENV_FILE" up -d --wait)

echo "4/5 Migrations"
POSTGRES_DB="$(grep -E '^POSTGRES_DB=' "$ENV_FILE" | cut -d= -f2)" bash scripts/apply-selfhosted-migrations.sh

echo "5/5 Frontend release"
if grep -rqE 'service_role|SERVICE_ROLE_KEY' dist/; then echo "Service role key reference found in bundle." >&2; exit 1; fi
: "${PUBLIC_CONFIG_FILE:?Set PUBLIC_CONFIG_FILE (absolute path to reviewed config.js with the public URL and anon key)}"
export APP_IMAGE_TAG="${APP_IMAGE_TAG:-$(date -u +%Y%m%d%H%M%S)}"
bash scripts/release-frontend.sh
echo "Deployed. Check: curl -s http://localhost:8000/functions/v1/hello"
