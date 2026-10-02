#!/bin/bash
# =============================================================================
# install-cli.sh – Installe la CLI Supabase via npm (locale ou globale)
# =============================================================================
# Usage: ./scripts/install-cli.sh [--global] [--beta] [--skip-init] [--force]
# =============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

# ---- Par défaut ----
INSTALL_GLOBAL=false
USE_BETA=false
SKIP_INIT=false
FORCE=false

# ---- Parsing des options ----
while [[ $# -gt 0 ]]; do
    case "$1" in
        --global) INSTALL_GLOBAL=true ;;
        --beta) USE_BETA=true ;;
        --skip-init) SKIP_INIT=true ;;
        --force) FORCE=true ;;
        -h|--help)
            echo "Usage: $0 [--global] [--beta] [--skip-init] [--force]"
            echo "  --global      Install globally (sudo may be required)"
            echo "  --beta        Install beta version (supabase@beta)"
            echo "  --skip-init   Skip project initialization"
            echo "  --force       Force reinstall even if already installed"
            echo ""
            echo "After installation, you can use:"
            echo "  npx supabase <command>   # For local installation"
            echo "  supabase <command>       # For global installation"
            exit 0
            ;;
        *) echo -e "${RED}❌ Unknown option: $1${NC}"; exit 1 ;;
    esac
    shift
done

echo -e "${GREEN}${BOLD}🔧 Supabase CLI Installation${NC}"
echo ""

# ---- Vérifier Node.js ----
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js v20+ first.${NC}"
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${YELLOW}⚠️  Node.js version $NODE_VERSION detected. Supabase CLI requires Node.js 20+.${NC}"
    echo "   Please upgrade: https://nodejs.org/"
fi
echo -e "${GREEN}✅ Node.js: $(node -v)${NC}"

# ---- Vérifier npm ----
if ! command -v npm >/dev/null 2>&1; then
    echo -e "${RED}❌ npm not found. Please install Node.js with npm.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm: $(npm -v)${NC}"

# ---- Vérifier Docker ----
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Docker not found. Supabase CLI requires Docker for local development.${NC}"
    echo "   Install Docker: https://docs.docker.com/get-docker/"
else
    if docker ps >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker: en cours d'exécution${NC}"
    else
        echo -e "${YELLOW}⚠️  Docker installé mais non démarré. Lancez Docker Desktop.${NC}"
    fi
fi

echo ""

# ---- Vérifier si la CLI est déjà installée ----
if [ "$FORCE" = false ]; then
    if command -v supabase >/dev/null 2>&1; then
        VERSION=$(supabase --version 2>/dev/null | head -n1 || echo "unknown")
        echo -e "${GREEN}✅ Supabase CLI déjà installée (globale) version: $VERSION${NC}"
        echo ""
        echo -e "${BOLD}📋 Utilisation:${NC}"
        echo "   supabase <command>"
        exit 0
    fi

    if npx supabase --version >/dev/null 2>&1; then
        VERSION=$(npx supabase --version 2>/dev/null | head -n1 || echo "unknown")
        echo -e "${GREEN}✅ Supabase CLI déjà installée (locale) version: $VERSION${NC}"
        echo ""
        echo -e "${BOLD}📋 Utilisation:${NC}"
        echo "   npx supabase <command>"
        echo "   OU ajoutez un alias : alias supabase='npx supabase'"
        echo ""
        # Vérifier si le projet est initialisé
        if [ -d "supabase" ] && [ -f "supabase/config.toml" ]; then
            echo -e "${GREEN}✅ Projet Supabase déjà initialisé${NC}"
        else
            echo -e "${YELLOW}⚠️  Projet non initialisé. Lancez: npx supabase init${NC}"
        fi
        exit 0
    fi
else
    echo -e "${YELLOW}⚠️  Force reinstall (--force)${NC}"
fi

# ---- Installation ----
echo -e "${YELLOW}📦 Installation de Supabase CLI...${NC}"

# Vérifier que package.json existe
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found. Please run this script from the project root.${NC}"
    echo "   Create a project first: npm init -y"
    exit 1
fi

# Fonction d'installation avec @latest
install_package() {
    local pkg_manager="$1"
    local pkg_cmd="$2"
    local pkg_name="$3"
    
    echo -e "   Using $pkg_manager..."
    if [ "$USE_BETA" = true ]; then
        $pkg_cmd $pkg_name@beta
    else
        $pkg_cmd $pkg_name@latest
    fi
}

# Installation
if [ "$INSTALL_GLOBAL" = true ]; then
    echo -e "   Installation globale..."
    if [ "$USE_BETA" = true ]; then
        npm install -g supabase@beta
    else
        npm install -g supabase@latest
    fi
else
    echo -e "   Installation locale (dev dependency)..."
    
    # Détection du package manager
    if command -v pnpm >/dev/null 2>&1; then
        if [ "$USE_BETA" = true ]; then
            pnpm add -D supabase@beta
        else
            pnpm add -D supabase@latest
        fi
    elif command -v yarn >/dev/null 2>&1; then
        if [ "$USE_BETA" = true ]; then
            yarn add -D supabase@beta
        else
            yarn add -D supabase@latest
        fi
    elif command -v bun >/dev/null 2>&1; then
        if [ "$USE_BETA" = true ]; then
            bun add -D supabase@beta
        else
            bun add -D supabase@latest
        fi
    else
        if [ "$USE_BETA" = true ]; then
            npm install supabase@beta --save-dev
        else
            npm install supabase@latest --save-dev
        fi
    fi
fi

# ---- Vérification finale ----
echo ""
echo -e "${YELLOW}🔍 Vérification de l'installation...${NC}"

if command -v supabase >/dev/null 2>&1; then
    VERSION=$(supabase --version 2>/dev/null | head -n1 || echo "unknown")
    echo -e "${GREEN}✅ Supabase CLI installée (globale) version: $VERSION${NC}"
    CMD="supabase"
elif npx supabase --version >/dev/null 2>&1; then
    VERSION=$(npx supabase --version 2>/dev/null | head -n1 || echo "unknown")
    echo -e "${GREEN}✅ Supabase CLI installée (locale) version: $VERSION${NC}"
    CMD="npx supabase"
else
    echo -e "${RED}❌ Installation failed. Please install manually:${NC}"
    echo "   npm install supabase@latest --save-dev"
    echo ""
    echo "   Then use: npx supabase <command>"
    exit 1
fi

# ---- Initialisation du projet (sauf si --skip-init) ----
if [ "$SKIP_INIT" = false ]; then
    echo ""
    echo -e "${YELLOW}🔧 Configuration du projet Supabase...${NC}"

    if [ ! -d "supabase" ] || [ ! -f "supabase/config.toml" ]; then
        echo -e "   Initialisation du projet..."
        $CMD init
        echo -e "${GREEN}✅ Projet initialisé${NC}"
        
        # Vérifier que Docker est en cours d'exécution avant de démarrer
        if docker ps >/dev/null 2>&1; then
            echo -e "${YELLOW}   Démarrage de la stack locale...${NC}"
            $CMD start
            echo -e "${GREEN}✅ Stack locale démarrée${NC}"
            echo ""
            echo -e "${BOLD}📋 Services disponibles:${NC}"
            $CMD status 2>/dev/null || true
        else
            echo -e "${YELLOW}⚠️  Docker n'est pas démarré. Pour démarrer la stack locale:${NC}"
            echo "   $CMD start"
        fi
    else
        echo -e "${GREEN}✅ Projet déjà initialisé${NC}"
        
        # Vérifier si la stack est en cours d'exécution
        if docker ps | grep -q "supabase" 2>/dev/null; then
            echo -e "${GREEN}✅ Stack locale en cours d'exécution${NC}"
            echo ""
            echo -e "${BOLD}📋 Services disponibles:${NC}"
            $CMD status 2>/dev/null || true
        else
            echo -e "${YELLOW}⚠️  Stack locale non démarrée.${NC}"
            echo "   Pour démarrer: $CMD start"
        fi
    fi
else
    echo -e "${YELLOW}⏭️  Initialisation du projet ignorée (--skip-init)${NC}"
fi

# ---- Affichage final ----
echo ""
echo -e "${GREEN}${BOLD}✅ Installation terminée !${NC}"
echo ""
echo -e "${BOLD}📋 Utilisation:${NC}"
echo "   $CMD init              # Initialiser un projet"
echo "   $CMD start             # Démarrer la stack locale"
echo "   $CMD status            # Voir l'état de la stack"
echo "   $CMD stop              # Arrêter la stack"
echo "   $CMD migration new <nom>  # Créer une migration"
echo "   $CMD db push           # Déployer les migrations"
echo "   $CMD db reset          # Réinitialiser la base locale"
echo "   $CMD config push       # Pousser la configuration"
echo ""
echo -e "${BOLD}📋 Pour lancer l'application:${NC}"
echo "   npm install            # Installer les dépendances"
echo "   npm run dev            # Démarrer le serveur de développement"
echo ""
echo -e "${YELLOW}💡 Astuce: Ajoutez un alias dans votre shell:${NC}"
echo "   echo 'alias supabase=\"npx supabase\"' >> ~/.bashrc"
echo "   source ~/.bashrc"
echo ""
echo -e "${BOLD}🌐 Accès aux services (si stack démarrée):${NC}"
echo "   Supabase Studio: http://localhost:54323"
echo "   API:            http://localhost:54321"
echo "   Auth:           http://localhost:54321/auth/v1"
echo ""
echo -e "${YELLOW}💡 Mise à jour:${NC}"
echo "   npm install supabase@latest --save-dev  # Mettre à jour la CLI"