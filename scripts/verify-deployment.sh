#!/bin/bash
# =============================================================================
# verify-deployment.sh – Vérification du déploiement
# =============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Charger .env.production
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

PROJECT_ID="$VITE_SUPABASE_PROJECT_ID"

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ VITE_SUPABASE_PROJECT_ID non défini${NC}"
    exit 1
fi

echo -e "${GREEN}🔍 Vérification du déploiement${NC}"
echo -e "${YELLOW}📋 Project ID: $PROJECT_ID${NC}"
echo ""

# Vérifier l'API
if curl -s -o /dev/null -w "%{http_code}" "https://$PROJECT_ID.supabase.co/rest/v1/health" | grep -q "200"; then
    echo -e "${GREEN}✅ API accessible${NC}"
else
    echo -e "${RED}❌ API inaccessible${NC}"
fi

# Vérifier les migrations
npx supabase migration list

echo -e "${GREEN}✅ Vérification terminée${NC}"