#!/bin/bash
# =============================================================================
# fix-migrations.sh – Corrige les noms des fichiers de migration
# =============================================================================
# La CLI Supabase attend le format: <timestamp>_<name>.sql
# Règle: Tous les '-' sont remplacés par '_' après le timestamp
# Sauvegarde dans scripts/.backup/ (pas de fichiers .bak dans migrations/)
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
echo -e "${YELLOW}📋 Règle: Tous les '-' → '_'${NC}"
echo ""

if [ ! -d "$MIGRATION_DIR" ]; then
    echo -e "${RED}❌ Dossier $MIGRATION_DIR non trouvé${NC}"
    exit 1
fi

cd "$MIGRATION_DIR"

# ⬇️⬇️⬇️ SUPPRIMER LES FICHIERS .bak AVANT DE COMMENCER ⬇️⬇️⬇️
echo -e "${YELLOW}🧹 Suppression des fichiers .bak existants...${NC}"
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
    # Vérifier si le nom est déjà au bon format (timestamp_name.sql sans '-')
    if [[ "$file" =~ ^[0-9]{14}_[a-zA-Z0-9_]+\.sql$ ]]; then
        echo -e "${GREEN}✅ $file (déjà correct)${NC}"
        continue
    fi

    # Extraire le timestamp (premiers 14 caractères)
    timestamp=$(echo "$file" | cut -c1-14)
    
    # Vérifier que le timestamp est numérique
    if [[ ! "$timestamp" =~ ^[0-9]{14}$ ]]; then
        echo -e "${RED}❌ $file: timestamp invalide ($timestamp)${NC}"
        continue
    fi

    # Extraire le nom et remplacer TOUS les '-' par '_'
    name_part=$(echo "$file" | sed 's/^[0-9]\{14\}-*//' | sed 's/\.sql$//')
    name_part=$(echo "$name_part" | tr '-' '_')
    
    if [ -z "$name_part" ]; then
        name_part="$timestamp"
    fi

    new_name="${timestamp}_${name_part}.sql"
    
    # Si le nouveau nom existe déjà, ajouter un suffixe
    if [ -f "$new_name" ] && [ "$file" != "$new_name" ]; then
        suffix="_$(date +%s)"
        new_name="${timestamp}_${name_part}${suffix}.sql"
    fi

    if [ "$file" != "$new_name" ]; then
        # Sauvegarder dans scripts/.backup/ (pas dans supabase/migrations/)
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