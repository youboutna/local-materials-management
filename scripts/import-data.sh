#!/bin/bash
# =============================================================================
# import-data.sh – Import des données vers le nouveau projet Supabase
# =============================================================================
# Usage: ./scripts/import-data.sh --ref PROJECT_REF --file data.sql
# =============================================================================
set -e

# ============================================================================
# COULEURS
# ============================================================================
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# ============================================================================
# VARIABLES
# ============================================================================
if [ -f ".env" ]; then
  set -a
  source .env
  set +a
fi

PROJECT_REF=""
FILE="data.sql"
BATCH_SIZE=1000
DRY_RUN=false
ASSUME_YES=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ref) PROJECT_REF="$2"; shift 2 ;;
    --file) FILE="$2"; shift 2 ;;
    --batch-size) BATCH_SIZE="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --yes|-y) ASSUME_YES=true; shift ;;
    *) log_error "Option inconnue: $1"; exit 1 ;;
  esac
done

# ============================================================================
# VÉRIFICATIONS
# ============================================================================
if [ -z "$PROJECT_REF" ]; then
  PROJECT_REF="${VITE_SUPABASE_PROJECT_ID:-}"
  if [ -z "$PROJECT_REF" ]; then
    log_error "Project Ref non spécifié. Utilisez --ref ou définissez VITE_SUPABASE_PROJECT_ID"
    exit 1
  fi
fi

if [ ! -f "$FILE" ]; then
  log_error "Fichier introuvable: $FILE"
  exit 1
fi

log_info "Import vers le projet: $PROJECT_REF"
log_info "Fichier: $FILE"
log_info "Taille du lot: $BATCH_SIZE"

# ============================================================================
# CONFIRMATION
# ============================================================================
if [ "$ASSUME_YES" = false ] && [ "$DRY_RUN" = false ]; then
  read -p "⚠️  Importer les données vers $PROJECT_REF ? (o/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[OoYy]$ ]]; then
    log_info "Import annulé"
    exit 0
  fi
fi

# ============================================================================
# IMPORT
# ============================================================================
if [ "$DRY_RUN" = true ]; then
  log_info "[DRY RUN] npx supabase db execute --file $FILE"
  log_info "[DRY RUN] npx supabase link --project-ref $PROJECT_REF"
  exit 0
fi

log_info "Liaison au projet $PROJECT_REF..."
npx supabase link --project-ref "$PROJECT_REF" --yes || {
  log_error "Échec de la liaison"
  exit 1
}

log_info "Exécution du fichier SQL..."
if npx supabase db execute --file "$FILE" 2>&1; then
  log_success "Import réussi"
else
  log_error "Échec de l'import"
  exit 1
fi

# ============================================================================
# GÉNÉRATION DES TYPES
# ============================================================================
log_info "Génération des types TypeScript..."
npx supabase gen types typescript --linked > src/integrations/supabase/types.gen.ts 2>&1 || {
  log_warning "Génération des types échouée"
}

log_success "Import terminé avec succès ! 🎉"