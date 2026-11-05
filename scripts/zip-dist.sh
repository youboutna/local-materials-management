#!/usr/bin/env bash
# scripts/zip-dist.sh
# Compile et crée une archive dist-<timestamp>.zip

set -euo pipefail

DIST_DIR="./dist"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_ZIP="dist-${TIMESTAMP}.zip"

if [ ! -d "$DIST_DIR" ]; then
  echo "❌ Dossier dist/ introuvable. Lancez d'abord : npm run build"
  exit 1
fi

echo "📦 Création de $OUTPUT_ZIP..."
cd "$DIST_DIR"
zip -r -9 "../$OUTPUT_ZIP" . > /dev/null
cd ..

SIZE=$(du -h "$OUTPUT_ZIP" | cut -f1)
FILES=$(zipinfo -1 "$OUTPUT_ZIP" | wc -l | xargs)

echo ""
echo "✅ Archive créée : $OUTPUT_ZIP"
echo "   Taille  : $SIZE"
echo "   Fichiers: $FILES"