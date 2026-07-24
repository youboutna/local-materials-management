#!/bin/bash
# =============================================================================
# start-supabase.sh – Démarrage de la stack Supabase self-hosted (HadraTech-GPI)
# =============================================================================
# Utilise le mécanisme upstream supabase/docker/run.sh
# Compatible avec les 5 scénarios de déploiement
# Intègre les migrations HadraTech depuis /supabase/migrations/
# =============================================================================
#
# Usage:
#   ./scripts/start-supabase.sh               # Démarrage standard
#   ./scripts/start-supabase.sh --reset       # Reset complet avant démarrage
#   ./scripts/start-supabase.sh --dev         # Mode développement (volumes locaux)
#   ./scripts/start-supabase.sh --help        # Affiche l'aide
#
# Variables utilisées (dans .env):
#   POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY
#   KONG_HTTP_PORT, API_EXTERNAL_URL, SITE_URL
#   PGRST_DB_SCHEMAS, PGRST_DB_EXTRA_SEARCH_PATH
# =============================================================================

set -e

# ---- Colors ----
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

# ---- Variables ----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SUPABASE_DOCKER_DIR="$PROJECT_ROOT/supabase/docker"
RUN_SH="$SUPABASE_DOCKER_DIR/run.sh"
ENV_FILE="$SUPABASE_DOCKER_DIR/.env"
ENV_TEMPLATE="$SUPABASE_DOCKER_DIR/.env.hadratech"
GENERATE_KEYS_SCRIPT="$PROJECT_ROOT/scripts/generate-keys.sh"
UPSTREAM_GENERATE_KEYS="$SUPABASE_DOCKER_DIR/utils/generate-keys.sh"
MIGRATIONS_DIR="$PROJECT_ROOT/supabase/migrations"
SETUP_MIGRATIONS_SCRIPT="$PROJECT_ROOT/scripts/setup-supabase-migrations.sh"

RESET=false
DEV_MODE=false
SKIP_MIGRATIONS=false

# ---- Aide ----
show_help() {
    cat << EOF
${BOLD}Usage:${NC} $0 [OPTIONS]

${BOLD}Options:${NC}
  --reset          Reset all volumes before starting
  --dev            Enable development mode (dev compose override)
  --skip-migrations Skip migration setup (use existing)
  -h, --help       Show this help message

${BOLD}Examples:${NC}
  $0               # Standard start
  $0 --reset       # Reset and start fresh
  $0 --dev         # Start with development overrides
  $0 --skip-migrations  # Skip migration installation

${BOLD}Environment:${NC}
  Uses .env.hadratech template in supabase/docker/
  Migrations are loaded from supabase/migrations/
EOF
}

# ---- Parsing des options ----
while [[ $# -gt 0 ]]; do
    case "$1" in
        --reset) RESET=true ;;
        --dev) DEV_MODE=true ;;
        --skip-migrations) SKIP_MIGRATIONS=true ;;
        -h|--help) show_help; exit 0 ;;
        *) echo -e "${RED}❌ Unknown option: $1${NC}"; show_help; exit 1 ;;
    esac
    shift
done

echo ""
echo -e "${GREEN}${BOLD}🚀 Starting Supabase self-hosted (HadraTech-GPI)${NC}"
echo ""

# =============================================================================
# SECTION 1 : VÉRIFICATIONS PRÉALABLES
# =============================================================================

echo -e "${YELLOW}${BOLD}[1/8] Vérifications préalables...${NC}"

# ---- Vérification 1: dossier supabase/docker ----
if [ ! -d "$SUPABASE_DOCKER_DIR" ]; then
    echo -e "${RED}❌ supabase/docker not found.${NC}"
    echo ""
    echo "Clone the upstream repository first:"
    echo "  ${BOLD}git clone --depth 1 https://github.com/supabase/supabase supabase/${NC}"
    echo ""
    echo "Then copy the docker files:"
    echo "  ${BOLD}cp -rf supabase/docker/* supabase/docker/${NC}"
    exit 1
fi
echo -e "${GREEN}✅ supabase/docker found${NC}"

# ---- Vérification 2: run.sh ----
if [ ! -f "$RUN_SH" ]; then
    echo -e "${RED}❌ run.sh not found in $SUPABASE_DOCKER_DIR${NC}"
    echo "Please ensure the upstream repository is properly cloned."
    exit 1
fi
echo -e "${GREEN}✅ run.sh found${NC}"

# ---- Vérification 3: docker compose ----
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}❌ docker is not installed${NC}"
    exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
    echo -e "${RED}❌ docker compose plugin is not available${NC}"
    echo "Please install Docker Compose v2"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose available${NC}"

# ---- Vérification 4: migrations ----
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${YELLOW}⚠️  supabase/migrations not found. Creating...${NC}"
    mkdir -p "$MIGRATIONS_DIR"
    echo -e "${GREEN}✅ Created $MIGRATIONS_DIR${NC}"
fi

MIGRATION_COUNT=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | wc -l)
echo -e "${GREEN}✅ $MIGRATION_COUNT migration files found${NC}"

# =============================================================================
# SECTION 2 : CONFIGURATION .ENV
# =============================================================================

echo ""
echo -e "${YELLOW}${BOLD}[2/8] Configuration de l'environnement...${NC}"

# ---- Vérification .env.hadratech ----
if [ ! -f "$ENV_TEMPLATE" ]; then
    echo -e "${YELLOW}⚠️  .env.hadratech not found. Creating default...${NC}"
    cat > "$ENV_TEMPLATE" << 'EOF'
# =============================================================================
# SUPABASE SELF-HOSTED – HadraTech-GPI Configuration
# =============================================================================

POSTGRES_PASSWORD=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=postgres

PGRST_DB_SCHEMAS=public,btp
PGRST_DB_EXTRA_SEARCH_PATH=public
PGRST_DB_MAX_ROWS=1000

JWT_SECRET=please-change-me-32-chars-minimum
JWT_EXPIRY=3600

API_EXTERNAL_URL=http://localhost:8000
SITE_URL=http://localhost:5173
ADDITIONAL_REDIRECT_URLS=http://localhost:5173

SUPABASE_PUBLIC_URL=http://localhost:8000
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

ANON_KEY=
SERVICE_ROLE_KEY=

DISABLE_SIGNUP=false
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true

KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

STORAGE_BACKEND=file
GLOBAL_S3_BUCKET=documents
STORAGE_TENANT_ID=hadratech
REGION=us-east-1
S3_PROTOCOL_ACCESS_KEY_ID=minioadmin
S3_PROTOCOL_ACCESS_KEY_SECRET=minioadmin

STUDIO_DEFAULT_ORGANIZATION=HadraTech-GPI
STUDIO_DEFAULT_PROJECT=HadraTech-GPI

REALTIME_DB_ENC_KEY=supabaserealtime
SECRET_KEY_BASE=supabase_secret_key_base

DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=hadratech_dashboard_2025

VAULT_ENC_KEY=supabase_vault_enc_key
POOLER_TENANT_ID=hadratech
POOLER_DEFAULT_POOL_SIZE=20
POOLER_MAX_CLIENT_CONN=100
POOLER_DB_POOL_SIZE=10

PG_META_CRYPTO_KEY=supabase_pg_meta_crypto_key

FUNCTIONS_VERIFY_JWT=true
EOF
    echo -e "${GREEN}✅ Created $ENV_TEMPLATE${NC}"
fi

# ---- .env ----
cd "$SUPABASE_DOCKER_DIR"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  .env not found. Copying .env.hadratech...${NC}"
    cp "$ENV_TEMPLATE" "$ENV_FILE"
    echo -e "${GREEN}✅ .env created from .env.hadratech${NC}"
else
    echo -e "${GREEN}✅ .env exists${NC}"
fi

# ---- Vérification des variables requises ----
echo -e "${YELLOW}🔍 Checking required variables in .env...${NC}"

REQUIRED_VARS=(
    "POSTGRES_PASSWORD"
    "JWT_SECRET"
    "ANON_KEY"
    "SERVICE_ROLE_KEY"
    "KONG_HTTP_PORT"
    "API_EXTERNAL_URL"
)

MISSING_VARS=""
for var in "${REQUIRED_VARS[@]}"; do
    value=$(grep -E "^${var}=" "$ENV_FILE" | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d ' ')
    if [ -z "$value" ] || [ "$value" = "please-change-me-32-chars-minimum" ] || [ "$value" = "change_me" ]; then
        MISSING_VARS="$MISSING_VARS\n  - $var"
    fi
done

if [ -n "$MISSING_VARS" ]; then
    echo -e "${YELLOW}⚠️  The following variables need to be set:${NC}"
    echo -e "$MISSING_VARS"
    echo ""
fi

# =============================================================================
# SECTION 3 : GÉNÉRATION DES CLÉS
# =============================================================================

echo ""
echo -e "${YELLOW}${BOLD}[3/8] Génération des clés JWT...${NC}"

NEEDS_KEYS=false
if [ -n "$MISSING_VARS" ] || [ "$RESET" = true ]; then
    NEEDS_KEYS=true
fi

if [ "$NEEDS_KEYS" = true ]; then
    echo -e "${YELLOW}🔐 Generating keys...${NC}"
    
    if [ -f "$GENERATE_KEYS_SCRIPT" ]; then
        echo -e "   Using: $GENERATE_KEYS_SCRIPT"
        bash "$GENERATE_KEYS_SCRIPT" -y 2>/dev/null || {
            echo -e "${YELLOW}ℹ️  generate-keys.sh failed, trying upstream...${NC}"
            if [ -f "$UPSTREAM_GENERATE_KEYS" ]; then
                sh "$UPSTREAM_GENERATE_KEYS" --update-env
            else
                echo -e "${RED}❌ No key generation script found.${NC}"
                echo "Please set the required variables manually in .env"
                exit 1
            fi
        }
    elif [ -f "$UPSTREAM_GENERATE_KEYS" ]; then
        echo -e "   Using: $UPSTREAM_GENERATE_KEYS"
        sh "$UPSTREAM_GENERATE_KEYS" --update-env
    else
        echo -e "${RED}❌ No key generation script found.${NC}"
        echo "Please set the required variables manually in .env"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Keys generated${NC}"
else
    echo -e "${GREEN}✅ Keys already configured${NC}"
fi

# ---- Vérification finale des clés ----
JWT_SECRET_VALUE=$(grep -E "^JWT_SECRET=" "$ENV_FILE" | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d ' ')
if [ -z "$JWT_SECRET_VALUE" ] || [ "$JWT_SECRET_VALUE" = "please-change-me-32-chars-minimum" ]; then
    echo -e "${RED}❌ JWT_SECRET is not properly set.${NC}"
    echo "Please run key generation manually:"
    echo "  cd $SUPABASE_DOCKER_DIR && sh utils/generate-keys.sh --update-env"
    exit 1
fi

ANON_KEY_VALUE=$(grep -E "^ANON_KEY=" "$ENV_FILE" | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d ' ')
if [ -z "$ANON_KEY_VALUE" ]; then
    echo -e "${RED}❌ ANON_KEY is empty.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Keys validated${NC}"

# =============================================================================
# SECTION 4 : MIGRATIONS
# =============================================================================

echo ""
echo -e "${YELLOW}${BOLD}[4/8] Installation des migrations HadraTech...${NC}"

if [ "$SKIP_MIGRATIONS" = true ]; then
    echo -e "${YELLOW}⏭️  Skipping migrations (--skip-migrations)${NC}"
else
    if [ -f "$SETUP_MIGRATIONS_SCRIPT" ]; then
        echo -e "   Running $SETUP_MIGRATIONS_SCRIPT"
        bash "$SETUP_MIGRATIONS_SCRIPT"
    else
        echo -e "${YELLOW}⚠️  setup-supabase-migrations.sh not found${NC}"
        echo -e "   Creating migration mount point manually..."
        
        # Créer le dossier de destination
        mkdir -p "$SUPABASE_DOCKER_DIR/volumes/db/migrations/hadratech"
        
        # Copier les migrations
        if [ -d "$MIGRATIONS_DIR" ] && [ "$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | wc -l)" -gt 0 ]; then
            for file in "$MIGRATIONS_DIR"/*.sql; do
                filename=$(basename "$file")
                # Renommer pour l'ordre d'exécution (98_)
                newname="98_${filename}"
                cp "$file" "$SUPABASE_DOCKER_DIR/volumes/db/migrations/hadratech/$newname"
                echo -e "${GREEN}   ✅ Copied: $newname${NC}"
            done
            echo -e "${GREEN}✅ Migrations copied to volumes${NC}"
        else
            echo -e "${YELLOW}⚠️  No migration files found${NC}"
        fi
    fi
fi

# =============================================================================
# SECTION 5 : RESET
# =============================================================================

if [ "$RESET" = true ]; then
    echo ""
    echo -e "${YELLOW}${BOLD}[5/8] Reset de la stack...${NC}"
    echo -e "${YELLOW}🔄 Resetting Supabase stack...${NC}"
    
    sh "$RUN_SH" stop 2>/dev/null || true
    docker compose down -v 2>/dev/null || true
    
    echo -e "${GREEN}✅ Reset complete${NC}"
else
    echo ""
    echo -e "${YELLOW}${BOLD}[5/8] Reset skipped (use --reset to reset)${NC}"
fi

# =============================================================================
# SECTION 6 : MODE DÉVELOPPEMENT
# =============================================================================

echo ""
echo -e "${YELLOW}${BOLD}[6/8] Configuration du mode...${NC}"

if [ "$DEV_MODE" = true ]; then
    if [ -f "./dev/docker-compose.dev.yml" ]; then
        echo -e "${YELLOW}⚙️  Enabling development mode...${NC}"
        sh "$RUN_SH" config add dev 2>/dev/null || {
            echo -e "${YELLOW}⚠️  config add dev failed, manually adding override...${NC}"
            if grep -q "^COMPOSE_FILE=" "$ENV_FILE"; then
                sed -i 's|^COMPOSE_FILE=.*$|&:dev/docker-compose.dev.yml|' "$ENV_FILE"
            else
                echo "COMPOSE_FILE=docker-compose.yml:dev/docker-compose.dev.yml" >> "$ENV_FILE"
            fi
        }
        echo -e "${GREEN}✅ Development mode enabled${NC}"
    else
        echo -e "${YELLOW}⚠️  dev/docker-compose.dev.yml not found.${NC}"
        echo "   Create it or use standard mode."
    fi
else
    echo -e "${GREEN}✅ Standard mode${NC}"
fi

# =============================================================================
# SECTION 7 : DÉMARRAGE
# =============================================================================

echo ""
echo -e "${YELLOW}${BOLD}[7/8] Démarrage de la stack...${NC}"

echo -e "${GREEN}📦 Starting Supabase stack...${NC}"
sh "$RUN_SH" start

# =============================================================================
# SECTION 8 : INFORMATIONS FINALES
# =============================================================================

echo ""
echo -e "${YELLOW}${BOLD}[8/8] Informations de connexion${NC}"

KONG_PORT=$(grep -E "^KONG_HTTP_PORT=" "$ENV_FILE" | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d ' ' || echo "8000")
DASHBOARD_USER=$(grep -E "^DASHBOARD_USERNAME=" "$ENV_FILE" | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d ' ' || echo "admin")
DASHBOARD_PASS=$(grep -E "^DASHBOARD_PASSWORD=" "$ENV_FILE" | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d ' ' || echo "voir .env")
POSTGRES_PASS=$(grep -E "^POSTGRES_PASSWORD=" "$ENV_FILE" | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d ' ' || echo "voir .env")

echo ""
echo -e "${GREEN}${BOLD}✅ Supabase self-hosted started successfully!${NC}"
echo ""
echo -e "${BOLD}📡 Endpoints:${NC}"
echo "   - Kong Gateway    : http://localhost:${KONG_PORT}"
echo "   - PostgREST       : http://localhost:3000"
echo "   - GoTrue (Auth)   : http://localhost:9999"
echo "   - MinIO (Storage) : http://localhost:9000"
echo "   - Studio          : http://localhost:8082"
echo "   - Realtime        : http://localhost:4000"
echo "   - Logflare        : http://localhost:4001"
echo ""
echo -e "${BOLD}🔐 Credentials:${NC}"
echo "   - Dashboard : $DASHBOARD_USER / $DASHBOARD_PASS"
echo "   - Postgres  : postgres / $POSTGRES_PASS"
echo "   - MinIO     : minioadmin / $(grep -E '^MINIO_ROOT_PASSWORD=' "$ENV_FILE" | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d ' ' || echo 'minioadmin')"
echo ""
echo -e "${BOLD}📋 Commandes utiles:${NC}"
echo "   - Stop:    cd $SUPABASE_DOCKER_DIR && sh run.sh stop"
echo "   - Status:  cd $SUPABASE_DOCKER_DIR && sh run.sh status"
echo "   - Logs:    cd $SUPABASE_DOCKER_DIR && sh run.sh logs"
echo "   - Secrets: cd $SUPABASE_DOCKER_DIR && sh run.sh secrets"
echo ""
echo -e "${BOLD}📁 Migrations:${NC}"
echo "   - Source: $MIGRATIONS_DIR"
echo "   - Docker: /docker-entrypoint-initdb.d/migrations/hadratech/"
echo ""
echo -e "${GREEN}${BOLD}🎯 HadraTech-GPI Supabase self-hosted is ready!${NC}"
echo ""
# =============================================================================
# SECTION 9 : SYNCHRONISATION DES CLÉS AVEC LE .ENV RACINE
# =============================================================================
echo ""
echo -e "${YELLOW}${BOLD}[9/8] Synchronisation des clés avec .env racine...${NC}"
ROOT_ENV="$PROJECT_ROOT/.env"
if [ -f "$ROOT_ENV" ] && [ -f "$ENV_FILE" ]; then
  ANON_KEY=$(grep -E '^ANON_KEY=' "$ENV_FILE" | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d ' ')
  JWT_SECRET=$(grep -E '^JWT_SECRET=' "$ENV_FILE" | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d ' ')
  if [ -n "$ANON_KEY" ]; then
    if grep -qE '^VITE_SUPABASE_ANON_KEY=' "$ROOT_ENV"; then
      sed -i.bak "s|^VITE_SUPABASE_ANON_KEY=.*$|VITE_SUPABASE_ANON_KEY=\"${ANON_KEY}\"|" "$ROOT_ENV"
    else
      echo "VITE_SUPABASE_ANON_KEY=\"${ANON_KEY}\"" >> "$ROOT_ENV"
    fi
    if grep -qE '^VITE_SUPABASE_PUBLISHABLE_KEY=' "$ROOT_ENV"; then
      sed -i.bak "s|^VITE_SUPABASE_PUBLISHABLE_KEY=.*$|VITE_SUPABASE_PUBLISHABLE_KEY=\"${ANON_KEY}\"|" "$ROOT_ENV"
    fi
  fi
  if [ -n "$JWT_SECRET" ]; then
    if grep -qE '^VITE_JWT_SECRET=' "$ROOT_ENV"; then
      sed -i.bak "s|^VITE_JWT_SECRET=.*$|VITE_JWT_SECRET=\"${JWT_SECRET}\"|" "$ROOT_ENV"
    else
      echo "VITE_JWT_SECRET=\"${JWT_SECRET}\"" >> "$ROOT_ENV"
    fi
  fi
  # Force self-hosted URL
  if grep -qE '^VITE_SUPABASE_URL=' "$ROOT_ENV"; then
    sed -i.bak "s|^VITE_SUPABASE_URL=.*$|VITE_SUPABASE_URL=\"http://localhost:8000\"|" "$ROOT_ENV"
  fi
  rm -f "$ROOT_ENV.bak"
  echo -e "${GREEN}✅ .env racine synchronisé (ANON_KEY, JWT_SECRET, SUPABASE_URL)${NC}"
fi
