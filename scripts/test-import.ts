/**
 * scripts/test-import.ts
 *
 * Test manuel d'import du dataset 2D3DTECH :
 *   1) validation dry-run, 2) import réel (upsert), 3) export de vérification.
 *
 * Exécution : bunx tsx scripts/test-import.ts  (ou via un runner Vite/Node ESM)
 */
import * as fs from 'fs';
import * as path from 'path';
import { ProjectImportExportService } from '@/application/services/ProjectImportExportService';

async function main() {
  console.log("🚀 Démarrage du test d'import 2D3DTECH");
  console.log('='.repeat(50));

  const datasetPath = path.resolve(process.cwd(), 'src/tests/fixtures/dataset-test-2d3dtech.json');
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

  console.log(`📄 Dataset chargé: ${dataset.projects.length} projets`);

  const service = ProjectImportExportService.default();

  console.log('\n📋 Étape 1: Validation (dry-run)');
  const dryResult = await service.importDataset(dataset, {
    dryRun: true,
    continueOnError: true,
  });
  console.log(`  ✅ Projets: ${dryResult.total}`);
  console.log(`  ✅ Valides: ${dryResult.total - dryResult.failed}`);
  console.log(`  ❌ Erreurs: ${dryResult.failed}`);
  console.log('  📝 Détails:', dryResult.details);
  dryResult.errors.forEach((err) =>
    console.log(`    - Ligne ${err.row}: ${err.title} - ${err.message}`),
  );

  console.log('\n📦 Étape 2: Import réel');
  const result = await service.importDataset(dataset, {
    mode: 'upsert',
    continueOnError: true,
  });
  console.log(`    ✅ Importés: ${result.imported}`);
  console.log(`    ⏭️  Ignorés: ${result.skipped}`);
  console.log(`    ❌ Échecs: ${result.failed}`);
  console.log(`    🆔 IDs créés: ${result.createdIds.length}`);
  console.log('    📝 Détails:', result.details);

  (result.changes ?? []).forEach((change) =>
    console.log(`  - ${change.entityType} ${change.entityName}: ${change.operation}`),
  );

  console.log('\n📤 Étape 3: Export de vérification');
  const exportResult = await service.exportProjects({
    format: 'json',
    includeRelations: true,
    ids: result.createdIds,
  });
  const outputPath = path.resolve(process.cwd(), 'src/tests/fixtures/export-verification.json');
  fs.writeFileSync(outputPath, exportResult.payload as string);
  console.log(`  ✅ Export sauvegardé: ${outputPath}`);

  console.log('\n✅ Test terminé');
}

main().catch(console.error);
