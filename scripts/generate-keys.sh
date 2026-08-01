#!/bin/bash
# =============================================================================
# generate-keys.sh – Génère les secrets JWT pour Supabase self-hosted
# =============================================================================
# Usage:
#   ./scripts/generate-keys.sh              # Interactif (demande confirmation)
#   ./scripts/generate-keys.sh -y           # Non-interactif (écrit directement)
#   ./scripts/generate-keys.sh --update-env # Non-interactif (écrit directement)
#   ./scripts/generate-keys.sh --help       # Affiche l'aide
# =============================================================================

set -e

# ---- Colors ----
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

# ---- Aide ----
show_help() {
    cat << EOF
${BOLD}Usage:${NC} $0 [OPTIONS]

${BOLD}Options:${NC}
  -y, --update-env    Write keys directly to .env (non-interactive)
  -h, --help          Show this help message

${BOLD}Examples:${NC}
  $0                  # Interactive (asks for confirmation)
  $0 -y               # Non-interactive (writes directly)
  $0 --update-env     # Non-interactive (writes directly)

${BOLD}What it does:${NC}
  Generates all secrets and JWT API keys needed for self-hosted Supabase:
  - JWT_SECRET        (HS256 symmetric key)
  - ANON_KEY          (JWT for anonymous users)
  - SERVICE_ROLE_KEY  (JWT for service role)
  - POSTGRES_PASSWORD (Database password)
  - DASHBOARD_PASSWORD (Studio dashboard password)
  - And many more...

${BOLD}Files:${NC}
  - Looks for .env in: supabase/docker/.env
  - Creates backup: .env.backup.YYYYMMDD_HHMMSS
  - Uses template: supabase/docker/.env.hadratech if .env not found

${BOLD}Notes:${NC}
  - Requires: openssl, sed
  - JWT_EXPIRY is set to 5 years
  - Keys are base64-url-encoded JWT tokens (HS256)
EOF
}

# ---- Vérifications ----
if ! command -v openssl >/dev/null 2>&1; then
    echo -e "${RED}❌ openssl is required but not found.${NC}"
    echo "  Install: sudo apt-get install openssl  (Debian/Ubuntu)"
    echo "          brew install openssl           (macOS)"
    exit 1
fi

if ! command -v sed >/dev/null 2>&1; then
    echo -e "${RED}❌ sed is required but not found.${NC}"
    echo "  Install: sudo apt-get install sed  (Debian/Ubuntu)"
    exit 1
fi

# ---- Parsing des options ----
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
fi

UPDATE_ENV=false
if [ "$1" = "-y" ] || [ "$1" = "--update-env" ]; then
    UPDATE_ENV=true
fi

# ---- Fonctions ----
gen_hex() {
    openssl rand -hex "$1"
}

gen_base64() {
    openssl rand -base64 "$1" | tr -d '\n'
}

base64_url_encode() {
    openssl enc -base64 -A | tr '+/' '-_' | tr -d '='
}

gen_token() {
    local payload="$1"
    local payload_base64=$(printf %s "$payload" | base64_url_encode)
    local header_base64=$(printf %s "$header" | base64_url_encode)
    local signed_content="${header_base64}.${payload_base64}"
    local signature=$(printf %s "$signed_content" | openssl dgst -binary -sha256 -hmac "$jwt_secret" | base64_url_encode)
    printf '%s' "${signed_content}.${signature}"
}

# ---- Génération des clés ----
echo -e "${GREEN}${BOLD}🔐 Generating secrets and JWT keys...${NC}"

jwt_secret="$(gen_base64 30)"
header='{"alg":"HS256","typ":"JWT"}'
iat=$(date +%s)
exp=$((iat + 5 * 3600 * 24 * 365))  # 5 years

anon_key=$(gen_token "{\"role\":\"anon\",\"iss\":\"supabase\",\"iat\":$iat,\"exp\":$exp}")
service_role_key=$(gen_token "{\"role\":\"service_role\",\"iss\":\"supabase\",\"iat\":$iat,\"exp\":$exp}")

secret_key_base=$(gen_base64 48)
realtime_db_enc_key=$(gen_hex 8)
vault_enc_key=$(gen_hex 16)
pg_meta_crypto_key=$(gen_base64 24)
logflare_public_access_token=$(gen_base64 24)
logflare_private_access_token=$(gen_base64 24)
s3_protocol_access_key_id=$(gen_hex 16)
s3_protocol_access_key_secret=$(gen_hex 32)
minio_root_password=$(gen_hex 16)
postgres_password=$(gen_hex 16)
dashboard_password=$(gen_hex 16)

# ---- Affichage des clés ----
echo ""
echo -e "${YELLOW}${BOLD}📋 Generated keys:${NC}"
echo ""
echo "JWT_SECRET=${jwt_secret}"
echo "ANON_KEY=${anon_key}"
echo "SERVICE_ROLE_KEY=${service_role_key}"
echo "SECRET_KEY_BASE=${secret_key_base}"
echo "REALTIME_DB_ENC_KEY=${realtime_db_enc_key}"
echo "VAULT_ENC_KEY=${vault_enc_key}"
echo "PG_META_CRYPTO_KEY=${pg_meta_crypto_key}"
echo "LOGFLARE_PUBLIC_ACCESS_TOKEN=${logflare_public_access_token}"
echo "LOGFLARE_PRIVATE_ACCESS_TOKEN=${logflare_private_access_token}"
echo "S3_PROTOCOL_ACCESS_KEY_ID=${s3_protocol_access_key_id}"
echo "S3_PROTOCOL_ACCESS_KEY_SECRET=${s3_protocol_access_key_secret}"
echo "MINIO_ROOT_PASSWORD=${minio_root_password}"
echo "POSTGRES_PASSWORD=${postgres_password}"
echo "DASHBOARD_PASSWORD=${dashboard_password}"
echo ""

# ---- Décision d'écriture ----
if [ "$UPDATE_ENV" = false ] && [ -t 0 ]; then
    # Mode interactif (terminal)
    echo -e "${YELLOW}📝 Update .env file? (y/N)${NC} "
    read -r REPLY
    [[ "$REPLY" =~ ^[Yy]$ ]] && UPDATE_ENV=true
fi

if [ "$UPDATE_ENV" != "true" ]; then
    echo -e "${GREEN}✅ Done. Keys printed above.${NC}"
    echo ""
    echo -e "${YELLOW}💡 To update .env automatically, run:${NC}"
    echo "  $0 -y"
    exit 0
fi

# ---- Localisation du fichier .env ----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Chercher .env dans l'ordre de priorité
if [ -f "$PROJECT_ROOT/supabase/docker/.env" ]; then
    ENV_FILE="$PROJECT_ROOT/supabase/docker/.env"
elif [ -f "$PROJECT_ROOT/.env" ] && [ "${ALLOW_ENV_WRITE:-0}" = "1" ]; then
    ENV_FILE="$PROJECT_ROOT/.env"
    echo -e "${YELLOW}⚠️  Using root .env (not recommended for self-hosted)${NC}"
else
    # Créer à partir du template
    TEMPLATE="$PROJECT_ROOT/supabase/docker/.env.hadratech"
    if [ -f "$TEMPLATE" ]; then
        echo -e "${YELLOW}⚠️  .env not found. Creating from .env.hadratech...${NC}"
        cp "$TEMPLATE" "$PROJECT_ROOT/supabase/docker/.env"
        ENV_FILE="$PROJECT_ROOT/supabase/docker/.env"
    else
        echo -e "${RED}❌ No .env file found and no template available.${NC}"
        echo "   Looking for: $PROJECT_ROOT/supabase/docker/.env"
        echo "   Or create one from .env.hadratech"
        exit 1
    fi
fi

echo -e "${YELLOW}📝 Updating: $ENV_FILE${NC}"

# ---- Sauvegarde ----
BACKUP_FILE="${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$ENV_FILE" "$BACKUP_FILE"
echo -e "${GREEN}✅ Backup saved: $BACKUP_FILE${NC}"

# ---- Fonction de mise à jour ou ajout ----
update_or_add_var() {
    local var_name="$1"
    local var_value="$2"
    local file="$3"
    
    if grep -q "^${var_name}=" "$file"; then
        # Variable existe → la mettre à jour
        sed -i "s|^${var_name}=.*$|${var_name}=${var_value}|" "$file"
    else
        # Variable n'existe pas → l'ajouter à la fin
        echo "${var_name}=${var_value}" >> "$file"
    fi
}

# ---- Mise à jour des variables ----
echo -e "${YELLOW}📝 Writing keys to .env...${NC}"

update_or_add_var "JWT_SECRET" "$jwt_secret" "$ENV_FILE"
update_or_add_var "ANON_KEY" "$anon_key" "$ENV_FILE"
update_or_add_var "SERVICE_ROLE_KEY" "$service_role_key" "$ENV_FILE"
update_or_add_var "SECRET_KEY_BASE" "$secret_key_base" "$ENV_FILE"
update_or_add_var "REALTIME_DB_ENC_KEY" "$realtime_db_enc_key" "$ENV_FILE"
update_or_add_var "VAULT_ENC_KEY" "$vault_enc_key" "$ENV_FILE"
update_or_add_var "PG_META_CRYPTO_KEY" "$pg_meta_crypto_key" "$ENV_FILE"
update_or_add_var "LOGFLARE_PUBLIC_ACCESS_TOKEN" "$logflare_public_access_token" "$ENV_FILE"
update_or_add_var "LOGFLARE_PRIVATE_ACCESS_TOKEN" "$logflare_private_access_token" "$ENV_FILE"
update_or_add_var "S3_PROTOCOL_ACCESS_KEY_ID" "$s3_protocol_access_key_id" "$ENV_FILE"
update_or_add_var "S3_PROTOCOL_ACCESS_KEY_SECRET" "$s3_protocol_access_key_secret" "$ENV_FILE"
update_or_add_var "MINIO_ROOT_PASSWORD" "$minio_root_password" "$ENV_FILE"
update_or_add_var "POSTGRES_PASSWORD" "$postgres_password" "$ENV_FILE"
update_or_add_var "DASHBOARD_PASSWORD" "$dashboard_password" "$ENV_FILE"

echo -e "${GREEN}✅ $ENV_FILE updated successfully!${NC}"
echo -e "${GREEN}✅ Backup: $BACKUP_FILE${NC}"

# ---- Vérification finale ----
echo ""
echo -e "${YELLOW}🔍 Quick verification:${NC}"
echo -n "  JWT_SECRET: "
grep -E "^JWT_SECRET=" "$ENV_FILE" | cut -d'=' -f2- | head -c 30 && echo "..."
echo -n "  ANON_KEY: "
grep -E "^ANON_KEY=" "$ENV_FILE" | cut -d'=' -f2- | head -c 30 && echo "..."
echo -n "  POSTGRES_PASSWORD: "
grep -E "^POSTGRES_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2- | head -c 20 && echo "..."
echo ""

echo -e "${GREEN}${BOLD}✅ All keys generated and written to .env!${NC}"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "  1. Start Supabase:  cd supabase/docker && sh run.sh start"
echo "  2. Or use:          ./scripts/start-supabase.sh"
echo "  3. Check status:    cd supabase/docker && sh run.sh status"