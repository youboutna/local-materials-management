#!/bin/bash
# =============================================================================
# setup-supabase-migrations.sh – Lie les migrations HadraTech aux volumes
# =============================================================================
# Les fichiers de migration sont dans /supabase/migrations/
# Ils sont montés directement dans le conteneur via docker-compose.yml
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_SRC="$PROJECT_ROOT/supabase/migrations"
SUPABASE_DOCKER_DIR="$PROJECT_ROOT/supabase/docker"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}📦 Setting up HadraTech migrations for Supabase self-hosted...${NC}"

# Vérification des migrations
if [ ! -d "$MIGRATIONS_SRC" ]; then
    echo -e "${RED}❌ $MIGRATIONS_SRC not found.${NC}"
    exit 1
fi

# Compter les fichiers de migration
COUNT=$(ls -1 "$MIGRATIONS_SRC"/*.sql 2>/dev/null | wc -l)
if [ "$COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No migration files found in $MIGRATIONS_SRC${NC}"
    echo "   Create a migration file with: ./scripts/create-migration.sh <name>"
    exit 1
fi

echo -e "${GREEN}✅ Found $COUNT migration files${NC}"
echo ""
echo "📋 Migration files:"
ls -1 "$MIGRATIONS_SRC"/*.sql | while read -r file; do
    echo "   - $(basename "$file")"
done

echo ""
echo -e "${GREEN}✅ Migrations are ready.${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. The migrations are mounted via docker-compose.yml"
echo "   2. Start Supabase: cd $SUPABASE_DOCKER_DIR && sh run.sh start"
echo "   3. Migrations will run automatically on startup"