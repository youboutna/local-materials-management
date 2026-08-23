#!/usr/bin/env bash
# Déploiement Phase 4 — module DQE / Factur-X / Appels d'offres
# Usage : ./scripts/deploy-phase4.sh [recette|production]
set -euo pipefail

ENVIRONMENT="${1:-recette}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT/logs"
ART_DIR="$ROOT/artifacts/facturx-samples"
mkdir -p "$LOG_DIR" "$ART_DIR"

echo "==> Environnement cible : $ENVIRONMENT"

REQUIRED_VARS=(VITE_DATA_PROVIDER VITE_BTP_SCHEMA VITE_PGRST_SCHEMAS)
echo "==> Vérification des variables d'environnement"
for v in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!v:-}" ] && ! grep -q "^${v}=" "$ROOT/.env" 2>/dev/null; then
    echo "    MANQUANT : $v (voir docs/DEPLOYMENT_PHASE4.md)"; exit 1
  fi
  echo "    OK : $v"
done

if [ "$ENVIRONMENT" != "recette" ] && grep -q "^VITE_DEV_MODE=true" "$ROOT/.env" 2>/dev/null; then
  echo "    ERREUR : VITE_DEV_MODE=true interdit en production"; exit 1
fi

echo "==> Tests du module DQE / Factur-X"
( cd "$ROOT" && bunx vitest run src/application/services/invoice --reporter=verbose ) \
  > "$LOG_DIR/tests-invoice.log" 2>&1
tail -6 "$LOG_DIR/tests-invoice.log"

echo "==> Non-régression complète"
( cd "$ROOT" && bunx vitest run --reporter=dot ) > "$LOG_DIR/tests-full.log" 2>&1
tail -8 "$LOG_DIR/tests-full.log"

echo "==> Génération des échantillons Factur-X (validation externe)"
( cd "$ROOT" && bun run scripts/export-facturx-samples.ts "$ART_DIR" ) \
  | tee "$LOG_DIR/facturx-samples.log"

echo "==> Migrations SQL"
if [ "$ENVIRONMENT" = "production" ]; then
  ( cd "$ROOT" && supabase db push --linked )
else
  ( cd "$ROOT" && supabase db push )
fi

echo "==> Build applicatif"
( cd "$ROOT" && bun run build ) > "$LOG_DIR/build.log" 2>&1
tail -5 "$LOG_DIR/build.log"

echo "==> Terminé. Logs dans $LOG_DIR, échantillons XML dans $ART_DIR"
echo "    Contrôles manuels : voir docs/DEPLOYMENT_PHASE4.md §4"
