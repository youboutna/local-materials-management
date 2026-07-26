#!/bin/bash
# =============================================================================
# deploy.sh – Déploiement des migrations Supabase
# =============================================================================
# Utilise npx supabase si la CLI globale n'est pas installée
# =============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# ---- Par défaut ----
ACTION="status"
TARGET="local"
MIGRATION_NAME=""
PROJECT_ID=""
ANON_KEY=""
ENV_FILE="$PROJECT_ROOT/.env"

# ---- Fonctions ----
check_cli() {
    if ! command -v supabase >/dev/null 2>&1 && ! npx supabase --version >/dev/null 2>&1; then
        echo -e "${RED}❌ Supabase CLI not installed.${NC}"
        echo "   Run: ./scripts/install-cli.sh"
        exit 1
    fi
}

supabase_cmd() {
    if command -v supabase >/dev/null 2>&1; then
        supabase "$@"
    else
        npx supabase "$@"
    fi
}

read_env() {
    local var_name="$1"
    if [ -f "$ENV_FILE" ]; then
        grep -E "^${var_name}=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'" | head -n1
    else
        echo ""
    fi
}

# ---- Parsing des options ----
while [[ $# -gt 0 ]]; do
    case "$1" in
        --local) TARGET="local" ;;
        --prod) TARGET="prod" ;;
        --push) ACTION="push" ;;
        --reset) ACTION="reset" ;;
        --status) ACTION="status" ;;
        --create-migration)
            ACTION="create-migration"
            MIGRATION_NAME="$2"
            shift
            ;;
        --project-id)
            PROJECT_ID="$2"
            shift
            ;;
        --anon-key)
            ANON_KEY="$2"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --local              Target local database (default)"
            echo "  --prod               Target production database"
            echo "  --push               Push migrations to target"
            echo "  --reset              Reset and reapply all migrations"
            echo "  --status             Show migration status (default)"
            echo "  --create-migration <name>  Create a new migration file"
            echo "  --project-id <id>    Project ID for production"
            echo "  --anon-key <key>     Anon key for production"
            echo "  -h, --help           Show this help"
            exit 0
            ;;
        *) echo -e "${RED}❌ Unknown option: $1${NC}"; exit 1 ;;
    esac
    shift
done

# ---- Début ----
echo -e "${GREEN}${BOLD}🚀 Supabase Deployment${NC}"
echo ""

# ---- Vérifier la CLI ----
check_cli

# ---- Charger les variables d'env si présentes ----
if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID=$(read_env "VITE_SUPABASE_PROJECT_ID")
fi

if [ -z "$ANON_KEY" ]; then
    ANON_KEY=$(read_env "VITE_SUPABASE_ANON_KEY")
fi

# ---- Détection du projet ----
echo -e "${YELLOW}📋 Configuration:${NC}"
echo "   Target: $TARGET"
echo "   Action: $ACTION"
echo ""

# ---- Initialiser le projet si nécessaire ----
if [ ! -d "$PROJECT_ROOT/supabase" ]; then
    echo -e "${YELLOW}🔧 Initialisation du projet Supabase...${NC}"
    cd "$PROJECT_ROOT"
    supabase_cmd init
    echo -e "${GREEN}✅ Projet initialisé${NC}"
    echo ""
fi

# ---- Vérifier Docker ----
if ! docker ps >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Docker n'est pas démarré. Lancez Docker Desktop.${NC}"
fi

# ---- Action ----
case "$ACTION" in
    create-migration)
        if [ -z "$MIGRATION_NAME" ]; then
            echo -e "${RED}❌ Migration name required: --create-migration <name>${NC}"
            exit 1
        fi
        echo -e "${YELLOW}📝 Création de la migration: $MIGRATION_NAME${NC}"
        cd "$PROJECT_ROOT"
        supabase_cmd migration new "$MIGRATION_NAME"
        echo -e "${GREEN}✅ Migration créée dans supabase/migrations/${NC}"
        ;;

    reset)
        echo -e "${YELLOW}🔄 Reset de la base locale...${NC}"
        cd "$PROJECT_ROOT"
        supabase_cmd db reset
        echo -e "${GREEN}✅ Base réinitialisée${NC}"
        ;;

    push)
        echo -e "${YELLOW}📦 Push des migrations...${NC}"
        cd "$PROJECT_ROOT"

        if [ "$TARGET" = "local" ]; then
            # Vérifier que Docker tourne
            if ! docker ps >/dev/null 2>&1; then
                echo -e "${YELLOW}⚠️  Docker n'est pas démarré. Lancement de la stack locale...${NC}"
                supabase_cmd start || {
                    echo -e "${RED}❌ Impossible de démarrer la stack locale. Vérifiez Docker.${NC}"
                    exit 1
                }
            fi
            echo "   Target: local (Docker)"
            supabase_cmd db push
        else
            echo "   Target: production (cloud)"
            if [ -z "$PROJECT_ID" ]; then
                echo -e "${RED}❌ PROJECT_ID required for production. Use --project-id or set VITE_SUPABASE_PROJECT_ID in .env${NC}"
                exit 1
            fi
            if [ -z "$ANON_KEY" ]; then
                echo -e "${RED}❌ ANON_KEY required for production. Use --anon-key or set VITE_SUPABASE_ANON_KEY in .env${NC}"
                exit 1
            fi

            # Lier au projet distant
            echo "   Linking to project: $PROJECT_ID"
            supabase_cmd login 2>/dev/null || true
            supabase_cmd link --project-ref "$PROJECT_ID" 2>/dev/null || {
                echo -e "${YELLOW}⚠️  Link failed. Using password...${NC}"
                supabase_cmd link --project-ref "$PROJECT_ID" --password "$ANON_KEY"
            }

            # Pousser les migrations
            supabase_cmd db push
        fi
        echo -e "${GREEN}✅ Migrations déployées${NC}"
        ;;

    status|*)
        echo -e "${YELLOW}📋 Statut des migrations${NC}"
        cd "$PROJECT_ROOT"

        if [ "$TARGET" = "local" ]; then
            # Vérifier que la stack locale est démarrée
            if ! docker ps | grep -q "supabase"; then
                echo -e "${YELLOW}⚠️  Stack locale non démarrée. Lancement...${NC}"
                supabase_cmd start
            fi
            echo "   Target: local"
            supabase_cmd status
        else
            echo "   Target: production"
            if [ -z "$PROJECT_ID" ]; then
                echo -e "${RED}❌ PROJECT_ID required for production. Use --project-id or set VITE_SUPABASE_PROJECT_ID in .env${NC}"
                exit 1
            fi
            supabase_cmd login 2>/dev/null || true
            supabase_cmd link --project-ref "$PROJECT_ID" 2>/dev/null || true
            supabase_cmd migration list
        fi
        ;;
esac

echo ""
echo -e "${GREEN}${BOLD}✅ Terminé !${NC}"