#!/bin/bash
# =============================================================================
# create-user.sh – Crée un utilisateur avec profil et rôle
# =============================================================================
# FLOW: auth.users → public.profiles → public.user_roles
# =============================================================================
# Usage:
#   ./scripts/create-user.sh --admin
#   ./scripts/create-user.sh --email admin@test.com --password Admin123! --role admin --name "Admin User"
#   ./scripts/create-user.sh --file users_rows.sql
#   ./scripts/create-user.sh --help
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
# CHEMINS
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# ============================================================================
# CHARGEMENT DU .ENV
# ============================================================================
load_env() {
    if [ -f "$PROJECT_ROOT/.env" ]; then
        echo -e "${BLUE}📄 Chargement de .env${NC}"
        export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | grep -v '^$' | xargs)
    else
        echo -e "${YELLOW}⚠️  .env non trouvé, utilisation des variables d'environnement existantes${NC}"
    fi
}
load_env

# ============================================================================
# FONCTIONS
# ============================================================================
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

show_help() {
    cat << EOF
${BOLD}FLOW: auth.users → public.profiles → public.user_roles${NC}

${BOLD}Usage:${NC} ./scripts/create-user.sh [OPTIONS]

${BOLD}Options:${NC}
  --admin                  Crée l'admin par défaut (admin@hadratech.com)
  --email EMAIL            Email de l'utilisateur
  --password PASS          Mot de passe (min 6 caractères)
  --role ROLE              Rôle (admin, manager, director, supplier, user, etc.)
  --name NAME              Nom complet
  --phone PHONE            Téléphone
  --national-id ID         Numéro d'identité
  --file FILE.sql          Exécute un fichier SQL (indépendant, n'appelle pas TS)
  --help, -h               Affiche cette aide

${BOLD}Examples:${NC}
  # Admin par défaut (appelle create-user.ts)
  ./scripts/create-user.sh --admin

  # Utilisateur individuel (appelle create-user.ts)
  ./scripts/create-user.sh --email user@test.com --password Test123! --role manager --name "John Doe"

  # Depuis un fichier SQL (n'appelle PAS create-user.ts)
  ./scripts/create-user.sh --file users_rows.sql

${BOLD}Variables d'environnement:${NC}
  VITE_SUPABASE_URL       URL du projet Supabase
  VITE_SUPABASE_ANON_KEY  Clé publishable (sb_publishable_...)
  VITE_SUPABASE_PROJECT_ID ID du projet Supabase
EOF
}

# ============================================================================
# PARSING DES ARGUMENTS
# ============================================================================
ADMIN=false
EMAIL=""
PASSWORD=""
ROLE=""
NAME=""
PHONE=""
NATIONAL_ID=""
SQL_FILE=""
AUTO_CONFIRM=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --admin) ADMIN=true ;;
        --email) EMAIL="$2"; shift ;;
        --password) PASSWORD="$2"; shift ;;
        --role) ROLE="$2"; shift ;;
        --name) NAME="$2"; shift ;;
        --phone) PHONE="$2"; shift ;;
        --national-id) NATIONAL_ID="$2"; shift ;;
        --file) SQL_FILE="$2"; shift ;;
        --yes|-y) AUTO_CONFIRM=true ;;
        --help|-h) show_help; exit 0 ;;
        *) log_error "Option inconnue: $1"; show_help; exit 1 ;;
    esac
    shift
done

# ============================================================================
# BANNIÈRE
# ============================================================================
echo ""
echo -e "${GREEN}${BOLD}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║              👤 CRÉATION D'UTILISATEUR                      ║${NC}"
echo -e "${GREEN}${BOLD}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📋 FLOW: auth.users → public.profiles → public.user_roles${NC}"
echo ""

# ============================================================================
# VÉRIFICATION DE L'ENVIRONNEMENT
# ============================================================================
check_supabase_config() {
    # Vérifier Supabase URL
    if [ -z "$VITE_SUPABASE_URL" ]; then
        log_error "VITE_SUPABASE_URL non défini dans .env"
        echo "   Ajoutez: VITE_SUPABASE_URL=https://votre-projet.supabase.co"
        exit 1
    fi
    log_success "Supabase URL: ${VITE_SUPABASE_URL}"

    # Vérifier la clé
    if [ -n "$VITE_SUPABASE_ANON_KEY" ]; then
        log_success "Clé anon trouvée"
    elif [ -n "$VITE_SUPABASE_PUBLISHABLE_KEY" ]; then
        log_success "Clé publishable trouvée"
    else
        log_error "Aucune clé trouvée. Ajoutez VITE_SUPABASE_ANON_KEY ou VITE_SUPABASE_PUBLISHABLE_KEY"
        exit 1
    fi

    # Vérifier que ts-node est installé (uniquement pour les modes qui appellent TS)
    if [ "$ADMIN" = true ] || [ -n "$EMAIL" ]; then
        if ! command -v npx >/dev/null 2>&1; then
            log_error "npx non trouvé. Installez Node.js."
            exit 1
        fi
    fi
}

check_supabase_config
echo ""

# ============================================================================
# EXÉCUTION
# ============================================================================

# ============================================================================
# MODE ADMIN PAR DÉFAUT
# ============================================================================
if [ "$ADMIN" = true ]; then
    echo -e "${YELLOW}📝 Création de l'admin par défaut...${NC}"
    echo "   Email: admin@hadratech.com"
    echo "   Rôle: admin"
    echo "   🔄 Appel de create-user.ts"
    echo ""
    npx ts-node "$SCRIPT_DIR/create-user.ts" --admin
    log_success "Admin créé"

# ============================================================================
# MODE FICHIER SQL (INDÉPENDANT - N'APPELLE PAS TS)
# ============================================================================
elif [ -n "$SQL_FILE" ]; then
    echo -e "${YELLOW}📝 Exécution du fichier SQL: $SQL_FILE${NC}"
    echo -e "   ℹ️  Mode indépendant (n'appelle pas create-user.ts)"

    # Chercher le fichier
    if [ ! -f "$SQL_FILE" ]; then
        if [ -f "$SCRIPT_DIR/$SQL_FILE" ]; then
            SQL_FILE="$SCRIPT_DIR/$SQL_FILE"
        elif [ -f "$PROJECT_ROOT/$SQL_FILE" ]; then
            SQL_FILE="$PROJECT_ROOT/$SQL_FILE"
        elif [ -f "$(pwd)/$SQL_FILE" ]; then
            SQL_FILE="$(pwd)/$SQL_FILE"
        else
            log_error "Fichier non trouvé: $SQL_FILE"
            exit 1
        fi
    fi

    # Compter les lignes
    LINES=$(grep -v '^--' "$SQL_FILE" | grep -v '^$' | wc -l)
    echo -e "   📄 $LINES lignes de SQL à exécuter"

    # Copier dans seed.sql
    mkdir -p "$PROJECT_ROOT/supabase"
    cp "$SQL_FILE" "$PROJECT_ROOT/supabase/seed.sql"
    log_success "Copié dans supabase/seed.sql"

    # Vérifier si la stack locale est démarrée
    if npx supabase status 2>/dev/null | grep -q "Started"; then
        echo -e "   Target: local (Docker)"
        
        # Exécuter le SQL
        if npx supabase db reset --help 2>/dev/null | grep -q "sql-paths"; then
            npx supabase db reset --sql-paths seed.sql 2>/dev/null || {
                log_warning "Reset échoué, tentative d'exécution directe..."
                npx supabase db execute --file "$PROJECT_ROOT/supabase/seed.sql"
            }
        else
            npx supabase db reset --no-seed 2>/dev/null || true
            npx supabase db execute --file "$PROJECT_ROOT/supabase/seed.sql"
        fi
        log_success "SQL exécuté (local)"
    else
        echo -e "   Target: cloud (Dashboard Supabase)"
        echo -e "${YELLOW}ℹ️  La stack locale n'est pas démarrée.${NC}"
        echo ""
        echo -e "${BOLD}Options disponibles :${NC}"
        echo ""
        echo -e "  ${BOLD}Option 1 - Démarrer la stack locale :${NC}"
        echo "    npx supabase start"
        echo "    puis relancer ce script"
        echo ""
        echo -e "  ${BOLD}Option 2 - Exécuter via le Dashboard :${NC}"
        echo "    1. Ouvrir https://app.supabase.com/project/ttrfbzonzcyimfmezuqv/sql"
        echo "    2. Copier/coller le contenu ci-dessous"
        echo "    3. Exécuter"
        echo ""
        echo -e "${BOLD}Contenu du fichier :${NC}"
        echo "---"
        cat "$SQL_FILE"
        echo "---"
        echo ""
        
        if [ "$AUTO_CONFIRM" = false ]; then
            read -p "Voulez-vous copier ce contenu dans le SQL Editor ? (o/N) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[OoYy]$ ]]; then
                echo "📋 Contenu copié dans le presse-papiers (si disponible)"
                if command -v pbcopy >/dev/null 2>&1; then
                    cat "$SQL_FILE" | pbcopy
                    log_success "Contenu copié dans le presse-papiers"
                elif command -v xclip >/dev/null 2>&1; then
                    cat "$SQL_FILE" | xclip -selection clipboard
                    log_success "Contenu copié dans le presse-papiers"
                else
                    log_warning "Pas de commande de copie disponible"
                fi
            fi
        fi
        exit 1
    fi

# ============================================================================
# MODE UTILISATEUR INDIVIDUEL → APPELLE CREATE-USER.TS
# ============================================================================
elif [ -n "$EMAIL" ] && [ -n "$PASSWORD" ] && [ -n "$ROLE" ]; then
    echo -e "${YELLOW}📝 Création de l'utilisateur: $EMAIL${NC}"
    echo "   Rôle: $ROLE"
    echo "   Nom: ${NAME:-'(non spécifié)'}"
    echo "   🔄 Appel de create-user.ts"
    echo ""

    # Construire les arguments pour le script TS
    ARGS="--email \"$EMAIL\" --password \"$PASSWORD\" --role \"$ROLE\""

    if [ -n "$NAME" ]; then
        ARGS="$ARGS --name \"$NAME\""
    fi
    if [ -n "$PHONE" ]; then
        ARGS="$ARGS --phone \"$PHONE\""
    fi
    if [ -n "$NATIONAL_ID" ]; then
        ARGS="$ARGS --national-id \"$NATIONAL_ID\""
    fi

    # Exécuter le script TypeScript
    npx ts-node "$SCRIPT_DIR/create-user.ts" $ARGS
    log_success "Utilisateur créé"

# ============================================================================
# MODE INTERACTIF
# ============================================================================
else
    echo -e "${YELLOW}📝 Mode interactif...${NC}"
    echo "   Répondez aux questions pour créer un utilisateur."
    echo "   🔄 Appel de create-user.ts"
    echo ""
    npx ts-node "$SCRIPT_DIR/create-user.ts"
fi

# ============================================================================
# FIN
# ============================================================================
echo ""
echo -e "${GREEN}${BOLD}✅ Opération terminée !${NC}"
echo ""

# Afficher les prochaines étapes
if [ -z "$SQL_FILE" ]; then
    echo -e "${BLUE}📋 Prochaines étapes:${NC}"
    echo "  1. Vérifier l'utilisateur dans Supabase Dashboard"
    echo "  2. Tester la connexion: npm run dev"
    echo "  3. Vérifier les permissions"
fi