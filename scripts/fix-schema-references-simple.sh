#!/bin/bash
# =============================================================================
# fix-schema-references-simple.sh – Version simplifiée
# =============================================================================

set -e

MIGRATION_DIR="supabase/migrations"

# ⬇️⬇️⬇️ CORRECTION ICI ⬇️⬇️⬇️
# Patterns à conserver dans public (user_roles, pas users_role)
KEEP_PATTERN="profiles|user_roles|users|auth|extensions|uuid-ossp|pgcrypto|pgjwt"

echo "🔧 Remplacement public. → btp. (sauf tables système)"

for file in "$MIGRATION_DIR"/*.sql; do
    echo "📝 $file"
    cp "$file" "$file.bak"
    
    # Remplacer public. par btp. sauf pour les tables système
    sed -i -E "
        s/public\.(($KEEP_PATTERN)\b)/public.\1/g
        s/public\.([a-zA-Z_]+)/btp.\1/g
    " "$file"
    
    # Rétablir public. pour les tables système
    for table in profiles user_roles users auth extensions; do
        sed -i "s/btp\.$table/public.$table/g" "$file"
    done
    
    echo "   ✅ Modifié"
done

echo "✅ Terminé"