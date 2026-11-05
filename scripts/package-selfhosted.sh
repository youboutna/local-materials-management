#!/usr/bin/env bash
# Build a self-hosted release archive: dist + backend compose + migrations + functions + scripts.
# Excludes every .env (except versioned .env.hadratech placeholders), DB data and .git.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
[ "${SKIP_BUILD:-0}" = 1 ] || { npm ci && npm run build; }
[ -s dist/index.html ] || { echo "Missing dist/index.html" >&2; exit 1; }
TAG="${APP_IMAGE_TAG:-$(date -u +%Y%m%d%H%M%S)}"
OUT="$ROOT/hadratech-selfhosted-$TAG.zip"
zip -qr -9 "$OUT" dist docker/frontend docker-compose.frontend.yml \
  supabase/docker supabase/migrations supabase/functions \
  scripts/deploy-selfhosted.sh scripts/apply-selfhosted-migrations.sh scripts/release-frontend.sh \
  scripts/check-frontend-http.sh scripts/check-public-config.mjs docs/SELF_HOSTED_RELEASE.md \
  -x '*/.git/*' '*/node_modules/*' 'supabase/docker/volumes/db/data/*' 'supabase/docker/volumes/storage/*' \
     'supabase/docker/.env' '*.env.local*' '*/.env.production*'
if zipinfo -1 "$OUT" | grep -E '(^|/)\.env($|\.)' | grep -v '\.env\.hadratech$' | grep -v '\.env\.example$'; then
  echo "Private env file found in archive: aborting." >&2; rm -f "$OUT"; exit 1
fi
echo "Archive: $OUT ($(zipinfo -1 "$OUT" | wc -l | xargs) files)"
echo "Server: unzip -q $(basename "$OUT") -d hadratech && cd hadratech && cp supabase/docker/.env.hadratech supabase/docker/.env (edit secrets) && SKIP_BUILD=1 PUBLIC_CONFIG_FILE=/abs/config.js bash scripts/deploy-selfhosted.sh"
