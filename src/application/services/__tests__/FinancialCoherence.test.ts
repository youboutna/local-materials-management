import { describe,expect,it,vi } from 'vitest';
vi.mock('@/infrastructure/adapters/supabase/SupabaseBoqRepository',()=>({boqRepository:{}}));
vi.mock('@/infrastructure/RepositoryFactory',()=>({RepositoryFactory:{}}));
import { DecompteService } from '../DecompteService';
import { ProjectFinancialsService } from '../ProjectFinancialsService';
import type { DecompteRecordDTO,DecomptePaymentDTO } from '@/dtos/entities/DecompteRecordDTO';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
const record={id:'d',status:'validated',amount:100,validatedAmount:0,paidAmount:0} as DecompteRecordDTO;
describe('Canonical financial sources',()=>{
  it('reconciles partial settlements without letting unallocated payments settle another invoice',()=>{
    const invoice={...record,validatedAmount:100};
    const payments=[{id:'p',decompteId:'d',amount:40,status:'completed'},{id:'u',decompteId:null,amount:80,status:'completed'}] as DecomptePaymentDTO[];
    const result=DecompteService.reconcile([invoice],payments);
    expect(result.lines[0]).toMatchObject({paidAmount:40,remainingAmount:60,state:'partial'});
    expect(result.unallocatedAmount).toBe(80);
    expect(DecompteService.buildSummary([invoice],payments).remainingToPay).toBe(60);
    expect(ProjectFinancialsService.build({scope:'project',entityId:'p',currency:'MRU',declaredBudget:100,lines:[],decomptes:[invoice],payments}).remainingToPay).toBe(60);
  });
  it('does not revive a paid invoice when its only transaction is rejected',()=>{
    expect(DecompteService.reconcile([{...record,status:'paid',validatedAmount:100,paidAmount:100}],[{id:'p',decompteId:'d',amount:100,status:'rejected'} as DecomptePaymentDTO]).lines[0]).toMatchObject({paidAmount:0,remainingAmount:100,state:'unpaid'});
  });
  it('deduplicates canonical invoice and payment IDs',()=>{
    const invoice={...record,validatedAmount:100};
    const payment={id:'p',decompteId:'d',amount:100,status:'completed'} as DecomptePaymentDTO;
    const result=DecompteService.reconcile([invoice,invoice],[payment,payment]);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]).toMatchObject({paidAmount:100,remainingAmount:0,state:'settled'});
    expect(DecompteService.sumPaid([invoice,invoice],[payment,payment])).toBe(100);
  });
  it('preserves historic settlements only when no payment transactions exist',()=>{
    expect(DecompteService.reconcile([{...record,status:'paid',validatedAmount:100,paidAmount:100}]).lines[0]).toMatchObject({paidAmount:100,remainingAmount:0,state:'settled'});
  });
  it('does not recognize a draft invoice as validated expenditure',()=>{
    expect(DecompteService.reconcile([{...record,status:'draft',validatedAmount:100}]).lines[0]).toMatchObject({remainingAmount:0,state:'not_validated'});
  });
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
import { ProjectWorkbenchService } from '../ProjectWorkbenchService';
describe('Revenue reconciliation',()=>{
  it('matches validated receipts to customer invoices and isolates unallocated ones',()=>{
    const inv=[{id:'i1',source:'invoice',contextId:'p',designation:'F1',unit:'u',quantity:1,totalHt:100}] as BoqLineDTO[];
    const ops=[{id:'r1',kind:'revenue',status:'validated',amount:60,sourceLineId:'i1'},{id:'r2',kind:'revenue',status:'draft',amount:40,sourceLineId:'i1'},{id:'r3',kind:'revenue',status:'validated',amount:25}] as never;
    const r=ProjectWorkbenchService.reconcileRevenue(inv,ops);
    expect(r.lines[0]).toMatchObject({receivedAmount:60,remainingAmount:40,state:'partial'});
    expect(r.unallocatedAmount).toBe(25);
  });
});
