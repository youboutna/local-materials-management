import { describe, it } from 'vitest';
import { readFileSync } from 'fs';
import { rebuildWrappedRows } from '../parsers/wrappedTableLayout';
class Stub {}
for (const key of ['DOMMatrix', 'Path2D', 'ImageData'] as const) {
  if (!(key in globalThis)) (globalThis as Record<string, unknown>)[key] = Stub;
}
describe('dbg', () => {
  it('layout', async () => {
    const pdfjs: any = await import('pdfjs-dist');
    const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync('/tmp/dqe2.pdf')) }).promise;
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const items = (await page.getTextContent()).items.filter((i: any) => i?.str?.trim());
      const rows = rebuildWrappedRows(items);
      console.log('=== PAGE', p, 'rows', rows.length);
      rows.forEach((r, i) => console.log(p, i, JSON.stringify(r)));
    }
  }, 120000);
});
