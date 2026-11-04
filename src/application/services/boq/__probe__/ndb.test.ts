import { readFileSync } from 'node:fs';
import { it } from 'vitest';
import { BoqImportOrchestrator } from '../BoqImportOrchestrator';
import { PdfBoqParser } from '../parsers/PdfBoqParser';
class Stub {}
for (const k of ['DOMMatrix','Path2D','ImageData']) if (!(k in globalThis)) (globalThis as any)[k]=Stub;
it('probe', async () => {
  const b = readFileSync('/mnt/user-uploads/DQE_NDB-4.pdf');
  const parsed = await new PdfBoqParser().parse(new File([new Uint8Array(b)], 'dqe.pdf', { type: 'application/pdf' }));
  const dtos = BoqImportOrchestrator.toDtos(parsed.rows, BoqImportOrchestrator.autoMap(parsed.columns), { source: 'dqe', contextId: 'p' });
  console.log('COLS', JSON.stringify(parsed.columns), 'ROWS', parsed.rows.length, 'DTOS', dtos.length, 'SUM', dtos.reduce((s,d)=>s+(d.totalHt??0),0));
  console.log(JSON.stringify(parsed.rows.slice(0,8)));
}, 60000);
