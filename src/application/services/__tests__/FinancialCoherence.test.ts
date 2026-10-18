import { describe,expect,it,vi } from 'vitest';
vi.mock('@/infrastructure/adapters/supabase/SupabaseBoqRepository',()=>({boqRepository:{}}));
vi.mock('@/infrastructure/RepositoryFactory',()=>({RepositoryFactory:{}}));
import { DecompteService } from '../DecompteService';
import { ProjectFinancialsService } from '../ProjectFinancialsService';
import type { DecompteRecordDTO,DecomptePaymentDTO } from '@/dtos/entities/DecompteRecordDTO';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
const record={id:'d',status:'validated',amount:100,validatedAmount:0,paidAmount:0} as DecompteRecordDTO;
describe('Canonical financial sources',()=>{
  it('preserves explicitly validated zero rather than using invoiced amount',()=>{expect(DecompteService.sumValidated([record])).toBe(0);});
  it('does not treat a rejected payment as a real disbursement or revive legacy paid amounts',()=>{expect(DecompteService.sumPaid([{...record,status:'paid',paidAmount:100}],[{id:'p',amount:100,status:'rejected'} as DecomptePaymentDTO])).toBe(0);});
  it('does not add an accepted offer to its signed successor contract',()=>{
    const lines=[{id:'q',source:'dqe',contextId:'p',documentId:'quote',documentType:'devis',businessStatus:'accepted',quantity:1,unitPrice:100,designation:'Work',unit:'u'},{id:'c',source:'dqe',contextId:'p',documentId:'contract',sourceDocumentId:'quote',documentType:'contrat',businessStatus:'signed',quantity:1,unitPrice:100,designation:'Work',unit:'u'}] as BoqLineDTO[];
    expect(ProjectFinancialsService.build({scope:'project',entityId:'p',currency:'MRU',declaredBudget:100,lines,decomptes:[],payments:[]}).engaged).toBe(100);
  });
  it('does not recognize an unaccepted offer through substring matching',()=>{
    const line={id:'q',source:'dqe',contextId:'p',documentType:'devis',businessStatus:'not_accepted',quantity:1,unitPrice:100,designation:'Work',unit:'u'} as BoqLineDTO;
    expect(ProjectFinancialsService.build({scope:'project',entityId:'p',currency:'MRU',declaredBudget:100,lines:[line],decomptes:[],payments:[]}).engaged).toBe(0);
  });
});