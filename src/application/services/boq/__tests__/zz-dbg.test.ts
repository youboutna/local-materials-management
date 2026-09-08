import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
(globalThis as any).DOMMatrix ??= class { constructor(){} };
(globalThis as any).Path2D ??= class { constructor(){} };
(globalThis as any).ImageData ??= class { constructor(){} };
import { PdfBoqParser } from '../parsers/PdfBoqParser';
describe('dbg', () => { it('x', async () => {
  const buf = readFileSync(join(__dirname, 'fixtures/edb_boucle33kv_v4.pdf'));
  const parsed = await new PdfBoqParser().parse(new File([new Uint8Array(buf)], 'a.pdf', { type: 'application/pdf' }));
  console.log('PARTIES', JSON.stringify(parsed.parties));
  console.log('WARN', parsed.warnings?.slice(0,8));
  expect(1).toBe(1);
}); });
