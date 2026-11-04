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
  const tot=dtos.reduce((s,d)=>s+(d.totalHt??0),0); console.log('XX', dtos.length, tot);  console.log('BIG', JSON.stringify(dtos.filter(d=>(d.totalHt??0)>100000).map(d=>[d.designation?.slice(0,40),d.quantity,d.unitPrice,d.totalHt])));
  console.log('DTOS', dtos.length, 'SUM', dtos.reduce((s,d)=>s+(d.totalHt??0),0));
  const cols = parsed.columns.slice(0,6);
  console.log('ROWS\n'+parsed.rows.map(r=>cols.map(c=>r.raw[c]??'').join(' | ')).slice(70,130).join('\n'));
}, 60000);
