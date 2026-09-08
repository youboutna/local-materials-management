import { describe, it } from 'vitest';
import { readFileSync } from 'fs';
class Stub {}
for (const key of ['DOMMatrix', 'Path2D', 'ImageData'] as const) {
  if (!(key in globalThis)) (globalThis as Record<string, unknown>)[key] = Stub;
}
describe('dbg', () => {
  it('p4', async () => {
    const pdfjs: any = await import('pdfjs-dist');
    const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync('/tmp/dqe2.pdf')) }).promise;
    const page = await doc.getPage(4);
    const items = (await page.getTextContent()).items.filter((i: any) => i?.str?.trim());
    const lines: any[] = [];
    [...items].sort((a: any, b: any) => b.transform[5] - a.transform[5]).forEach((it: any) => {
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.y - it.transform[5]) <= 3) last.items.push(it);
      else lines.push({ y: it.transform[5], items: [it] });
    });
    lines.forEach((l, i) => console.log('L', i, 'y=' + l.y.toFixed(1), 'gap=' + (i ? (lines[i-1].y - l.y).toFixed(1) : '-'), JSON.stringify(l.items.map((x: any) => x.str.trim() + '@' + Math.round(x.transform[4])))));
  }, 120000);
});
