#!/bin/bash
# =============================================================================
# export-data.sh – Export des données de l'ANCIEN projet Supabase
# =============================================================================
# Usage: ./scripts/export-data.sh [--schema btp] [--out data.sql]
# Prérequis: npx supabase login  (PAT depuis https://supabase.com/dashboard/account/tokens)
# =============================================================================
set -e

OLD_REF="${OLD_PROJECT_REF:-huttgbybeuzeikaqfvam}"
SCHEMA="btp"
OUT="data.sql"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --schema) SCHEMA="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    --ref) OLD_REF="$2"; shift 2 ;;
    *) echo "Option inconnue: $1"; exit 1 ;;
  esac
done

echo "🔗 Liaison à l'ancien projet: $OLD_REF"
npx supabase link --project-ref "$OLD_REF"

echo "📦 Export des données (schema=$SCHEMA) → $OUT"
npx supabase db dump --data-only --schema "$SCHEMA" -f "$OUT"

echo "✅ Export terminé: $OUT ($(wc -l < "$OUT") lignes)"
echo "➡️  Étape suivante: ./scripts/import-data.sh --file $OUT"
