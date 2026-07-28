#!/bin/bash
# =============================================================================
# fix-migrations.sh – Corrige les noms des fichiers de migration
# =============================================================================
# La CLI Supabase attend le format: <timestamp>_<name>.sql
# Règle: 
#   - Vérifie si '_' existe déjà après le timestamp
#   - Remplace les '-' par '_' si nécessaire
#   - Supprime les doubles underscores '__'
# Sauvegarde dans scripts/.backup/
# =============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATION_DIR="$PROJECT_ROOT/supabase/migrations"
BACKUP_DIR="$SCRIPT_DIR/.backup"

echo -e "${GREEN}${BOLD}🔧 Correction des noms de migrations${NC}"
echo -e "${YELLOW}📋 Format attendu: <timestamp>_<name>.sql${NC}"
echo -e "${YELLOW}📋 Règles:${NC}"
echo "   - Vérifier si '_' existe après le timestamp"
echo "   - Remplacer les '-' par '_'"
echo "   - Supprimer les doubles underscores '__'"
echo ""

if [ ! -d "$MIGRATION_DIR" ]; then
    echo -e "${RED}❌ Dossier $MIGRATION_DIR non trouvé${NC}"
    exit 1
fi

cd "$MIGRATION_DIR"

# Nettoyer les fichiers .bak
echo -e "${YELLOW}🧹 Nettoyage des fichiers .bak...${NC}"
rm -f *.bak 2>/dev/null || true
echo -e "${GREEN}✅ Fichiers .bak supprimés${NC}"
echo ""

# Compter les fichiers
COUNT=$(ls -1 *.sql 2>/dev/null | wc -l)
if [ "$COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Aucun fichier SQL trouvé${NC}"
    exit 0
fi

echo -e "${YELLOW}📋 $COUNT fichiers trouvés${NC}"
echo ""

MODIFIED=0

for file in *.sql; do
    ORIGINAL="$file"
    NEW="$file"
    
    # 1. Vérifier si le nom est déjà au bon format (timestamp_name.sql)
    if [[ "$file" =~ ^[0-9]{14}_[a-zA-Z0-9_]+\.sql$ ]]; then
        echo -e "${GREEN}✅ $file (déjà correct)${NC}"
        continue
    fi

    # 2. Extraire le timestamp (premiers 14 caractères)
    timestamp=$(echo "$file" | cut -c1-14)
    
    # Vérifier que le timestamp est numérique
    if [[ ! "$timestamp" =~ ^[0-9]{14}$ ]]; then
        echo -e "${RED}❌ $file: timestamp invalide ($timestamp)${NC}"
        continue
    fi

    # 3. Extraire la partie après le timestamp
    # Supprimer le timestamp et le séparateur
    name_part=$(echo "$file" | sed 's/^[0-9]\{14\}//' | sed 's/\.sql$//')
    
    # 4. Supprimer le premier caractère si c'est '-' ou '_'
    name_part=$(echo "$name_part" | sed 's/^[-_]//')
    
    # 5. ⬇️⬇️⬇️ VÉRIFICATION SI '_' EXISTE DÉJÀ ⬇️⬇️⬇️
    # Si le nom contient déjà '_' (pas de '-' à remplacer), on garde le nom
    if [[ "$name_part" =~ ^[a-zA-Z0-9_]+$ ]] && [[ ! "$name_part" =~ - ]]; then
        # Le nom est déjà valide (que des '_' et des caractères alphanumériques)
        new_name="${timestamp}_${name_part}.sql"
        if [ "$file" != "$new_name" ]; then
            echo -e "${YELLOW}   Renommer: $file → $new_name${NC}"
            mkdir -p "$BACKUP_DIR"
            cp "$file" "$BACKUP_DIR/$file"
            mv "$file" "$new_name"
            MODIFIED=$((MODIFIED + 1))
        fi
        continue
    fi
    
    # 6. Remplacer les '-' par '_' dans le nom
    name_part=$(echo "$name_part" | tr '-' '_')
    
    # 7. Supprimer les doubles underscores
    name_part=$(echo "$name_part" | sed 's/__/_/g')
    
    # 8. Si le nom est vide, utiliser "migration"
    if [ -z "$name_part" ]; then
        name_part="migration"
    fi

    # 9. Construire le nouveau nom
    new_name="${timestamp}_${name_part}.sql"
    
    # 10. Si le nouveau nom existe déjà, ajouter un suffixe
    if [ -f "$new_name" ] && [ "$file" != "$new_name" ]; then
        suffix="_$(date +%s)"
        new_name="${timestamp}_${name_part}${suffix}.sql"
    fi

    # 11. Renommer si différent
    if [ "$file" != "$new_name" ]; then
        mkdir -p "$BACKUP_DIR"
        cp "$file" "$BACKUP_DIR/$file"
        echo -e "${YELLOW}   Renommer: $file → $new_name${NC}"
        mv "$file" "$new_name"
        MODIFIED=$((MODIFIED + 1))
    fi
done

echo ""
if [ "$MODIFIED" -eq 0 ]; then
    echo -e "${GREEN}✅ Aucune modification nécessaire${NC}"
    rmdir "$BACKUP_DIR" 2>/dev/null || true
else
    echo -e "${GREEN}✅ $MODIFIED fichiers renommés${NC}"
    echo ""
    echo -e "${YELLOW}📋 Sauvegardes disponibles dans: $BACKUP_DIR${NC}"
    echo "   (supprimez le dossier si tout va bien: rm -rf $BACKUP_DIR)"
fi

echo ""
echo -e "${YELLOW}📋 Vérification:${NC}"
ls -la *.sql

echo ""
echo -e "${YELLOW}📋 Prochaines étapes:${NC}"
echo "  1. Pousser: npx supabase db push"
echo "  2. Vérifier: npx supabase migration list"