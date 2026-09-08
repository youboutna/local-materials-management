import { describe, it } from 'vitest';
import { readFileSync } from 'fs';
import { PdfBoqParser } from '../parsers/PdfBoqParser';
class Stub {}
for (const key of ['DOMMatrix', 'Path2D', 'ImageData'] as const) {
  if (!(key in globalThis)) (globalThis as Record<string, unknown>)[key] = Stub;
}
describe('dbg', () => {
  it('rows', async () => {
    const r = await new PdfBoqParser().parse(new File([new Uint8Array(readFileSync('/tmp/dqe2.pdf'))], 'd.pdf', { type: 'application/pdf' }));
    r.rows.forEach((row, i) => console.log('ROW', i, JSON.stringify(row.raw)));
  }, 120000);
});
