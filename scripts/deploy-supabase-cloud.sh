#!/bin/bash
# =============================================================================
# deploy-supabase-cloud.sh – Déploiement vers Supabase Cloud
# =============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

# Charger les variables d'environnement
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Récupérer PROJECT_ID depuis .env
PROJECT_ID="$VITE_SUPABASE_PROJECT_ID"

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ VITE_SUPABASE_PROJECT_ID non défini dans .env.production${NC}"
    exit 1
fi

echo -e "${GREEN}${BOLD}🚀 Déploiement vers Supabase Cloud${NC}"
echo -e "${YELLOW}📋 Project ID: $PROJECT_ID${NC}"
echo ""

# ---- Étape 1: Vérification des migrations ----
echo -e "${YELLOW}[1/5] Vérification des migrations...${NC}"
COUNT=$(find supabase/migrations/ -name "*.sql" 2>/dev/null | wc -l)
echo "   📋 $COUNT fichiers trouvés"
echo ""

# ---- Étape 2: Connexion ----
echo -e "${YELLOW}[2/5] Connexion à Supabase...${NC}"
npx supabase login
echo ""

# ---- Étape 3: Lien du projet ----
echo -e "${YELLOW}[3/5] Lien du projet...${NC}"
npx supabase link --project-ref "$PROJECT_ID"
echo ""

# ---- Étape 4: Push des migrations ----
echo -e "${YELLOW}[4/5] Push des migrations...${NC}"
npx supabase db push
echo ""

# ---- Étape 5: Génération des types ----
echo -e "${YELLOW}[5/5] Génération des types...${NC}"
npx supabase gen types typescript --linked > src/integrations/supabase/types.gen.ts
echo ""

echo -e "${GREEN}${BOLD}✅ Déploiement terminé !${NC}"
echo -e "${YELLOW}📋 URL: https://$PROJECT_ID.supabase.co${NC}"