import { describe, it } from 'vitest';
import { readFileSync } from 'fs';
import { detectBands, rebuildWrappedRows } from '../parsers/wrappedTableLayout';
class Stub {}
for (const key of ['DOMMatrix', 'Path2D', 'ImageData'] as const) {
  if (!(key in globalThis)) (globalThis as Record<string, unknown>)[key] = Stub;
}
describe('dbg', () => {
  it('p4', async () => {
    const pdfjs: any = await import('pdfjs-dist');
    const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync('/tmp/dqe2.pdf')) }).promise;
    const all: any[] = [];
    const pages: any[][] = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const items = (await (await doc.getPage(p)).getTextContent()).items.filter((i: any) => i?.str?.trim());
      pages.push(items); all.push(...items);
    }
    const bands = detectBands(all);
    rebuildWrappedRows(pages[3], bands).forEach((r, i) => console.log('R4', i, JSON.stringify(r)));
  }, 120000);
});
