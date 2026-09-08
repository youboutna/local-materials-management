import { describe, it } from 'vitest';
import { readFileSync } from 'fs';
class Stub {}
for (const key of ['DOMMatrix', 'Path2D', 'ImageData'] as const) {
  if (!(key in globalThis)) (globalThis as Record<string, unknown>)[key] = Stub;
}
describe('dbg', () => {
  it('raw', async () => {
    const pdfjs: any = await import('pdfjs-dist');
    const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync('/tmp/dqe2.pdf')) }).promise;
    for (const p of [1, 2]) {
      const items = (await (await doc.getPage(p)).getTextContent()).items;
      items.filter((i: any) => /g.otechniq|^ue|dalle|support|Transformat|eur 100|appareillag/.test(i.str))
        .forEach((i: any) => console.log('RAW', p, JSON.stringify(i.str), 'hasEOL=' + i.hasEOL, 'w=' + i.width?.toFixed(1)));
    }
  }, 120000);
});
