#!/bin/bash
# =============================================================================
# migrate-project.sh – ORCHESTRATEUR : Migration vers le nouveau projet Supabase
# =============================================================================
# Exécute les ÉTAPES 4 → 8 du plan de migration.
#
#   4. Liaison + poussée des migrations vers le nouveau projet
#   5. Export/Import des données (schéma btp) depuis l'ancien projet
#   6. Création des tables manquantes (oauth_providers)
#   7. Génération des types TypeScript
#   8. Test (npm run dev)
#
# Prérequis: npx supabase login   (Personal Access Token)
# Usage:     ./scripts/migrate-project.sh [--skip-data] [--yes]
# =============================================================================
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'; BOLD='\033[1m'

NEW_REF="${NEW_PROJECT_REF:-ttrfbzonzcyimfmezuqv}"
OLD_REF="${OLD_PROJECT_REF:-huttgbybeuzeikaqfvam}"
SCHEMA="${MIGRATION_SCHEMA:-btp}"
SKIP_DATA=0
ASSUME_YES=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-data) SKIP_DATA=1; shift ;;
    --yes|-y) ASSUME_YES=1; shift ;;
    *) echo "Option inconnue: $1"; exit 1 ;;
  esac
done

confirm() {
  [ "$ASSUME_YES" -eq 1 ] && return 0
  read -r -p "$1 [y/N] " r
  [[ "$r" =~ ^[Yy]$ ]]
}

echo -e "${GREEN}${BOLD}🚀 Migration Supabase : $OLD_REF → $NEW_REF${NC}"
echo ""

# ---- Vérification session CLI -----------------------------------------------
if ! npx supabase projects list >/dev/null 2>&1; then
  echo -e "${RED}❌ Non authentifié.${NC} Lancez d'abord :"
  echo "   npx supabase login"
  exit 1
fi

# ---- ÉTAPE 4 : LIAISON ET POUSSÉE -------------------------------------------
echo -e "${YELLOW}${BOLD}▶ ÉTAPE 4 – Liaison et poussée des migrations${NC}"
npx supabase link --project-ref "$NEW_REF"
npx supabase migration list
if confirm "Pousser les migrations vers $NEW_REF ?"; then
  npx supabase db push
  echo -e "${GREEN}✅ Migrations poussées${NC}"
else
  echo -e "${YELLOW}⏭  Poussée ignorée${NC}"
fi
echo ""

# ---- ÉTAPE 5 : RÉCUPÉRATION DES DONNÉES -------------------------------------
if [ "$SKIP_DATA" -eq 0 ]; then
  echo -e "${YELLOW}${BOLD}▶ ÉTAPE 5 – Export/Import des données (schéma $SCHEMA)${NC}"
  if confirm "Exporter les données de $OLD_REF (schéma $SCHEMA) ?"; then
    ./scripts/export-data.sh --ref "$OLD_REF" --schema "$SCHEMA" --out data.sql
    if confirm "Importer data.sql dans $NEW_REF ?"; then
      ./scripts/import-data.sh --ref "$NEW_REF" --file data.sql
    fi
  fi
  echo ""
fi

# ---- ÉTAPE 6 : TABLES MANQUANTES --------------------------------------------
echo -e "${YELLOW}${BOLD}▶ ÉTAPE 6 – Tables manquantes (oauth_providers)${NC}"
npx supabase link --project-ref "$NEW_REF" >/dev/null 2>&1 || true
if [ -f sql/oauth_providers.sql ]; then
  npx supabase db execute --file sql/oauth_providers.sql || \
    echo -e "${YELLOW}⚠️  À exécuter manuellement dans le SQL Editor: sql/oauth_providers.sql${NC}"
else
  echo -e "${YELLOW}⚠️  sql/oauth_providers.sql absent${NC}"
fi
echo ""

# ---- ÉTAPE 7 : GÉNÉRATION DES TYPES -----------------------------------------
echo -e "${YELLOW}${BOLD}▶ ÉTAPE 7 – Génération des types TypeScript${NC}"
npx supabase gen types typescript --linked > src/integrations/supabase/types.gen.ts
echo -e "${GREEN}✅ src/integrations/supabase/types.gen.ts généré${NC}"
echo ""

# ---- ÉTAPE 8 : TEST ----------------------------------------------------------
echo -e "${YELLOW}${BOLD}▶ ÉTAPE 8 – Test${NC}"
echo "   npm run dev   → tester connexion, projets, paiements"
echo ""
echo -e "${GREEN}${BOLD}✅ Migration terminée${NC}"
