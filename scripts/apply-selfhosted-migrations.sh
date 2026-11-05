#!/usr/bin/env bash
# Apply supabase/migrations/*.sql in name order, once each, on the self-hosted DB container.
# Never prints or rewrites secrets.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_CONTAINER="${DB_CONTAINER:-supabase-db}"
PSQL=(docker exec -i "$DB_CONTAINER" psql -v ON_ERROR_STOP=1 -U postgres -d "${POSTGRES_DB:-postgres}" -qAt)

for i in $(seq 1 30); do
  docker exec "$DB_CONTAINER" pg_isready -U postgres >/dev/null 2>&1 && break
  [ "$i" = 30 ] && { echo "Database container $DB_CONTAINER not ready." >&2; exit 1; }
  sleep 2
done

"${PSQL[@]}" -c "CREATE TABLE IF NOT EXISTS public._migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now()); REVOKE ALL ON public._migrations FROM anon, authenticated;"

mapfile -t FILES < <(ls "$ROOT"/supabase/migrations/*.sql | sort)
FIRST="$(basename "${FILES[0]}")"
[ "$FIRST" = "20240129000000_bootstrap_core_schema.sql" ] || { echo "Unexpected first migration: $FIRST" >&2; exit 1; }

applied=0
for f in "${FILES[@]}"; do
  name="$(basename "$f")"
  done_flag="$("${PSQL[@]}" -c "SELECT 1 FROM public._migrations WHERE name = '$name'")"
  [ -n "$done_flag" ] && continue
  echo "→ $name"
  { echo "BEGIN;"; cat "$f"; echo; echo "INSERT INTO public._migrations(name) VALUES ('$name');"; echo "COMMIT;"; } | "${PSQL[@]}" >/dev/null
  applied=$((applied + 1))
done
echo "Migrations applied: $applied (total ${#FILES[@]})."
