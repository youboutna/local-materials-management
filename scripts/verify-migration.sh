#!/bin/bash
# =============================================================================
# verify-migration.sh – Vérification post-migration
# =============================================================================
# Usage: ./scripts/verify-migration.sh [--ref PROJECT_REF]
# =============================================================================
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'

PROJECT_REF="${NEW_PROJECT_REF:-VITE_SUPABASE_PROJECT_ID}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ref) PROJECT_REF="$2"; shift 2 ;;
    *) echo "Option inconnue: $1"; exit 1 ;;
  esac
done

echo -e "${GREEN}${BOLD}🔍 Vérification de la migration vers $PROJECT_REF${NC}"
echo ""

# Vérifier la connexion
echo "🔗 Vérification de la connexion..."
npx supabase link --project-ref "$PROJECT_REF" --force

# Vérifier les migrations
echo ""
echo "📋 Vérification des migrations..."
npx supabase migration list

# Vérifier les tables btp
echo ""
echo "📊 Vérification des tables du schéma btp..."
SQL