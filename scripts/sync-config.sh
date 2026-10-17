#!/bin/bash
# =============================================================================
# sync-config.sh – Synchronise les configurations entre cloud et self-hosted
# =============================================================================
# Reports reviewed non-secret configuration; never rewrites environment files.
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

echo 'Read-only report complete. No .env file was modified, regardless of ALLOW_ENV_WRITE.'
echo 'Manage server secrets outside the checkout; use scripts/prepare-public-config.mjs for public frontend settings.'