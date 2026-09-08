import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { PdfBoqParser } from '../parsers/PdfBoqParser';
class Stub {}
for (const k of ['DOMMatrix','Path2D','ImageData']) if (!(k in globalThis)) (globalThis as any)[k]=Stub;
describe('dbg', () => { it('rows', async () => {
  const buf = readFileSync('src/application/services/boq/__tests__/fixtures/edb_boucle33kv_v5.pdf');
  const p = await new PdfBoqParser().parse(new File([new Uint8Array(buf)],'a.pdf'));
  p.rows.slice(8,12).forEach(r=>console.log(JSON.stringify(r.raw)));
}, 60000); });
