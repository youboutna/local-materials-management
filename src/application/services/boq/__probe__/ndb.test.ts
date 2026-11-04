import { readFileSync } from 'node:fs';
import { it } from 'vitest';
import { BoqImportOrchestrator } from '../BoqImportOrchestrator';
import { PdfBoqParser } from '../parsers/PdfBoqParser';
class Stub {}
for (const k of ['DOMMatrix','Path2D','ImageData']) if (!(k in globalThis)) (globalThis as any)[k]=Stub;
it('probe', async () => {
  const parsed = await new PdfBoqParser().parse(new File([new Uint8Array(readFileSync('/mnt/user-uploads/DQE_NDB-4.pdf'))], 'd.pdf', { type: 'application/pdf' }));
  const dtos = BoqImportOrchestrator.toDtos(parsed.rows, BoqImportOrchestrator.autoMap(parsed.columns), { source: 'dqe', contextId: 'p' });
  console.log('XX', dtos.length, dtos.reduce((s,d)=>s+(d.totalHt??0),0), dtos.filter(d=>(d.metadata as any)?.priceCorrection).length);
}, 60000);
