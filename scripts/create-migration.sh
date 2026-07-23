#!/bin/bash
# =============================================================================
# create-migration.sh – Crée un nouveau fichier de migration
# =============================================================================
# Format du nom : YYYYMMDDHHMMSS-<uuid>.sql
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$PROJECT_ROOT/supabase/migrations"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}❌ Please provide a migration name${NC}"
    echo "Usage: $0 <migration-name>"
    echo "Example: $0 add_users_table"
    exit 1
fi

NAME="$1"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
UUID=$(uuidgen 2>/dev/null || echo "$(date +%s%N | sha256sum | head -c 8)")
FILENAME="${TIMESTAMP}-${UUID}.sql"
FILEPATH="$MIGRATIONS_DIR/$FILENAME"

mkdir -p "$MIGRATIONS_DIR"

cat > "$FILEPATH" << EOF
-- =============================================================================
-- Migration: $NAME
-- Created: $(date)
-- =============================================================================

-- TODO: Write your migration here

EOF

echo -e "${GREEN}✅ Migration created: $FILEPATH${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Edit the migration file"
echo "   2. Commit the migration to version control"
echo "   3. Run the migration: docker exec -i supabase-db psql -U postgres < $FILEPATH"