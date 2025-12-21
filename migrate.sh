#!/bin/bash
set -euo pipefail

# === CONFIGURATION ===
MIGRATION_DIR="${MIGRATION_DIR:-./migrations}"
DB_NAME="${DB_NAME:-votre_base}"
DB_USER="${DB_USER:-votre_utilisateur}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
LOG_TABLE="${LOG_TABLE:-migration_log}"
DRY_RUN=false
ROLLBACK=false
VERBOSE=false
VERSION="1.0.0"
CHECKSUM_VALIDATION=true

# === FONCTIONS ===

usage() {
    cat << EOF
Migration Manager for PostgreSQL - Version $VERSION

Usage: $0 [OPTIONS]
Options:
  --dry-run        Simule l'exécution sans appliquer les migrations
  --rollback       Annule les migrations dans l'ordre inverse
  --dir=PATH       Répertoire des migrations (défaut: ./migrations)
  --db-name=DB     Nom de la base de données
  --db-user=USER   Utilisateur PostgreSQL
  --db-host=HOST   Hôte PostgreSQL (défaut: localhost)
  --db-port=PORT   Port PostgreSQL (défaut: 5432)
  --log-table=TBL  Table de suivi des migrations (défaut: migration_log)
  --help           Affiche ce message
  --verbose        Mode verbeux
  --version        Affiche la version
  --no-checksum    Désactive la validation de checksum
  --target=FILE    Exécute une migration spécifique (et ses prérequis)

Exemples:
  $0 --dry-run
  $0 --db-name=myapp --db-user=admin
  $0 --rollback
  $0 --target=002_add_users_table.sql
EOF
    exit 1
}

log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")    echo "[$timestamp] ℹ️  $message" ;;
        "SUCCESS") echo "[$timestamp] ✅ $message" ;;
        "WARNING") echo "[$timestamp] ⚠️  $message" ;;
        "ERROR")   echo "[$timestamp] ❌ $message" ;;
        "DEBUG")   [ "$VERBOSE" = true ] && echo "[$timestamp] 🔍 $message" ;;
        *)         echo "[$timestamp] $message" ;;
    esac
}

check_db_connection() {
    log "INFO" "Vérification de la connexion à la base..."
    
    # Vérifier si PGPASSWORD est défini ou si .pgpass existe
    if [ -z "${PGPASSWORD:-}" ] && [ ! -f ~/.pgpass ]; then
        log "WARNING" "PGPASSWORD non défini et fichier .pgpass non trouvé"
        log "WARNING" "La connexion pourrait échouer. Utilisez :"
        log "WARNING" "  export PGPASSWORD='votre_mot_de_passe'"
        log "WARNING" "  ou configurez ~/.pgpass"
    fi
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -c "SELECT 1;" >/dev/null 2>&1; then
        log "SUCCESS" "Connexion réussie à $DB_NAME sur $DB_HOST:$DB_PORT"
        return 0
    else
        log "ERROR" "Échec de connexion à $DB_NAME sur $DB_HOST:$DB_PORT"
        log "ERROR" "Vérifiez :"
        log "ERROR" "  1. Que la base existe"
        log "ERROR" "  2. Les permissions de l'utilisateur"
        log "ERROR" "  3. Les paramètres de connexion"
        return 1
    fi
}

validate_migration_file() {
    local file="$1"
    
    # Vérifier l'extension
    if [[ ! "$file" =~ \.sql$ ]]; then
        log "WARNING" "Fichier $file n'a pas l'extension .sql"
        return 1
    fi
    
    # Vérifier que le fichier n'est pas vide
    if [ ! -s "$file" ]; then
        log "WARNING" "Fichier $file est vide"
        return 1
    fi
    
    # Vérifier le checksum si activé
    if [ "$CHECKSUM_VALIDATION" = true ]; then
        local checksum_file="$file.md5"
        if [ -f "$checksum_file" ]; then
            local expected_checksum=$(cat "$checksum_file")
            local actual_checksum=$(md5sum "$file" | cut -d' ' -f1)
            
            if [ "$expected_checksum" != "$actual_checksum" ]; then
                log "ERROR" "Checksum invalide pour $file"
                log "ERROR" "Attendu: $expected_checksum"
                log "ERROR" "Obtenu:  $actual_checksum"
                return 1
            fi
            log "DEBUG" "Checksum validé pour $file"
        else
            log "DEBUG" "Aucun fichier checksum pour $file"
        fi
    fi
    
    return 0
}

run_sql() {
    local sql_file="$1"
    local description="${2:-$sql_file}"
    
    if [ "$DRY_RUN" = true ]; then
        log "INFO" "[DRY-RUN] À exécuter : $description"
        
        if [ "$VERBOSE" = true ]; then
            echo "=== Contenu du fichier ==="
            head -20 "$sql_file"
            [ $(wc -l < "$sql_file") -gt 20 ] && echo "... (tronqué)"
            echo "========================"
        fi
        return 0
    fi
    
    log "INFO" "Exécution : $description"
    
    local output_file=$(mktemp "/tmp/migration_$(date +%Y%m%d_%H%M%S)_XXXXXX.log")
    local start_time=$(date +%s)
    
    # Exécuter avec transaction et arrêt sur erreur
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -v ON_ERROR_STOP=1 -1 -q -f "$sql_file" > "$output_file" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log "SUCCESS" "Terminé en ${duration}s : $description"
        
        if [ "$VERBOSE" = true ] && [ -s "$output_file" ]; then
            log "DEBUG" "Sortie de la commande :"
            cat "$output_file" | while read line; do
                log "DEBUG" "  $line"
            done
        fi
        
        rm -f "$output_file"
        return 0
    else
        log "ERROR" "Échec d'exécution : $description"
        log "ERROR" "Dernières erreurs :"
        
        if [ -s "$output_file" ]; then
            tail -20 "$output_file" | while read line; do
                log "ERROR" "  $line"
            done
        else
            log "ERROR" "  Aucun détail d'erreur disponible"
        fi
        
        # Essayer de récupérer plus d'infos depuis PostgreSQL
        local error_query="SELECT * FROM pg_stat_activity WHERE state = 'active' AND query LIKE '%$(basename "$sql_file")%';"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
            -c "$error_query" 2>/dev/null | head -5 | while read line; do
            log "DEBUG" "  $line"
        done
        
        rm -f "$output_file"
        return 1
    fi
}

get_applied_migrations() {
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t \
        -c "SELECT name FROM $LOG_TABLE ORDER BY applied_at ASC;" 2>/dev/null | \
        tr -d ' ' | grep -v '^$'
}

get_pending_migrations() {
    local all_migrations=()
    local applied_migrations=$(get_applied_migrations)
    
    # Lister tous les fichiers SQL (sans rollback)
    while IFS= read -r -d '' file; do
        local filename=$(basename "$file")
        if ! echo "$applied_migrations" | grep -q "^${filename}$"; then
            all_migrations+=("$file")
        fi
    done < <(find "$MIGRATION_DIR" -name "*.sql" -not -name "*_rollback.sql" -print0 | sort -z)
    
    echo "${all_migrations[@]}"
}

create_checksum() {
    local file="$1"
    if [ "$CHECKSUM_VALIDATION" = true ] && [ ! -f "$file.md5" ]; then
        md5sum "$file" | cut -d' ' -f1 > "$file.md5"
        log "DEBUG" "Checksum créé pour $file"
    fi
}

initialize_migration_table() {
    log "INFO" "Initialisation de la table de suivi $LOG_TABLE..."
    
    local init_sql=$(cat << EOF
CREATE TABLE IF NOT EXISTS $LOG_TABLE (
    id SERIAL PRIMARY KEY,
    name VARCHAR(512) NOT NULL UNIQUE,
    checksum VARCHAR(32),
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    duration INTEGER,
    success BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_${LOG_TABLE}_applied_at ON $LOG_TABLE(applied_at);
CREATE INDEX IF NOT EXISTS idx_${LOG_TABLE}_name ON $LOG_TABLE(name);
EOF
    )
    
    echo "$init_sql" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -v ON_ERROR_STOP=1 >/dev/null 2>&1
    
    log "SUCCESS" "Table de suivi initialisée"
}

# === TRAITEMENT DES ARGUMENTS ===

TARGET_MIGRATION=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --version)
            echo "Migration Manager v$VERSION"
            exit 0
            ;;
        --no-checksum)
            CHECKSUM_VALIDATION=false
            shift
            ;;
        --dir=*)
            MIGRATION_DIR="${1#*=}"
            shift
            ;;
        --db-name=*)
            DB_NAME="${1#*=}"
            shift
            ;;
        --db-user=*)
            DB_USER="${1#*=}"
            shift
            ;;
        --db-host=*)
            DB_HOST="${1#*=}"
            shift
            ;;
        --db-port=*)
            DB_PORT="${1#*=}"
            shift
            ;;
        --log-table=*)
            LOG_TABLE="${1#*=}"
            shift
            ;;
        --target=*)
            TARGET_MIGRATION="${1#*=}"
            shift
            ;;
        --help)
            usage
            ;;
        *)
            log "ERROR" "Option inconnue : $1"
            usage
            ;;
    esac
done

# === VÉRIFICATIONS INITIALES ===

log "INFO" "Migration Manager v$VERSION"
log "INFO" "Base de données: $DB_NAME@$DB_HOST:$DB_PORT"
log "INFO" "Répertoire: $MIGRATION_DIR"

if [ ! -d "$MIGRATION_DIR" ]; then
    log "ERROR" "Le répertoire $MIGRATION_DIR n'existe pas."
    exit 1
fi

if ! command -v psql &> /dev/null; then
    log "ERROR" "psql n'est pas installé ou non accessible."
    log "ERROR" "Installez-le avec: apt-get install postgresql-client"
    exit 1
fi

if [ "$DRY_RUN" = false ]; then
    if ! check_db_connection; then
        exit 1
    fi
fi

# === MODE ROLLBACK ===

if [ "$ROLLBACK" = true ]; then
    if [ "$DRY_RUN" = true ]; then
        log "INFO" "[DRY-RUN] Mode rollback activé"
    else
        log "INFO" "Mode rollback activé"
    fi
    
    # Vérifier que la table de log existe
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t \
        -c "SELECT 1 FROM information_schema.tables WHERE table_name = '$LOG_TABLE';" | grep -q 1; then
        log "ERROR" "Table $LOG_TABLE n'existe pas. Impossible de faire un rollback."
        exit 1
    fi
    
    # Récupérer les migrations appliquées
    local applied_migrations=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t \
        -c "SELECT name FROM $LOG_TABLE WHERE success = true ORDER BY applied_at DESC;" 2>/dev/null)
    
    if [ -z "$applied_migrations" ]; then
        log "SUCCESS" "✅ Aucune migration à annuler."
        exit 0
    fi
    
    # Compter le nombre de migrations à annuler
    local migration_count=$(echo "$applied_migrations" | wc -l)
    log "INFO" "Migrations à annuler: $migration_count"
    
    # Annuler les migrations
    local rolled_back=0
    local failed=0
    
    while IFS= read -r migration_name_raw; do
        migration_name=$(echo "$migration_name_raw" | xargs)
        
        if [ -z "$migration_name" ]; then
            continue
        fi
        
        local rollback_file="$MIGRATION_DIR/${migration_name%.*}_rollback.sql"
        
        if [ -f "$rollback_file" ]; then
            log "INFO" "Annulation de: $migration_name"
            
            if validate_migration_file "$rollback_file"; then
                if run_sql "$rollback_file" "Rollback: $migration_name"; then
                    # Supprimer de la table de log
                    if [ "$DRY_RUN" = false ]; then
                        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                            -c "DELETE FROM $LOG_TABLE WHERE name = '$migration_name';" >/dev/null 2>&1
                        log "INFO" "Migration supprimée du log: $migration_name"
                    fi
                    rolled_back=$((rolled_back + 1))
                else
                    log "ERROR" "Échec du rollback pour: $migration_name"
                    failed=$((failed + 1))
                    
                    if [ "$DRY_RUN" = false ]; then
                        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                            -c "UPDATE $LOG_TABLE SET success = false WHERE name = '$migration_name';" >/dev/null 2>&1
                    fi
                    
                    # Option: arrêter ou continuer?
                    # exit 1  # Arrêter en cas d'erreur
                fi
            else
                log "WARNING" "Fichier rollback invalide: $rollback_file"
                failed=$((failed + 1))
            fi
        else
            log "WARNING" "Fichier rollback manquant pour: $migration_name"
            
            # Demander confirmation pour continuer
            if [ "$DRY_RUN" = false ] && [ "$failed" -eq 0 ]; then
                read -p "Continuer sans rollback pour $migration_name? (o/n): " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Oo]$ ]]; then
                    log "INFO" "Rollback interrompu par l'utilisateur"
                    exit 1
                fi
            fi
        fi
    done <<< "$applied_migrations"
    
    if [ "$failed" -eq 0 ]; then
        log "SUCCESS" "✅ Rollback terminé avec succès: $rolled_back migration(s) annulée(s)"
    else
        log "WARNING" "⚠️  Rollback partiel: $rolled_back succès, $failed échec(s)"
    fi
    exit 0
fi

# === MODE MIGRATION NORMAL ===

# Initialiser la table de suivi
if [ "$DRY_RUN" = false ]; then
    initialize_migration_table
fi

# Lister les fichiers de migration
log "INFO" "Recherche des migrations..."

local migration_files=()
while IFS= read -r -d '' file; do
    if validate_migration_file "$file"; then
        migration_files+=("$file")
        create_checksum "$file"
    else
        log "WARNING" "Fichier ignoré: $(basename "$file")"
    fi
done < <(find "$MIGRATION_DIR" -name "*.sql" -not -name "*_rollback.sql" -print0 | sort -z)

if [ ${#migration_files[@]} -eq 0 ]; then
    log "SUCCESS" "✅ Aucune migration trouvée dans $MIGRATION_DIR"
    exit 0
fi

log "INFO" "Migrations trouvées: ${#migration_files[@]}"

# Filtrer par cible si spécifié
if [ -n "$TARGET_MIGRATION" ]; then
    log "INFO" "Cible spécifiée: $TARGET_MIGRATION"
    
    local target_found=false
    local filtered_files=()
    
    for file in "${migration_files[@]}"; do
        local filename=$(basename "$file")
        filtered_files+=("$file")
        
        if [ "$filename" = "$TARGET_MIGRATION" ]; then
            target_found=true
            break
        fi
    done
    
    if [ "$target_found" = false ]; then
        log "ERROR" "Migration cible non trouvée: $TARGET_MIGRATION"
        exit 1
    fi
    
    migration_files=("${filtered_files[@]}")
    log "INFO" "Migrations à exécuter jusqu'à la cible: ${#migration_files[@]}"
fi

# Exécuter les migrations
local applied_count=0
local skipped_count=0
local failed_count=0

for script in "${migration_files[@]}"; do
    script_name=$(basename "$script")
    
    # Vérifier si déjà appliquée
    if [ "$DRY_RUN" = false ]; then
        local already_applied=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t \
            -c "SELECT 1 FROM $LOG_TABLE WHERE name = '$script_name' AND success = true;")
        
        if [ -n "$already_applied" ]; then
            log "INFO" "Déjà appliquée: $script_name"
            skipped_count=$((skipped_count + 1))
            continue
        fi
    fi
    
    # Calculer le checksum
    local checksum=""
    if [ "$CHECKSUM_VALIDATION" = true ] && [ -f "$script.md5" ]; then
        checksum=$(cat "$script.md5")
    fi
    
    # Exécuter la migration
    local start_time=$(date +%s)
    
    if run_sql "$script" "$script_name"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        applied_count=$((applied_count + 1))
        
        # Enregistrer dans le log
        if [ "$DRY_RUN" = false ]; then
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                -c "INSERT INTO $LOG_TABLE (name, checksum, duration) VALUES ('$script_name', '$checksum', $duration);" >/dev/null 2>&1
            
            log "DEBUG" "Enregistrée dans le log: $script_name (${duration}s)"
        fi
    else
        failed_count=$((failed_count + 1))
        
        # Enregistrer l'échec
        if [ "$DRY_RUN" = false ]; then
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                -c "INSERT INTO $LOG_TABLE (name, checksum, duration, success) VALUES ('$script_name', '$checksum', 0, false);" >/dev/null 2>&1
        fi
        
        if [ -n "$TARGET_MIGRATION" ]; then
            log "ERROR" "Migration vers la cible $TARGET_MIGRATION a échoué"
        fi
        
        exit 1
    fi
    
    # Si cible atteinte, arrêter
    if [ -n "$TARGET_MIGRATION" ] && [ "$script_name" = "$TARGET_MIGRATION" ]; then
        log "INFO" "Migration cible atteinte: $TARGET_MIGRATION"
        break
    fi
done

# === RÉSUMÉ FINAL ===

log "INFO" "="*50
log "INFO" "RÉSUMÉ DE L'EXÉCUTION"

if [ "$DRY_RUN" = true ]; then
    log "INFO" "Mode: Simulation (DRY RUN)"
fi

log "INFO" "Migrations appliquées: $applied_count"
log "INFO" "Migrations ignorées:  $skipped_count"
log "INFO" "Migrations échouées:  $failed_count"

if [ "$failed_count" -eq 0 ] && [ "$applied_count" -gt 0 ]; then
    log "SUCCESS" "✅ Toutes les migrations ont été appliquées avec succès!"
    
    # Afficher le statut final
    if [ "$DRY_RUN" = false ]; then
        local total_applied=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t \
            -c "SELECT COUNT(*) FROM $LOG_TABLE WHERE success = true;" | tr -d ' ')
        log "INFO" "Total des migrations appliquées dans la base: $total_applied"
    fi
elif [ "$failed_count" -gt 0 ]; then
    log "ERROR" "❌ Des migrations ont échoué"
    exit 1
else
    log "SUCCESS" "✅ Aucune nouvelle migration à appliquer"
fi

exit 0