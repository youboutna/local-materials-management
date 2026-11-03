#!/bin/sh
# =============================================================================
# reset-hadratech.sh — Reset de la stack Supabase HadraTech-GPI
# =============================================================================
# Différences avec reset.sh officiel :
#   - ✅ Préserve le fichier .env (ne le remplace PAS par .env.example)
#   - ✅ Préserve les volumes Docker nommés (db-config, deno-cache)
#   - ✅ Supprime uniquement les données PostgreSQL et le storage
#   - ✅ Force la réexécution des scripts d'init (btp, migrations)
#
# Usage :
#   sh reset-hadratech.sh        # Interactif (demande confirmation)
#   sh reset-hadratech.sh -y     # Automatique (pas de confirmation)
# =============================================================================

set -e

auto_confirm=0

confirm () {
    if [ "$auto_confirm" = "1" ]; then
        return 0
    fi
    printf "  → Confirmer ? (y/N) "
    read -r REPLY
    case "$REPLY" in
        [Yy]) ;;
        *) echo "  ⛔ Annulé."; exit 1 ;;
    esac
}

if [ "$1" = "-y" ]; then
    auto_confirm=1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  RESET HadraTech-GPI — Stack Supabase locale                  ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  ⚠️  Ce script va :                                            ║"
echo "║     • Arrêter tous les conteneurs                             ║"
echo "║     • Supprimer les données PostgreSQL (volumes/db/data)      ║"
echo "║     • Supprimer les fichiers storage (volumes/storage)        ║"
echo "║                                                               ║"
echo "║  ✅ Il PRÉSERVE :                                             ║"
echo "║     • Le fichier .env (clés OAuth, JWT, secrets)             ║"
echo "║     • Les volumes Docker nommés (db-config, deno-cache)      ║"
echo "║     • Les scripts d'init (volumes/db/init/)                  ║"
echo "║     • Les migrations (../migrations/)                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

confirm

# --- Étape 1 : Arrêter les conteneurs -------------------------------------
echo ""
echo "===> 1/5 Arrêt des conteneurs..."

if [ -f ".env" ]; then
    echo "     Fichier .env trouvé"
    docker compose --env-file .env -f docker-compose.yml down --remove-orphans
else
    echo "     ⚠️  Pas de fichier .env, utilisation de docker-compose.yml seul"
    docker compose -f docker-compose.yml down --remove-orphans
fi

# --- Étape 2 : Sauvegarder le .env (par précaution) -----------------------
echo ""
echo "===> 2/5 Sauvegarde du .env..."

if [ -f ".env" ]; then
    BACKUP=".env.backup.$(date +%Y%m%d_%H%M%S)"
    cp .env "$BACKUP"
    echo "     ✅ Sauvegarde créée : $BACKUP"
else
    echo "     ⚠️  Pas de .env à sauvegarder"
fi

# --- Étape 3 : Supprimer les données PostgreSQL ---------------------------
echo ""
echo "===> 3/5 Suppression des données PostgreSQL..."

if [ -d "./volumes/db/data" ]; then
    echo "     Suppression de volumes/db/data..."
    confirm
    sudo rm -rf ./volumes/db/data
    mkdir -p ./volumes/db/data
    echo "     ✅ Dossier data/ recréé (vide)"
else
    echo "     ℹ️  Dossier volumes/db/data absent"
    mkdir -p ./volumes/db/data
fi

# --- Étape 4 : Supprimer le storage ---------------------------------------
echo ""
echo "===> 4/5 Suppression du storage..."

if [ -d "./volumes/storage" ]; then
    echo "     Suppression de volumes/storage..."
    confirm
    sudo rm -rf ./volumes/storage
    mkdir -p ./volumes/storage
    echo "     ✅ Dossier storage/ recréé (vide)"
else
    echo "     ℹ️  Dossier volumes/storage absent"
    mkdir -p ./volumes/storage
fi

# --- Étape 5 : Redémarrer la stack ----------------------------------------
echo ""
echo "===> 5/5 Redémarrage de la stack..."

if [ -f ".env" ]; then
    docker compose --env-file .env -f docker-compose.yml up -d
else
    docker compose -f docker-compose.yml up -d
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✅ Reset terminé                                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "⏳ Attente de l'initialisation (60 secondes)..."
sleep 60

echo ""
echo "===> Vérification..."
echo ""

# Vérifier le schéma btp
echo "📊 Schéma 'btp' :"
docker exec supabase-db psql -U postgres -d postgres -c \
  "SELECT schema_name FROM information_schema.schemata WHERE schema_name='btp';" 2>/dev/null || \
  echo "   ⚠️  Impossible de vérifier (db pas encore prête)"

echo ""
echo "📊 Statut PostgREST :"
docker compose -f docker-compose.yml ps rest

echo ""
echo "📊 Statut global :"
docker compose -f docker-compose.yml ps

echo ""
echo "✅ Terminé. Commandes utiles :"
echo "   • Logs DB      : docker compose logs db"
echo "   • Logs REST    : docker compose logs rest"
echo "   • Tester API   : curl -H 'apikey: <ANON_KEY>' http://localhost:8000/rest/v1/"
echo ""
