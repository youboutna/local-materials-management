import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BoqImportOrchestrator } from '../BoqImportOrchestrator';
import { PdfBoqParser } from '../parsers/PdfBoqParser';
class Stub {}
for (const key of ['DOMMatrix', 'Path2D', 'ImageData'] as const) {
  if (!(key in globalThis)) (globalThis as Record<string, unknown>)[key] = Stub;
}
describe('v5', () => {
  it('dump', async () => {
    const buf = readFileSync(join(__dirname, 'fixtures/edb_boucle33kv_v5.pdf'));
    const parsed = await new PdfBoqParser().parse(new File([new Uint8Array(buf)], 'v5.pdf', { type: 'application/pdf' }));
    console.log('COLUMNS', parsed.columns);
    console.log('PARTIES', JSON.stringify(parsed.parties));
    console.log('FISCAL', JSON.stringify(parsed.detectedFiscal));
    console.log('WARN', parsed.warnings);
    console.log('ROWS', JSON.stringify(parsed.rows, null, 1));
    const m = BoqImportOrchestrator.autoMap(parsed.columns);
    console.log('MAP', m);
    const dtos = BoqImportOrchestrator.toDtos(parsed.rows, m, { source: 'dqe', contextId: 'p1' });
    console.log('DTOS', dtos.length, JSON.stringify(dtos.map(d=>[d.designation,d.quantity,d.unit,d.unitPrice,d.totalHt,d.category,d.resourceType])));
    expect(true).toBe(true);
  });
});
