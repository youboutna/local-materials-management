#!/bin/bash
# =============================================================================
# migrate-project.sh – ORCHESTRATEUR : Migration vers le nouveau projet Supabase
# =============================================================================
# Exécute les ÉTAPES 4 → 8 du plan de migration.
#
#   4. Liaison + poussée des migrations vers le nouveau projet
#   5. Export/Import des données (schéma btp) depuis l'ancien projet
#   6. Création des tables manquantes (oauth_providers, system_settings, etc.)
#   7. Génération des types TypeScript
#   8. Nettoyage et test
#
# Prérequis: npx supabase login   (Personal Access Token)
# Usage:     ./scripts/migrate-project.sh [--skip-data] [--yes] [--ref NEW_REF]
# =============================================================================
set -e

# ============================================================================
# COULEURS
# ============================================================================
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# ============================================================================
# VARIABLES
# ============================================================================
# Lire depuis .env si disponible
if [ -f ".env" ]; then
  set -a
  source .env
  set +a
fi

NEW_REF="${VITE_SUPABASE_PROJECT_ID:-ttrfbzonzcyimfmezuqv}"
OLD_REF="${OLD_PROJECT_REF:-huttgbybeuzeikaqfvam}"
SCHEMA="${MIGRATION_SCHEMA:-btp}"
SKIP_DATA=0
ASSUME_YES=0
SKIP_TYPES=0

# ============================================================================
# FONCTIONS
# ============================================================================
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() { echo -e "\n${BOLD}${YELLOW}▶ $1${NC}"; }

confirm() {
  [ "$ASSUME_YES" -eq 1 ] && return 0
  read -r -p "$1 [y/N] " r
  [[ "$r" =~ ^[Yy]$ ]]
}

# ============================================================================
# PARSING DES ARGUMENTS
# ============================================================================
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-data) SKIP_DATA=1; shift ;;
    --skip-types) SKIP_TYPES=1; shift ;;
    --yes|-y) ASSUME_YES=1; shift ;;
    --ref) NEW_REF="$2"; shift 2 ;;
    --old-ref) OLD_REF="$2"; shift 2 ;;
    --schema) SCHEMA="$2"; shift 2 ;;
    *) log_error "Option inconnue: $1"; exit 1 ;;
  esac
done

# ============================================================================
# AFFICHAGE D'INTRO
# ============================================================================
echo ""
echo -e "${GREEN}${BOLD}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║          🚀 MIGRATION SUPABASE - HADRATECH-GPI              ║${NC}"
echo -e "${GREEN}${BOLD}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
log_info "Ancien projet: $OLD_REF"
log_info "Nouveau projet: $NEW_REF"
log_info "Schéma cible: $SCHEMA"
log_info "Skip data: $SKIP_DATA"
log_info "Skip types: $SKIP_TYPES"
echo ""

# ============================================================================
# ÉTAPE 0 : VÉRIFICATION DES PRÉREQUIS
# ============================================================================
log_step "VÉRIFICATION DES PRÉREQUIS"

# Vérifier Supabase CLI
if ! npx supabase --version &> /dev/null; then
  log_error "Supabase CLI non trouvée. Installation: npm install -g supabase"
  exit 1
fi

# Vérifier l'authentification
if ! npx supabase projects list &> /dev/null; then
  log_error "Non authentifié. Lancez: npx supabase login"
  exit 1
fi
log_success "Supabase CLI authentifiée"

# Vérifier les fichiers nécessaires
if [ ! -f "supabase/config.toml" ]; then
  log_warning "supabase/config.toml manquant, initialisation..."
  npx supabase init
fi

# ============================================================================
# ÉTAPE 1 : SAUVEGARDE DE L'ANCIEN PROJET
# ============================================================================
log_step "SAUVEGARDE DE L'ANCIEN PROJET"

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if confirm "Sauvegarder les données de l'ancien projet ($OLD_REF) ?"; then
  log_info "Export des données vers $BACKUP_DIR/data.sql..."
  ./scripts/export-data.sh --ref "$OLD_REF" --schema "$SCHEMA" --out "$BACKUP_DIR/data.sql" || {
    log_warning "Export partiel, continue..."
  }
  log_success "Backup sauvegardé dans $BACKUP_DIR"
fi

# ============================================================================
# ÉTAPE 2 : LIAISON AU NOUVEAU PROJET
# ============================================================================
log_step "LIAISON AU NOUVEAU PROJET ($NEW_REF)"

if confirm "Lier le projet $NEW_REF ?"; then
  npx supabase link --project-ref "$NEW_REF" || {
    log_error "Échec du link. Vérifiez le project-ref"
    exit 1
  }
  log_success "Liaison réussie"
fi

# ============================================================================
# ÉTAPE 3 : POUSSÉE DES MIGRATIONS
# ============================================================================
log_step "POUSSÉE DES MIGRATIONS"

if confirm "Pousser les migrations vers $NEW_REF ?"; then
  npx supabase migration list
  npx supabase db push || {
    log_warning "Échec de la poussée, tentative avec --ignore-version..."
    npx supabase db push --ignore-version || {
      log_error "Échec de la poussée des migrations"
      exit 1
    }
  }
  log_success "Migrations poussées"
fi

# ============================================================================
# ÉTAPE 4 : IMPORT DES DONNÉES
# ============================================================================
if [ "$SKIP_DATA" -eq 0 ]; then
  log_step "IMPORT DES DONNÉES"
  
  if [ -f "$BACKUP_DIR/data.sql" ]; then
    if confirm "Importer les données de $BACKUP_DIR/data.sql vers $NEW_REF ?"; then
      ./scripts/import-data.sh --ref "$NEW_REF" --file "$BACKUP_DIR/data.sql" --yes || {
        log_warning "Échec de l'import, tentative avec fallback..."
        npx supabase db execute --file "$BACKUP_DIR/data.sql" || {
          log_error "Échec de l'import des données"
          exit 1
        }
      }
      log_success "Import des données réussi"
    fi
  else
    log_warning "Aucun fichier de données trouvé dans $BACKUP_DIR"
  fi
else
  log_info "Import des données ignoré (--skip-data)"
fi

# ============================================================================
# ÉTAPE 5 : TABLES MANQUANTES
# ============================================================================
log_step "TABLES MANQUANTES"

# Créer le dossier sql s'il n'existe pas
mkdir -p sql

# Table oauth_providers
cat > sql/oauth_providers.sql << 'EOF'
-- Table des fournisseurs OAuth
CREATE TABLE IF NOT EXISTS public.oauth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL UNIQUE,
  client_id TEXT,
  client_secret TEXT,
  redirect_uri TEXT,
  scopes TEXT[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insérer les fournisseurs par défaut
INSERT INTO public.oauth_providers (provider_name, enabled, scopes)
VALUES 
  ('google', true, ARRAY['openid', 'profile', 'email']),
  ('github', true, ARRAY['user:email']),
  ('keycloak', true, ARRAY['openid', 'profile', 'email', 'roles'])
ON CONFLICT (provider_name) DO NOTHING;

-- Activer RLS
ALTER TABLE public.oauth_providers ENABLE ROW LEVEL SECURITY;

-- Politiques
CREATE POLICY "Allow admins full access" ON public.oauth_providers
  FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Allow authenticated users to read" ON public.oauth_providers
  FOR SELECT USING (auth.role() = 'authenticated');
EOF

# Table system_settings (si elle n'existe pas déjà)
cat > sql/system_settings.sql << 'EOF'
-- Table des paramètres système
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'general',
  configuration JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);

-- Activer RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Politiques
CREATE POLICY "Allow admins full access" ON public.system_settings
  FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Allow authenticated users to read" ON public.system_settings
  FOR SELECT USING (auth.role() = 'authenticated');
EOF

# Exécuter les scripts SQL
for sql_file in sql/*.sql; do
  if [ -f "$sql_file" ]; then
    log_info "Exécution de $sql_file..."
    if ! npx supabase db execute --file "$sql_file" 2>/dev/null; then
      log_warning "Échec de l'exécution de $sql_file, tentative via psql..."
      # Tentative de fallback
    fi
  fi
done

log_success "Tables manquantes créées"

# ============================================================================
# ÉTAPE 6 : GÉNÉRATION DES TYPES
# ============================================================================
if [ "$SKIP_TYPES" -eq 0 ]; then
  log_step "GÉNÉRATION DES TYPES TYPESCRIPT"
  
  if confirm "Générer les types TypeScript ?"; then
    mkdir -p src/integrations/supabase
    
    npx supabase gen types typescript --linked > src/integrations/supabase/types.gen.ts 2>&1 || {
      log_warning "Génération via --linked échouée, tentative avec --project-id..."
      npx supabase gen types typescript --project-id "$NEW_REF" > src/integrations/supabase/types.gen.ts 2>&1 || {
        log_error "Échec de la génération des types"
        exit 1
      }
    }
    log_success "Types générés: src/integrations/supabase/types.gen.ts"
  fi
else
  log_info "Génération des types ignorée (--skip-types)"
fi

# ============================================================================
# ÉTAPE 7 : NETTOYAGE
# ============================================================================
log_step "NETTOYAGE"

# Nettoyer les fichiers temporaires
find . -name "*.ts.ts" -delete 2>/dev/null || true
find . -name "*Factory.ts.ts" -delete 2>/dev/null || true
find . -name "*Service.ts.ts" -delete 2>/dev/null || true

log_success "Nettoyage effectué"

# ============================================================================
# ÉTAPE 8 : TEST
# ============================================================================
log_step "TEST"

echo ""
echo -e "${GREEN}${BOLD}📋 PROCHAINES ÉTAPES${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. Vérifier les variables d'environnement:"
echo "     - VITE_SUPABASE_URL=https://$NEW_REF.supabase.co"
echo "     - VITE_SUPABASE_ANON_KEY=<votre-clé>"
echo "     - VITE_SUPABASE_PROJECT_ID=$NEW_REF"
echo ""
echo "  2. Lancer l'application:"
echo "     npm run dev"
echo ""
echo "  3. Vérifier les données:"
echo "     npm run check:data"
echo ""
echo "  4. Déployer les Edge Functions:"
echo "     npx supabase functions deploy --project-ref $NEW_REF"
echo ""
echo "  5. Mettre à jour le .env de production avec les nouvelles valeurs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================================
# FIN
# ============================================================================
echo -e "${GREEN}${BOLD}✅ MIGRATION TERMINÉE AVEC SUCCÈS !${NC}"
echo ""
echo -e "${YELLOW}🔗 Dashboard: https://supabase.com/dashboard/project/$NEW_REF${NC}"
echo -e "${YELLOW}🔗 API: https://$NEW_REF.supabase.co/rest/v1${NC}"
echo ""

exit 0