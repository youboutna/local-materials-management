import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'vitest';
import { PdfBoqParser } from '../parsers/PdfBoqParser';
class Stub {}
for (const key of ['DOMMatrix', 'Path2D', 'ImageData'] as const) {
  if (!(key in globalThis)) (globalThis as Record<string, unknown>)[key] = Stub;
}
describe('dbg', () => { it('x', async () => {
  const buf = readFileSync(join(__dirname, 'fixtures/edb_boucle33kv_v4.pdf'));
  const p = await new PdfBoqParser().parse(new File([new Uint8Array(buf)], 'a.pdf', { type: 'application/pdf' }));
  console.log('COLS', JSON.stringify(p.columns));
  p.rows.forEach((r) => console.log(JSON.stringify(r.raw)));
}); });
