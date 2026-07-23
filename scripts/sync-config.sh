#!/bin/bash
# =============================================================================
# sync-config.sh – Synchronise les configurations entre cloud et self-hosted
# =============================================================================
# Extrait les valeurs de config.toml et les applique aux fichiers self-hosted
# =============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_TOML="$PROJECT_ROOT/supabase/config.toml"
ENV_HADRATECH="$PROJECT_ROOT/supabase/docker/.env.hadratech"
ENV_APP="$PROJECT_ROOT/.env"

echo -e "${GREEN}🔄 Synchronisation des configurations...${NC}"

# Vérifier que config.toml existe
if [ ! -f "$CONFIG_TOML" ]; then
    echo -e "${RED}❌ $CONFIG_TOML not found${NC}"
    exit 1
fi

# Extraire les schémas de config.toml
SCHEMAS=$(grep -E '^schemas = ' "$CONFIG_TOML" | sed 's/.*=\s*\[\(.*\)\]/\1/' | tr -d '"' | tr -d ' ')
EXTRA_SEARCH=$(grep -E '^extra_search_path = ' "$CONFIG_TOML" | sed 's/.*=\s*\[\(.*\)\]/\1/' | tr -d '"' | tr -d ' ')
SITE_URL=$(grep -E '^site_url = ' "$CONFIG_TOML" | sed 's/.*=\s*"\(.*\)"/\1/')

echo -e "${YELLOW}📋 Configuration extraite:${NC}"
echo "   Schemas: $SCHEMAS"
echo "   Extra search: $EXTRA_SEARCH"
echo "   Site URL: $SITE_URL"

# Mettre à jour .env.hadratech
if [ -f "$ENV_HADRATECH" ]; then
    echo -e "${YELLOW}📝 Mise à jour de $ENV_HADRATECH...${NC}"
    
    # Mettre à jour PGRST_DB_SCHEMAS
    sed -i "s|^PGRST_DB_SCHEMAS=.*$|PGRST_DB_SCHEMAS=$SCHEMAS|" "$ENV_HADRATECH"
    
    # Mettre à jour PGRST_DB_EXTRA_SEARCH_PATH
    sed -i "s|^PGRST_DB_EXTRA_SEARCH_PATH=.*$|PGRST_DB_EXTRA_SEARCH_PATH=$EXTRA_SEARCH|" "$ENV_HADRATECH"
    
    echo -e "${GREEN}✅ $ENV_HADRATECH mis à jour${NC}"
fi

# Mettre à jour .env (application)
if [ -f "$ENV_APP" ]; then
    echo -e "${YELLOW}📝 Mise à jour de $ENV_APP...${NC}"
    
    # Mettre à jour VITE_PGRST_SCHEMAS
    sed -i "s|^VITE_PGRST_SCHEMAS=.*$|VITE_PGRST_SCHEMAS=$SCHEMAS|" "$ENV_APP"
    
    # Mettre à jour VITE_PGRST_EXTRA_SEARCH_PATH
    sed -i "s|^VITE_PGRST_EXTRA_SEARCH_PATH=.*$|VITE_PGRST_EXTRA_SEARCH_PATH=$EXTRA_SEARCH|" "$ENV_APP"
    
    echo -e "${GREEN}✅ $ENV_APP mis à jour${NC}"
fi

echo -e "${GREEN}✅ Synchronisation terminée${NC}"