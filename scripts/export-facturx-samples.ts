/**
 * Export des échantillons Factur-X (XML CII) pour validation externe (ZUGFeRD / FNFE validator).
 *
 * Usage : bun run scripts/export-facturx-samples.ts [dossier_sortie]
 * Sortie par défaut : /mnt/documents/facturx-samples
 *
 * Génère un XML par type de document du cycle DQE → Facture, à partir du jeu
 * de données réel « Boucle 33 kV » (14 lignes, TVA 16 %).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sampleDqeBoqLines } from '../src/config/referentials/invoices/sample-dqe-boucle33kv.referential';
import { INVOICE_DOCUMENT_TYPES } from '../src/config/referentials/invoices/invoice-document-types.referential';
import { FacturXTransformer } from '../src/application/services/invoice/FacturXTransformer';

const outDir = process.argv[2] ?? '/mnt/documents/facturx-samples';
mkdirSync(outDir, { recursive: true });

const seller = {
  name: 'HadraTech BTP SARL',
  taxId: 'MR-00123456',
  address: 'Ilot K, Tevragh Zeina',
  city: 'Nouakchott',
  country: 'MR',
};
const buyer = {
  name: 'SOMELEC',
  taxId: 'MR-00987654',
  address: 'Avenue de l’Indépendance',
  city: 'Nouakchott',
  country: 'MR',
};

const lines = sampleDqeBoqLines('boucle-33kv');
const report: Array<Record<string, string | number>> = [];

for (const def of INVOICE_DOCUMENT_TYPES) {
  const percentage = def.requiresPercentage ? 30 : null;
  const docLines = percentage
    ? lines.map((l) => ({
        ...l,
        quantity: (l.quantity ?? 0) * (percentage / 100),
        totalHt: (l.totalHt ?? 0) * (percentage / 100),
      }))
    : lines;

  const xml = FacturXTransformer.toCiiXml(docLines, {
    documentType: def.code,
    reference: `B33KV-${def.code.toUpperCase()}-2026-001`,
    issueDate: new Date().toISOString(),
    seller,
    buyer,
    percentage,
  });

  const totals = FacturXTransformer.computeTotals(docLines);
  const file = join(outDir, `facturx-${def.code}.xml`);
  writeFileSync(file, xml, 'utf-8');

  // Contrôles structurels minimaux (bien-formé, TypeCode, totaux présents)
  const wellFormed =
    xml.trim().startsWith('<?xml') && xml.includes('CrossIndustryInvoice') && !/<[^>]*<\s/.test(xml);
  const typeCodeOk = xml.includes(`<ram:TypeCode>${def.facturxTypeCode}</ram:TypeCode>`);
  const totalsOk = xml.includes('SpecifiedTradeSettlementHeaderMonetarySummation');

  report.push({
    document: def.code,
    typeCode: def.facturxTypeCode,
    lignes: docLines.length,
    totalHt: Number(totals.totalHt.toFixed(2)),
    totalTva: Number(totals.totalTva.toFixed(2)),
    totalTtc: Number(totals.totalTtc.toFixed(2)),
    netAPayer: Number(totals.netToPay.toFixed(2)),
    structure: wellFormed && typeCodeOk && totalsOk ? 'OK' : 'ECHEC',
    fichier: file,
  });
}

writeFileSync(join(outDir, 'rapport-facturx.json'), JSON.stringify(report, null, 2), 'utf-8');
console.table(report);
console.log(`\n${report.length} échantillons écrits dans ${outDir}`);
console.log('Validation officielle : déposer les XML sur https://validator.fnfe-mpe.org ou le ZUGFeRD validator.');
