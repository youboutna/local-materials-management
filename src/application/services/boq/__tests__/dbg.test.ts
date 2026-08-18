import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { BoqImportOrchestrator } from '@/application/services/boq/BoqImportOrchestrator';
import { SpreadsheetBoqParser } from '@/application/services/boq/parsers/SpreadsheetBoqParser';
describe('dbg', () => { it('dump', async () => {
  const buf = readFileSync('src/application/services/boq/__tests__/fixtures/dqe_ministere_petrole.xlsx');
  const f = new File([new Uint8Array(buf)], 'x.xlsx');
  const p = await new SpreadsheetBoqParser().parse(f);
  console.log('COLS', p.columns, 'FISCAL', p.detectedFiscal, 'PARTIES', JSON.stringify(p.parties));
  const m = BoqImportOrchestrator.autoMap(p.columns);
  console.log('MAP', m);
  const d = BoqImportOrchestrator.toDtos(p.rows, m, { source: 'dqe', contextId: 'p' });
  console.log('N', d.length, 'SUM', d.reduce((s,x)=>s+(x.totalHt??0),0));
  d.forEach((x)=>console.log(x.resourceType, '|', x.unit, '|', x.quantity, x.unitPrice, x.totalHt, '|', JSON.stringify(x.metadata), '|', x.designation.slice(0,40)));
}); });
