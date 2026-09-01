#!/bin/bash
# =============================================================================
# export-data.sh – Export des données depuis le projet Supabase
# =============================================================================
# Usage: ./scripts/export-data.sh --ref PROJECT_REF --schema btp --out data.sql
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
# Lire depuis .env si disponible
if [ -f ".env" ]; then
  set -a
  source .env
  set +a
fi

PROJECT_REF=""
SCHEMA="btp"
OUT_FILE="data.sql"
TABLES=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ref) PROJECT_REF="$2"; shift 2 ;;
    --schema) SCHEMA="$2"; shift 2 ;;
    --out) OUT_FILE="$2"; shift 2 ;;
    --tables) TABLES="$2"; shift 2 ;;
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

log_info "Export depuis le projet: $PROJECT_REF"
log_info "Schéma: $SCHEMA"
log_info "Fichier de sortie: $OUT_FILE"

# ============================================================================
# EXPORT
# ============================================================================
mkdir -p "$(dirname "$OUT_FILE")"

log_info "Récupération des tables du schéma $SCHEMA..."

# Si aucune table spécifiée, les détecter
if [ -z "$TABLES" ]; then
  # Liste des tables du schéma btp
  TABLES=$(npx supabase db dump --schema "$SCHEMA" --dry-run 2>/dev/null | grep "CREATE TABLE" | sed 's/CREATE TABLE //g' | sed 's/ (.*//g' | tr '\n' ' ')
fi

log_info "Tables à exporter: $TABLES"

# Exporter les données
log_info "Export des données..."
npx supabase db dump --schema "$SCHEMA" --data-only --table "$TABLES" > "$OUT_FILE" 2>&1 || {
  log_warning "Export via supabase db dump échoué, tentative avec pg_dump..."
  
  # Méthode alternative: utiliser un script Node.js
  cat > /tmp/export-data.mjs << 'EOF'
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

const tables = process.argv[2]?.split(',') || ['projects', 'phases', 'milestones', 'tasks', 'boq_lines', 'contracts', 'suppliers', 'employees'];
const schema = process.env.SCHEMA || 'btp';
const outFile = process.env.OUT_FILE || 'data.sql';

let sql = `-- Export depuis ${process.env.PROJECT_REF}\n-- Schema: ${schema}\n\n`;

for (const table of tables) {
  const { data, error } = await supabase
    .from(`${schema}.${table}`)
    .select('*');
  
  if (error) {
    console.error(`Erreur pour ${table}:`, error);
    continue;
  }
  
  if (data && data.length > 0) {
    sql += `INSERT INTO ${schema}.${table} VALUES\n`;
    const values = data.map(row => {
      const cols = Object.values(row).map(v => {
        if (v === null) return 'NULL';
        if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
        if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
        return v;
      });
      return `  (${cols.join(', ')})`;
    });
    sql += values.join(',\n');
    sql += ';\n\n';
  }
}

fs.writeFileSync(outFile, sql);
console.log(`✅ Export terminé: ${outFile}`);
EOF

  export PROJECT_REF=$PROJECT_REF
  export SCHEMA=$SCHEMA
  export OUT_FILE=$OUT_FILE
  
  if [ -f "/tmp/export-data.mjs" ]; then
    node /tmp/export-data.mjs
  fi
}

log_success "Export terminé: $OUT_FILE"