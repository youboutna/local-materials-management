import { describe, it } from 'vitest';
import { TextTableBoqParser } from '/dev-server/src/application/services/boq/parsers/TextTableBoqParser';
import { BoqImportOrchestrator } from '/dev-server/src/application/services/boq/BoqImportOrchestrator';
const R = (...c: (string|number)[]) => c.join('\t');
const CONTENT=[R('#','Désignation','Régime fiscal','Unité','Qté','PU (MRU)','TVA','TVA (MRU)','Total HT (MRU)'),
R('6','Câble U-1000 RO2V 4x150 mm²','Fourniture de matériel','m','2 000,00','3 200,00','5,00%','320 000,00','6 400 000,00')].join('\n');
describe('dbg',()=>{it('x',async()=>{
const p=await new TextTableBoqParser().parse(new File([CONTENT],'a.txt',{type:'text/plain'}));
const m=BoqImportOrchestrator.autoMap(p.columns);
console.log(JSON.stringify(m));
console.log(JSON.stringify(p.rows,null,1));
console.log(JSON.stringify(BoqImportOrchestrator.toDtos(p.rows,m,{source:'dqe',contextId:'x'}),null,1));
})});
