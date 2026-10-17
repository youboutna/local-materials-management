#!/usr/bin/env bash
# Start the configured self-hosted stack without modifying environment files.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
STACK_DIR="${SUPABASE_DOCKER_DIR:-$PROJECT_ROOT/supabase/docker}"
DEV=false
SKIP_MIGRATIONS=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dev) DEV=true ;;
    --skip-migrations) SKIP_MIGRATIONS=true ;;
    --reset) echo "Destructive reset is disabled. Back up the database and reset manually." >&2; exit 1 ;;
    -h|--help) echo "Usage: $0 [--dev] [--skip-migrations]"; echo "Prepare server configuration manually. No secrets are generated, printed or rewritten."; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
  shift
done
command -v docker >/dev/null || { echo "Docker is required." >&2; exit 1; }
docker compose version >/dev/null
[[ -f "$STACK_DIR/docker-compose.yml" ]] || { echo "Supabase Compose configuration is missing." >&2; exit 1; }
[[ -f "$STACK_DIR/.env" ]] || { echo "Prepare the server environment manually before startup." >&2; exit 1; }
COMPOSE=(docker compose --project-directory "$STACK_DIR" --env-file "$STACK_DIR/.env" -f "$STACK_DIR/docker-compose.yml")
if [[ "$DEV" == true ]]; then
  [[ -f "$STACK_DIR/dev/docker-compose.dev.yml" ]] || { echo "Development override is missing." >&2; exit 1; }
  COMPOSE+=(-f "$STACK_DIR/dev/docker-compose.dev.yml")
fi
"${COMPOSE[@]}" config -q
"${COMPOSE[@]}" up -d --wait
"${COMPOSE[@]}" ps
if [[ "$SKIP_MIGRATIONS" == false ]]; then
  bash "$SCRIPT_DIR/setup-supabase-migrations.sh"
fi
echo "Containers started. Application readiness still requires explicit migrations, edge function deployment, HTTPS and authenticated CRUD/email checks."
echo "Existing environment files were not modified."
