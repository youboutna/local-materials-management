#!/bin/bash
# =============================================================================
# fix-migrations.sh – Corrige les noms des fichiers de migration Supabase
# =============================================================================
# La CLI Supabase attend : <timestamp_14_chiffres>_<name>.sql
#
# CAS GÉRÉS :
#   1. Noms corrects → conservés
#   2. Timestamp trop court (8, 10, 11, 12, 13 chiffres) → complété par des zéros
#   3. Timestamp au format DDMMYYYYHHMMSS → reformaté en YYYYMMDDHHMMSS
#   4. Caractères invalides dans le nom → remplacés par '_'
#   5. Doubles underscores → simplifiés
#   6. Fichiers non-.sql (config.toml.prod, etc.) → déplacés hors migrations
#   7. Fallback : fichier sans timestamp valide → timestamp basé sur mtime
#
# Backup dans scripts/.backup/
# Idempotent : OUI (peut être relancé sans casser)
# =============================================================================

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATION_DIR="$PROJECT_ROOT/supabase/migrations"
BACKUP_DIR="$SCRIPT_DIR/.backup"

echo -e "${GREEN}${BOLD}🔧 Correction des noms de migrations${NC}"
echo -e "${YELLOW}📋 Format attendu : <14_chiffres>_<name>.sql${NC}"
echo ""

if [ ! -d "$MIGRATION_DIR" ]; then
    echo -e "${RED}❌ Dossier $MIGRATION_DIR non trouvé${NC}"
    exit 1
fi

cd "$MIGRATION_DIR"
mkdir -p "$BACKUP_DIR"

# -----------------------------------------------------------------------------
# ÉTAPE 0 : Déplacer les fichiers NON-.sql hors du dossier
# -----------------------------------------------------------------------------
echo -e "${BLUE}📦 ÉTAPE 0 : Déplacement des fichiers non-.sql${NC}"

for f in *; do
    [ -f "$f" ] || continue
    if [[ ! "$f" =~ \.sql$ ]] && [[ "$f" != "." ]] && [[ "$f" != ".." ]]; then
        target="$PROJECT_ROOT/supabase/$f"
        if [ ! -f "$target" ]; then
            mv "$f" "$target"
            echo -e "   ${YELLOW}→ $f déplacé vers supabase/$f${NC}"
        else
            echo -e "   ${RED}⚠️  supabase/$f existe déjà — $f ignoré${NC}"
        fi
    fi
done
echo -e "${GREEN}✅ ÉTAPE 0 terminée${NC}"
echo ""

# -----------------------------------------------------------------------------
# ÉTAPE 1 : Nettoyer les .bak
# -----------------------------------------------------------------------------
rm -f *.bak 2>/dev/null || true

# -----------------------------------------------------------------------------
# ÉTAPE 2 : Compter
# -----------------------------------------------------------------------------
COUNT=$(ls -1 *.sql 2>/dev/null | wc -l | tr -d ' ')
if [ "$COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Aucun fichier SQL trouvé${NC}"
    exit 0
fi

echo -e "${YELLOW}📋 $COUNT fichiers SQL trouvés${NC}"
echo ""

# -----------------------------------------------------------------------------
# FONCTIONS UTILITAIRES
# -----------------------------------------------------------------------------

# Vérifie si un timestamp est valide (mois 01-12, jour 01-31, etc.)
is_valid_timestamp() {
    local ts="$1"
    if [[ ! "$ts" =~ ^[0-9]{14}$ ]]; then
        return 1
    fi
    local year="${ts:0:4}"
    local month="${ts:4:2}"
    local day="${ts:6:2}"
    local hour="${ts:8:2}"
    local min="${ts:10:2}"
    local sec="${ts:12:2}"

    # Année : 2000-2099
    [ "$year" -ge 2000 ] && [ "$year" -le 2099 ] || return 1
    # Mois : 01-12
    [ "$month" -ge 1 ] && [ "$month" -le 12 ] || return 1
    # Jour : 01-31
    [ "$day" -ge 1 ] && [ "$day" -le 31 ] || return 1
    # Heure : 00-23
    [ "$hour" -ge 0 ] && [ "$hour" -le 23 ] || return 1
    # Minute : 00-59
    [ "$min" -ge 0 ] && [ "$min" -le 59 ] || return 1
    # Seconde : 00-59
    [ "$sec" -ge 0 ] && [ "$sec" -le 59 ] || return 1

    return 0
}

# Nettoie un nom (remplace caractères invalides, collapse _)
clean_name() {
    local name="$1"
    # Remplacer tout sauf [a-zA-Z0-9_] par _
    name=$(echo "$name" | sed 's/[^a-zA-Z0-9_]/_/g')
    # Collapse doubles underscores
    name=$(echo "$name" | sed 's/__*/_/g')
    # Supprimer underscore initial/final
    name=$(echo "$name" | sed 's/^_//;s/_$//')
    # Si vide → "migration"
    [ -z "$name" ] && name="migration"
    echo "$name"
}

# Renomme un fichier avec backup
safe_rename() {
    local old="$1"
    local new="$2"

    if [ "$old" = "$new" ]; then
        return 0
    fi

    if [ -f "$new" ]; then
        echo -e "${RED}   ❌ Conflit: $new existe déjà — $old non renommé${NC}"
        return 1
    fi

    cp "$old" "$BACKUP_DIR/$old" 2>/dev/null || true
    mv "$old" "$new"
    echo -e "   ${YELLOW}→ $old → $new${NC}"
    return 0
}

# -----------------------------------------------------------------------------
# ÉTAPE 3 : Traiter chaque fichier
# -----------------------------------------------------------------------------
echo -e "${BLUE}🔍 ÉTAPE 3 : Analyse et renommage${NC}"
echo ""

MODIFIED=0
SKIPPED=0
FAILED=0

for file in *.sql; do
    [ -f "$file" ] || continue

    # --- 3.1 : Déjà correct ? ---
    if [[ "$file" =~ ^[0-9]{14}_[a-zA-Z0-9_]+\.sql$ ]]; then
        ts_part=$(echo "$file" | cut -c1-14)
        if is_valid_timestamp "$ts_part"; then
            echo -e "${GREEN}   ✅ $file (déjà correct)${NC}"
            SKIPPED=$((SKIPPED + 1))
            continue
        else
            echo -e "${YELLOW}   ⚠️  $file : timestamp invalide ($ts_part) → tentative de correction${NC}"
        fi
    fi

    # --- 3.2 : Extraire ce qui ressemble à un timestamp au début ---
    # On cherche une séquence de chiffres au début (peu importe la longueur)
    ts=""
    name_part=""

    if [[ "$file" =~ ^([0-9]+)([-_].*)?\.sql$ ]]; then
        ts="${BASH_REMATCH[1]}"
        # Récupérer le reste après le timestamp et le séparateur
        name_part=$(echo "$file" | sed -E 's/^[0-9]+[-_]?//;s/\.sql$//')
    else
        # Pas de timestamp détectable
        ts=""
        name_part=$(echo "$file" | sed 's/\.sql$//')
    fi

    # --- 3.3 : Cas particulier — timestamp au format DDMMYYYYHHMMSS ---
    # Détection : 14 chiffres, les 4 au milieu forment une année plausible (20XX)
    #             et les 4 premiers NE forment PAS une année plausible
    if [[ "$ts" =~ ^[0-9]{14}$ ]]; then
        first4="${ts:0:4}"
        middle4="${ts:4:4}"

        if [[ "$middle4" =~ ^20[0-9]{2}$ ]] && [[ ! "$first4" =~ ^20[0-9]{2}$ ]]; then
            # Reformatage DDMMYYYYHHMMSS → YYYYMMDDHHMMSS
            day="${ts:0:2}"
            month="${ts:2:2}"
            year="${ts:4:4}"
            rest="${ts:8:6}"
            new_ts="${year}${month}${day}${rest}"
            echo -e "   ${YELLOW}→ $file : DDMMYYYY reformaté en YYYYMMDD ($ts → $new_ts)${NC}"
            ts="$new_ts"
        fi
    fi

    # --- 3.4 : Compléter le timestamp à 14 chiffres ---
    ts_len=${#ts}

    case $ts_len in
        0)
            # Pas de timestamp → utiliser la date de modification du fichier
            ts=$(date -r "$file" +%Y%m%d%H%M%S 2>/dev/null || date +%Y%m%d%H%M%S)
            echo -e "   ${YELLOW}→ $file : pas de timestamp → $ts (mtime)${NC}"
            ;;
        8)
            # YYYYMMDD → YYYYMMDD000000
            ts="${ts}000000"
            ;;
        9)
            # YYYYMMDDH → YYYYMMDDHH0000
            ts="${ts}00000"
            ;;
        10)
            # YYYYMMDDHH → YYYYMMDDHH0000
            ts="${ts}0000"
            ;;
        11)
            # YYYYMMDDHHM → YYYYMMDDHHMM00
            ts="${ts}000"
            ;;
        12)
            # YYYYMMDDHHMM → YYYYMMDDHHMM00
            ts="${ts}00"
            ;;
        13)
            # YYYYMMDDHHMMS → YYYYMMDDHHMMSS
            ts="${ts}0"
            ;;
        14)
            # Déjà 14 → OK
            ;;
        *)
            # > 14 : tronquer à 14
            ts="${ts:0:14}"
            echo -e "   ${YELLOW}→ $file : timestamp trop long, tronqué à $ts${NC}"
            ;;
    esac

    # --- 3.5 : Valider le timestamp final ---
    if ! is_valid_timestamp "$ts"; then
        echo -e "${RED}   ❌ $file : timestamp invalide ($ts) — fallback sur mtime${NC}"
        ts=$(date -r "$file" +%Y%m%d%H%M%S 2>/dev/null || date +%Y%m%d%H%M%S)
    fi

    # --- 3.6 : Nettoyer le nom ---
    clean_name_val=$(clean_name "$name_part")

    # --- 3.7 : Construire le nouveau nom ---
    new_name="${ts}_${clean_name_val}.sql"

    # --- 3.8 : Si le nouveau nom existe déjà (autre fichier), ajouter suffixe ---
    if [ -f "$new_name" ] && [ "$file" != "$new_name" ]; then
        counter=1
        while [ -f "${ts}_${clean_name_val}_${counter}.sql" ]; do
            counter=$((counter + 1))
        done
        new_name="${ts}_${clean_name_val}_${counter}.sql"
        echo -e "   ${YELLOW}→ $file : conflit, nouveau nom = $new_name${NC}"
    fi

    # --- 3.9 : Renommer ---
    if safe_rename "$file" "$new_name"; then
        MODIFIED=$((MODIFIED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done

# -----------------------------------------------------------------------------
# ÉTAPE 4 : Vérification finale
# -----------------------------------------------------------------------------
echo ""
echo -e "${BLUE}🔍 ÉTAPE 4 : Vérification finale${NC}"
echo ""

REMAINING_INVALID=0
for file in *.sql; do
    [ -f "$file" ] || continue
    if [[ ! "$file" =~ ^[0-9]{14}_[a-zA-Z0-9_]+\.sql$ ]]; then
        echo -e "${RED}   ❌ ENCORE INVALIDE : $file${NC}"
        REMAINING_INVALID=$((REMAINING_INVALID + 1))
    else
        ts_part=$(echo "$file" | cut -c1-14)
        if ! is_valid_timestamp "$ts_part"; then
            echo -e "${RED}   ❌ TIMESTAMP INVALIDE : $file ($ts_part)${NC}"
            REMAINING_INVALID=$((REMAINING_INVALID + 1))
        fi
    fi
done

# -----------------------------------------------------------------------------
# ÉTAPE 5 : Rapport
# -----------------------------------------------------------------------------
echo ""
echo -e "${GREEN}${BOLD}════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  RAPPORT FINAL${NC}"
echo -e "${GREEN}${BOLD}════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}✅ Fichiers déjà corrects : $SKIPPED${NC}"
echo -e "  ${YELLOW}🔄 Fichiers renommés     : $MODIFIED${NC}"
echo -e "  ${RED}❌ Fichiers échoués       : $FAILED${NC}"
echo -e "  ${RED}❌ Invalides restants    : $REMAINING_INVALID${NC}"
echo ""

if [ "$MODIFIED" -eq 0 ] && [ "$REMAINING_INVALID" -eq 0 ]; then
    echo -e "${GREEN}✅ Aucune modification nécessaire${NC}"
    rmdir "$BACKUP_DIR" 2>/dev/null || true
elif [ "$REMAINING_INVALID" -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les fichiers sont maintenant valides${NC}"
    echo -e "${YELLOW}📋 Sauvegardes dans : $BACKUP_DIR${NC}"
    echo "   Supprimez-les si tout va bien : rm -rf $BACKUP_DIR"
else
    echo -e "${RED}⚠️  $REMAINING_INVALID fichiers restent invalides${NC}"
    echo -e "   Restaurez depuis $BACKUP_DIR si nécessaire"
fi

echo ""
echo -e "${BLUE}📋 Aperçu des 30 premiers fichiers :${NC}"
ls -1 *.sql | head -30

echo ""
echo -e "${YELLOW}📋 Prochaines étapes :${NC}"
echo "  1. Vérifier : ls supabase/migrations/ | head -30"
echo "  2. Réparer l'historique : bash scripts/repair-migration-history.sh"
echo "  3. Pousser : npx supabase db push --project-ref huttgbybeuzeikaqfvam"