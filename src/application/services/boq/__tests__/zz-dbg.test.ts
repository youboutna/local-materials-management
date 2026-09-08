import { describe, it } from 'vitest';
import { readFileSync } from 'fs';
import { PdfBoqParser } from '../parsers/PdfBoqParser';
import { BoqImportOrchestrator } from '../BoqImportOrchestrator';
class Stub {}
for (const key of ['DOMMatrix', 'Path2D', 'ImageData'] as const) {
  if (!(key in globalThis)) (globalThis as Record<string, unknown>)[key] = Stub;
}
describe('dbg', () => {
  it('parse', async () => {
    const buf = readFileSync('/tmp/dqe2.pdf');
    const r = await new PdfBoqParser().parse(new File([new Uint8Array(buf)], 'dqe2.pdf', { type: 'application/pdf' }));
    console.log('COLUMNS', JSON.stringify(r.columns));
    console.log('WARN', r.warnings);
    const m = BoqImportOrchestrator.autoMap(r.columns);
    const dtos = BoqImportOrchestrator.toDtos(r.rows, m, { source: 'dqe', contextId: 'x' });
    console.log('DTOS', dtos.length, 'TOTAL', dtos.reduce((s, d) => s + (d.totalHt ?? 0), 0));
    dtos.forEach(d => console.log('|', d.designation, '|', d.unit, '|', d.quantity, '|', d.unitPrice, '|', d.totalHt));
  }, 120000);
});
