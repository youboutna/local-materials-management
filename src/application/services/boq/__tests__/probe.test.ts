import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { SpreadsheetBoqParser } from '@/application/services/boq/parsers/SpreadsheetBoqParser';
import { BoqImportOrchestrator } from '@/application/services/boq/BoqImportOrchestrator';

describe('probe', () => {
  it('parses', async () => {
    const buf = readFileSync('src/application/services/boq/__tests__/fixtures/dqe_ppgasdl_assaba_lot1.xlsx');
    const f = new File([new Uint8Array(buf)], 'DQE_PPGASDL_Assaba_Lot1.xlsx');
    const p = await new SpreadsheetBoqParser().parse(f);
    console.log('COLUMNS', p.columns);
    console.log('WARN', p.warnings);
    console.log('PARTIES', JSON.stringify(p.parties));
    console.log('FISCAL', JSON.stringify(p.detectedFiscal));
    console.log('ROWS', p.rows.length);
    const m = BoqImportOrchestrator.autoMap(p.columns);
    console.log('MAP', m);
    console.log('DTOS', JSON.stringify(BoqImportOrchestrator.toDtos(p.rows, m, { source: 'dqe', contextId: 'x' }), null, 1).slice(0, 3000));
  });
});
