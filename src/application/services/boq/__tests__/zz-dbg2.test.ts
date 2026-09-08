import { describe, it } from 'vitest';
import { TextTableBoqParser } from '../parsers/TextTableBoqParser';
import { BoqImportOrchestrator } from '../BoqImportOrchestrator';
import { readFileSync } from 'node:fs';
const R = (...c: (string|number)[]) => c.join('\t');
const CONTENT = [
  R('#','Désignation','Régime fiscal','Unité','Qté','PU (MRU)','TVA','TVA (MRU)','Total HT (MRU)'),
  R('1','Étude géotechnique et sol','Travaux BTP','Ens.','1,00','1 500 000,00','5,00%','75 000,00','1 500 000,00'),
  R('2','Terrassement, fouilles et nivellement (L: 14,0 m × l: 10,0 m × H: 2,5 m)','Travaux BTP','m³','3 500,00','2 500,00','5,00%','437 500,00','8 750 000,00'),
  R('7','Conducteur ACSR 148 mm²','Fourniture de matériel','m','500,00','1 250,00','5,00%','31 250,00','625 000,00'),
  R('8','Supports béton 12m/200 daN & armements','Fourniture de matériel','unité','150,00','45 000,00','5,00%','337 500,00','6 750 000,00'),
].join('\n');
describe('dbg2',()=>{it('x',async()=>{
const p=await new TextTableBoqParser().parse(new File([CONTENT],'a.txt',{type:'text/plain'}));
const dtos=BoqImportOrchestrator.toDtos(p.rows,BoqImportOrchestrator.autoMap(p.columns),{source:'dqe',contextId:'x'});
dtos.forEach(d=>console.log('ROW', d.designation.slice(0,40),'| q=',d.quantity,'| pu=',d.unitPrice,'| ht=',d.totalHt));
})});
