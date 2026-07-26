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

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Charger les variables d'environnement
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
fi

# ============================
# FONCTIONS
# ============================

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
EOF
}

# ============================
# PARSING DES ARGUMENTS
# ============================

ADMIN=false
EMAIL=""
PASSWORD=""
ROLE=""
NAME=""
PHONE=""
NATIONAL_ID=""
SQL_FILE=""

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
        --help|-h) show_help; exit 0 ;;
        *) echo -e "${RED}❌ Unknown option: $1${NC}"; show_help; exit 1 ;;
    esac
    shift
done

echo -e "${GREEN}${BOLD}👤 Création d'utilisateur HadraTech-GPI${NC}"
echo -e "${YELLOW}📋 FLOW: auth.users → public.profiles → public.user_roles${NC}"
echo ""

# ============================
# VÉRIFICATION DE L'ENVIRONNEMENT
# ============================

# Vérifier Supabase URL
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo -e "${RED}❌ VITE_SUPABASE_URL non défini dans .env${NC}"
    echo "   Ajoutez: VITE_SUPABASE_URL=https://votre-projet.supabase.co"
    exit 1
fi
echo -e "${GREEN}✅ Supabase URL: ${VITE_SUPABASE_URL}${NC}"

# Vérifier la clé
if [ -n "$VITE_SUPABASE_ANON_KEY" ] || [ -n "$VITE_SUPABASE_PUBLISHABLE_KEY" ]; then
    echo -e "${GREEN}✅ Clé publishable trouvée${NC}"
else
    echo -e "${RED}❌ Aucune clé trouvée. Ajoutez VITE_SUPABASE_ANON_KEY ou VITE_SUPABASE_PUBLISHABLE_KEY${NC}"
    exit 1
fi

# Vérifier que ts-node est installé (uniquement pour les modes qui appellent TS)
if [ "$ADMIN" = true ] || [ -n "$EMAIL" ]; then
    if ! command -v npx >/dev/null 2>&1; then
        echo -e "${RED}❌ npx non trouvé. Installez Node.js.${NC}"
        exit 1
    fi
fi

echo ""

# ============================
# EXÉCUTION
# ============================

if [ "$ADMIN" = true ]; then
    # Mode admin par défaut → appelle create-user.ts
    echo -e "${YELLOW}📝 Création de l'admin par défaut...${NC}"
    echo "   Email: admin@hadratech.com"
    echo "   Rôle: admin"
    echo "   🔄 Appel de create-user.ts"
    npx ts-node "$SCRIPT_DIR/create-user.ts" --admin

# ============================
# MODE FICHIER SQL (INDÉPENDANT - N'APPELLE PAS TS)
# ============================
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
            echo -e "${RED}❌ Fichier non trouvé: $SQL_FILE${NC}"
            exit 1
        fi
    fi

    # Compter les lignes
    LINES=$(grep -v '^--' "$SQL_FILE" | grep -v '^$' | wc -l)
    echo -e "   📄 $LINES lignes de SQL à exécuter"

    # Copier dans seed.sql
    cp "$SQL_FILE" "$PROJECT_ROOT/supabase/seed.sql"
    echo -e "   ✅ Copié dans supabase/seed.sql"

    # Vérifier si la stack locale est démarrée
    if npx supabase status 2>/dev/null | grep -q "Started"; then
        echo -e "   Target: local (Docker)"
        
        # Utiliser sql-paths si disponible
        if npx supabase db reset --help 2>/dev/null | grep -q "sql-paths"; then
            npx supabase db reset --sql-paths seed.sql
        else
            npx supabase db reset --no-seed
            npx supabase db execute --file "$PROJECT_ROOT/supabase/seed.sql"
        fi
        echo -e "${GREEN}✅ SQL exécuté (local)${NC}"
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
        exit 1
    fi

# ============================
# MODE UTILISATEUR INDIVIDUEL → APPELLE CREATE-USER.TS
# ============================
elif [ -n "$EMAIL" ] && [ -n "$PASSWORD" ] && [ -n "$ROLE" ]; then
    echo -e "${YELLOW}📝 Création de l'utilisateur: $EMAIL${NC}"
    echo "   Rôle: $ROLE"
    echo "   Nom: ${NAME:-'(non spécifié)'}"
    echo "   🔄 Appel de create-user.ts"

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

    npx ts-node "$SCRIPT_DIR/create-user.ts" $ARGS

else
    # Mode interactif → appelle create-user.ts
    echo -e "${YELLOW}📝 Mode interactif...${NC}"
    echo "   Répondez aux questions pour créer un utilisateur."
    echo "   🔄 Appel de create-user.ts"
    echo ""
    npx ts-node "$SCRIPT_DIR/create-user.ts"
fi

# ============================
# FIN
# ============================

echo ""
echo -e "${GREEN}${BOLD}✅ Opération terminée !${NC}"