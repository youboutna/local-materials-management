#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://127.0.0.1:8088}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
curl --fail --silent --show-error "$BASE/healthz" | grep -qx ok
curl --fail --silent --show-error "$BASE/projects/release-check" > "$TMP/index.html"
grep -q 'id="root"' "$TMP/index.html"
curl --fail --silent --show-error -D "$TMP/headers" "$BASE/config.js" > "$TMP/config.js"
grep -qi 'cache-control:.*no-store' "$TMP/headers"
node "$(dirname "$0")/check-public-config.mjs" "$TMP/config.js"
CODE="$(curl --silent --output /dev/null --write-out '%{http_code}' "$BASE/assets/nonexistent-release-check.mjs")"
[[ "$CODE" = 404 ]] || { echo 'Missing assets must return 404, not SPA HTML.' >&2; exit 1; }
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKER="$(ls "$ROOT"/dist/assets/pdf.worker*.mjs 2>/dev/null | head -n 1)"
[[ -n "$WORKER" ]] || { echo 'PDF worker missing from dist.' >&2; exit 1; }
curl --fail --silent --show-error -D "$TMP/worker-headers" "$BASE/assets/$(basename "$WORKER")" -o /dev/null
grep -qi 'content-type:.*application/javascript' "$TMP/worker-headers"
echo 'Health, SPA routing, runtime config, asset 404 and PDF worker MIME verified.'