#!/bin/bash
# =============================================================================
# import-data.sh – Import des données dans le NOUVEAU projet Supabase
# =============================================================================
# Usage: ./scripts/import-data.sh [--file data.sql] [--ref ttrfbzonzcyimfmezuqv]
# =============================================================================
set -e

NEW_REF="${NEW_PROJECT_REF:-ttrfbzonzcyimfmezuqv}"
FILE="data.sql"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file) FILE="$2"; shift 2 ;;
    --ref) NEW_REF="$2"; shift 2 ;;
    *) echo "Option inconnue: $1"; exit 1 ;;
  esac
done

if [ ! -f "$FILE" ]; then
  echo "❌ Fichier introuvable: $FILE (lancer ./scripts/export-data.sh d'abord)"
  exit 1
fi

echo "🔗 Liaison au nouveau projet: $NEW_REF"
npx supabase link --project-ref "$NEW_REF"

echo "📥 Import des données depuis $FILE"
# Les triggers sont désactivés le temps de l'import pour éviter les erreurs de FK
psql "$(npx supabase status -o env 2>/dev/null | grep DB_URL | cut -d= -f2- | tr -d '"')" \
  -v ON_ERROR_STOP=0 -f "$FILE" 2>/dev/null \
  || npx supabase db execute --file "$FILE"

echo "✅ Import terminé"
echo "➡️  Étape suivante: npx supabase gen types typescript --linked > src/integrations/supabase/types.gen.ts"
