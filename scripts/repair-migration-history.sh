#!/bin/bash
# =============================================================================
# repair-migration-history.sh
# =============================================================================
# Objet : Réparer la table `supabase_migrations.schema_migrations` pour
#         synchroniser l'état remote avec les fichiers locaux de migration.
#
# CONTEXTE :
#   Après avoir normalisé les noms de fichiers (fix-migrations.sh), la CLI
#   Supabase peut encore signaler un désaccord entre :
#     - Les migrations LOCALES (fichiers .sql dans supabase/migrations/)
#     - Les migrations REMOTE (table supabase_migrations.schema_migrations)
#
#   Ce script détecte les différences et génère/exécute les commandes
#   `supabase migration repair` nécessaires.
#
# USAGE :
#   bash scripts/repair-migration-history.sh [PROJECT_REF] [--dry-run] [--yes]
#
#   PROJECT_REF : ref du projet Supabase (ex: huttgbybeuzeikaqfvam)
#                 Si absent, lu depuis supabase/config.toml ou .env
#   --dry-run   : Affiche les commandes sans les exécuter
#   --yes       : Ne demande pas de confirmation avant d'exécuter
#
# IDEMPOTENT : OUI (peut être relancé plusieurs fois sans effet de bord)
# =============================================================================

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATION_DIR="$PROJECT_ROOT/supabase/migrations"
CONFIG_FILE="$PROJECT_ROOT/supabase/config.toml"
ENV_FILE="$PROJECT_ROOT/.env"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Options
PROJECT_REF=""
DRY_RUN=false
AUTO_YES=false

# Logs
log_info()    { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_ok()      { echo -e "${GREEN}✅ $1${NC}"; }
log_warn()    { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error()   { echo -e "${RED}❌ $1${NC}"; }
log_section() { echo -e "${BOLD}${CYAN}$1${NC}"; }
log_cmd()     { echo -e "${MAGENTA}   \$ $1${NC}"; }

# =============================================================================
# PARSING DES ARGUMENTS
# =============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --yes|-y)
            AUTO_YES=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [PROJECT_REF] [--dry-run] [--yes]"
            echo ""
            echo "Options:"
            echo "  PROJECT_REF   Référence du projet Supabase"
            echo "  --dry-run     Affiche les commandes sans les exécuter"
            echo "  --yes, -y     Pas de confirmation avant exécution"
            exit 0
            ;;
        -*)
            log_error "Option inconnue : $1"
            exit 1
            ;;
        *)
            PROJECT_REF="$1"
            shift
            ;;
    esac
done

# =============================================================================
# RÉSOLUTION DU PROJECT_REF
# =============================================================================

resolve_project_ref() {
    if [ -n "$PROJECT_REF" ]; then
        return 0
    fi

    # Essayer depuis .env
    if [ -f "$ENV_FILE" ]; then
        local ref
        ref=$(grep -E '^SUPABASE_PROJECT_REF=' "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs || true)
        if [ -n "$ref" ]; then
            PROJECT_REF="$ref"
            log_info "PROJECT_REF lu depuis .env : $PROJECT_REF"
            return 0
        fi
    fi

    # Essayer depuis config.toml
    if [ -f "$CONFIG_FILE" ]; then
        local ref
        ref=$(grep -E '^project_id' "$CONFIG_FILE" 2>/dev/null | head -1 | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs || true)
        if [ -n "$ref" ]; then
            PROJECT_REF="$ref"
            log_info "PROJECT_REF lu depuis config.toml : $PROJECT_REF"
            return 0
        fi
    fi

    log_error "Impossible de déterminer le PROJECT_REF"
    log_info "Passez-le en argument : $0 <project-ref>"
    return 1
}

# =============================================================================
# VÉRIFICATIONS PRÉALABLES
# =============================================================================

check_prerequisites() {
    log_section "════════════════════════════════════════════════════════"
    log_section "  REPAIR MIGRATION HISTORY"
    log_section "════════════════════════════════════════════════════════"
    echo ""

    # Vérifier que le dossier migrations existe
    if [ ! -d "$MIGRATION_DIR" ]; then
        log_error "Dossier introuvable : $MIGRATION_DIR"
        exit 1
    fi

    # Vérifier que npx/supabase est disponible
    if ! command -v npx >/dev/null 2>&1; then
        log_error "npx introuvable — installez Node.js"
        exit 1
    fi

    # Vérifier que supabase CLI répond
    if ! npx supabase --version >/dev/null 2>&1; then
        log_error "Supabase CLI introuvable — installez-le : npm i -g supabase"
        exit 1
    fi

    log_ok "Prérequis OK"
    echo ""
}

# =============================================================================
# ÉTAPE 1 : COLLECTE DES MIGRATIONS LOCALES
# =============================================================================

collect_local_migrations() {
    log_section "📂 ÉTAPE 1 : Migrations locales"
    echo ""

    LOCAL_TIMESTAMPS=()
    LOCAL_FILES=()

    for f in "$MIGRATION_DIR"/*.sql; do
        [ -f "$f" ] || continue
        local basename_f
        basename_f=$(basename "$f")

        # Extraire le timestamp (14 chiffres au début)
        if [[ "$basename_f" =~ ^([0-9]{14})_ ]]; then
            LOCAL_TIMESTAMPS+=("${BASH_REMATCH[1]}")
            LOCAL_FILES+=("$basename_f")
        fi
    done

    # Trier
    if [ ${#LOCAL_TIMESTAMPS[@]} -gt 0 ]; then
        IFS=$'\n' LOCAL_TIMESTAMPS=($(sort <<<"${LOCAL_TIMESTAMPS[*]}"))
        unset IFS
    fi

    log_ok "${#LOCAL_TIMESTAMPS[@]} migrations locales"
    echo ""

    if [ ${#LOCAL_TIMESTAMPS[@]} -eq 0 ]; then
        log_warn "Aucune migration locale trouvée"
        log_info "Exécutez d'abord : bash scripts/fix-migrations.sh"
        exit 0
    fi
}

# =============================================================================
# ÉTAPE 2 : COLLECTE DES MIGRATIONS REMOTE
# =============================================================================

collect_remote_migrations() {
    log_section "☁️  ÉTAPE 2 : Migrations remote (via supabase CLI)"
    echo ""

    local tmp_output
    tmp_output=$(mktemp)

    log_info "Exécution de : npx supabase migration list --project-ref $PROJECT_REF"
    echo ""

    # La commande renvoie un tableau à 2 colonnes : Local | Remote
    # On extrait les timestamps de la colonne Remote
    if ! npx supabase migration list --project-ref "$PROJECT_REF" > "$tmp_output" 2>&1; then
        log_warn "Échec de 'migration list' — tentative alternative"
        cat "$tmp_output"
        rm -f "$tmp_output"

        # Fallback : lister via db pull (mais on ne l'exécute pas)
        log_error "Impossible de récupérer les migrations remote"
        log_info "Vérifiez votre connexion et le PROJECT_REF"
        return 1
    fi

    REMOTE_TIMESTAMPS=()

    # Le format de sortie est un tableau avec Local | Remote | Time
    # On cherche les lignes où Remote n'est pas vide
    while IFS= read -r line; do
        # Ignorer les en-têtes et séparateurs
        [[ "$line" =~ ^[─━═-]+$ ]] && continue
        [[ "$line" =~ ^Local ]] && continue
        [[ -z "$line" ]] && continue

        # Le format typique : <local_ts> | <remote_ts> | <time>
        # Ou : <timestamp> | <timestamp>
        # On extrait le 2e champ (remote)
        if [[ "$line" =~ ^([0-9]{14})[^0-9]+([0-9]{14}) ]]; then
            REMOTE_TIMESTAMPS+=("${BASH_REMATCH[2]}")
        elif [[ "$line" =~ ^[[:space:]]+([0-9]{14}) ]]; then
            # Parfois la colonne Local est vide
            REMOTE_TIMESTAMPS+=("${BASH_REMATCH[1]}")
        fi
    done < "$tmp_output"

    # Fallback : si aucune détection, chercher TOUS les timestamps 14 chiffres
    if [ ${#REMOTE_TIMESTAMPS[@]} -eq 0 ]; then
        log_warn "Détection stricte échouée — fallback extraction large"
        while IFS= read -r ts; do
            REMOTE_TIMESTAMPS+=("$ts")
        done < <(grep -oE '[0-9]{14}' "$tmp_output" | sort -u)
    fi

    rm -f "$tmp_output"

    # Dédupliquer et trier
    if [ ${#REMOTE_TIMESTAMPS[@]} -gt 0 ]; then
        IFS=$'\n' REMOTE_TIMESTAMPS=($(printf '%s\n' "${REMOTE_TIMESTAMPS[@]}" | sort -u))
        unset IFS
    fi

    log_ok "${#REMOTE_TIMESTAMPS[@]} migrations remote"
    echo ""

    if [ ${#REMOTE_TIMESTAMPS[@]} -eq 0 ]; then
        log_warn "Aucune migration remote détectée"
        log_info "La base distante est peut-être vierge ou le parsing a échoué"
        echo ""
        log_info "Sortie brute (à titre informatif) :"
        npx supabase migration list --project-ref "$PROJECT_REF" 2>&1 | head -20 || true
        echo ""
    fi
}

# =============================================================================
# ÉTAPE 3 : CALCUL DES DIFFÉRENCES
# =============================================================================

compute_diff() {
    log_section "🔍 ÉTAPE 3 : Analyse des différences"
    echo ""

    # Migrations locales ABSENTES du remote → à marquer "applied"
    TO_MARK_APPLIED=()
    for ts in "${LOCAL_TIMESTAMPS[@]}"; do
        local found=false
        for rts in "${REMOTE_TIMESTAMPS[@]}"; do
            if [ "$ts" = "$rts" ]; then
                found=true
                break
            fi
        done
        if [ "$found" = false ]; then
            TO_MARK_APPLIED+=("$ts")
        fi
    done

    # Migrations remote ABSENTES du local → à marquer "reverted"
    TO_MARK_REVERTED=()
    for rts in "${REMOTE_TIMESTAMPS[@]}"; do
        local found=false
        for ts in "${LOCAL_TIMESTAMPS[@]}"; do
            if [ "$ts" = "$rts" ]; then
                found=true
                break
            fi
        done
        if [ "$found" = false ]; then
            TO_MARK_REVERTED+=("$rts")
        fi
    done

    log_info "Migrations locales      : ${#LOCAL_TIMESTAMPS[@]}"
    log_info "Migrations remote       : ${#REMOTE_TIMESTAMPS[@]}"
    echo ""
    log_warn "À marquer APPLIED  (local → remote) : ${#TO_MARK_APPLIED[@]}"
    log_warn "À marquer REVERTED (remote → local) : ${#TO_MARK_REVERTED[@]}"
    echo ""

    if [ ${#TO_MARK_APPLIED[@]} -eq 0 ] && [ ${#TO_MARK_REVERTED[@]} -eq 0 ]; then
        log_ok "Aucune différence — les migrations sont synchronisées ✅"
        echo ""
        log_section "════════════════════════════════════════════════════════"
        log_ok "  RIEN À FAIRE"
        log_section "════════════════════════════════════════════════════════"
        exit 0
    fi

    # Afficher les détails
    if [ ${#TO_MARK_APPLIED[@]} -gt 0 ]; then
        log_section "→ À marquer APPLIED :"
        for ts in "${TO_MARK_APPLIED[@]}"; do
            local file_match
            file_match=$(ls "$MIGRATION_DIR" | grep "^${ts}_" | head -1 || echo "(fichier introuvable)")
            echo "   ${ts}  ($file_match)"
        done
        echo ""
    fi

    if [ ${#TO_MARK_REVERTED[@]} -gt 0 ]; then
        log_section "→ À marquer REVERTED :"
        for ts in "${TO_MARK_REVERTED[@]}"; do
            echo "   ${ts}"
        done
        echo ""
    fi
}

# =============================================================================
# ÉTAPE 4 : GÉNÉRATION DU SCRIPT DE RÉPARATION
# =============================================================================

generate_repair_script() {
    log_section "📝 ÉTAPE 4 : Génération du script de réparation"
    echo ""

    local repair_script
    repair_script=$(mktemp /tmp/repair_migrations_XXXXXX.sh)

    {
        echo "#!/bin/bash"
        echo "# Auto-généré par repair-migration-history.sh"
        echo "# Date : $(date -u +%Y-%m-%dT%H:%M:%SZ)"
        echo "# Project : $PROJECT_REF"
        echo ""
        echo "set -e"
        echo ""

        if [ ${#TO_MARK_APPLIED[@]} -gt 0 ]; then
            echo "# ─────────────────────────────────────────────────────────"
            echo "# Marquer comme APPLIED (existent en local, absents du remote)"
            echo "# ─────────────────────────────────────────────────────────"
            for ts in "${TO_MARK_APPLIED[@]}"; do
                echo "npx supabase migration repair --status applied $ts --project-ref $PROJECT_REF"
            done
            echo ""
        fi

        if [ ${#TO_MARK_REVERTED[@]} -gt 0 ]; then
            echo "# ─────────────────────────────────────────────────────────"
            echo "# Marquer comme REVERTED (existent en remote, absents du local)"
            echo "# ─────────────────────────────────────────────────────────"
            for ts in "${TO_MARK_REVERTED[@]}"; do
                echo "npx supabase migration repair --status reverted $ts --project-ref $PROJECT_REF"
            done
            echo ""
        fi

        echo "echo ''"
        echo "echo '✅ Réparation terminée'"
        echo "echo ''"
        echo "echo 'Prochaines étapes :'"
        echo "echo '  1. npx supabase migration list --project-ref $PROJECT_REF'"
        echo "echo '  2. npx supabase db push --project-ref $PROJECT_REF'"
    } > "$repair_script"

    chmod +x "$repair_script"

    log_ok "Script généré : $repair_script"
    echo ""
    log_section "📋 Contenu :"
    echo ""
    cat "$repair_script"
    echo ""

    REPAIR_SCRIPT_PATH="$repair_script"
}

# =============================================================================
# ÉTAPE 5 : EXÉCUTION
# =============================================================================

execute_repair() {
    log_section "🚀 ÉTAPE 5 : Exécution de la réparation"
    echo ""

    if [ "$DRY_RUN" = true ]; then
        log_warn "MODE DRY-RUN — aucune modification effectuée"
        echo ""
        log_info "Pour exécuter réellement :"
        echo "   bash $REPAIR_SCRIPT_PATH"
        echo "   # ou relancer sans --dry-run :"
        echo "   bash scripts/repair-migration-history.sh $PROJECT_REF --yes"
        return 0
    fi

    if [ "$AUTO_YES" = false ]; then
        log_warn "Cette opération va modifier la table supabase_migrations.schema_migrations"
        log_warn "sur le projet REMOTE : $PROJECT_REF"
        echo ""
        read -p "$(echo -e "${YELLOW}Continuer ? (y/N) ${NC}")" -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_warn "Annulé par l'utilisateur"
            log_info "Script conservé : $REPAIR_SCRIPT_PATH"
            exit 0
        fi
    fi

    echo ""
    log_info "Exécution..."
    echo ""

    if bash "$REPAIR_SCRIPT_PATH"; then
        log_ok "Réparation réussie"
    else
        log_error "Échec de la réparation"
        log_info "Script conservé : $REPAIR_SCRIPT_PATH"
        log_info "Vous pouvez l'exécuter manuellement pour diagnostiquer"
        exit 1
    fi

    # Nettoyer
    rm -f "$REPAIR_SCRIPT_PATH"
}

# =============================================================================
# ÉTAPE 6 : VÉRIFICATION FINALE
# =============================================================================

verify_repair() {
    log_section "🔍 ÉTAPE 6 : Vérification"
    echo ""

    log_info "Exécution de : npx supabase migration list --project-ref $PROJECT_REF"
    echo ""

    npx supabase migration list --project-ref "$PROJECT_REF" 2>&1 | head -40 || true

    echo ""
    log_section "════════════════════════════════════════════════════════"
    log_ok "  RÉPARATION TERMINÉE"
    log_section "════════════════════════════════════════════════════════"
    echo ""
    log_info "Prochaine étape :"
    echo "   npx supabase db push --project-ref $PROJECT_REF"
    echo ""
}

# =============================================================================
# MAIN
# =============================================================================

main() {
    check_prerequisites
    resolve_project_ref || exit 1

    log_info "PROJECT_REF : $PROJECT_REF"
    log_info "Mode        : $([ "$DRY_RUN" = true ] && echo "DRY-RUN" || echo "EXÉCUTION")"
    echo ""

    collect_local_migrations
    collect_remote_migrations
    compute_diff
    generate_repair_script
    execute_repair
    verify_repair
}

main "$@"