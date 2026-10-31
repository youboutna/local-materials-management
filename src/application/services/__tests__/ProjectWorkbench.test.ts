import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { describe, expect, it, vi } from 'vitest';
vi.mock('../ProjectService', () => ({ getProjectService: () => ({ getProjectWithDetails: vi.fn() }) }));
vi.mock('@/infrastructure/adapters/supabase/SupabaseProjectWorkbenchAdapter', () => ({ SupabaseProjectWorkbenchAdapter: class {} }));
import { ProjectWorkbenchService } from '../ProjectWorkbenchService';
import type { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import type { IProjectWorkbenchRepository } from '@/domain/repositories/IProjectWorkbenchRepository';
describe('Project calendar dates and scope', () => {
  const events = [{ id:'a',title:'A',kind:'task' as const,dateKind:'due' as const,date:'2026-10-31',href:'/tasks/a' },{ id:'b',title:'B',kind:'task' as const,dateKind:'due' as const,date:'2026-11-01',href:'/tasks/b' }];
  it('shows only selected day activities', () => { expect(ProjectWorkbenchService.inPeriod(events,'2026-10-31','day').map(event => event.id)).toEqual(['a']); });
  it('does not include next month events in October', () => { expect(ProjectWorkbenchService.inPeriod(events,'2026-10-15','month').map(event => event.id)).toEqual(['a']); });
  it('includes both months in the annual period', () => { expect(ProjectWorkbenchService.inPeriod(events,'2026-01-01','year').map(event => event.id)).toEqual(['a','b']); });
  it('does not read an unauthorized project', async () => { const repository = { projects:vi.fn().mockResolvedValue([]),operations:vi.fn() } as unknown as IProjectWorkbenchRepository; await expect(new ProjectWorkbenchService(repository).load('forged')).rejects.toThrow('access denied'); expect(repository.operations).not.toHaveBeenCalled(); });
  it('keeps planned and actual inspections distinct and excludes another project payment', () => {
    const project = { id:'p1', phases:[],tasks:[],inspections:[{id:'i',title:'Inspection',projectId:'p1',scheduledDate:'2026-10-01',actualDate:'2026-10-04'}],payments:[{id:'other',projectId:'p2',paymentDate:'2026-10-01'}] } as unknown as ProjectDetailDTO;
    expect(ProjectWorkbenchService.events(project).map(event => [event.dateKind,event.date])).toEqual([['scheduled','2026-10-01'],['actual','2026-10-04']]);
  });
  it('rejects negative daily consumption without persistence', async () => { const repository = { saveOperation:vi.fn() } as unknown as IProjectWorkbenchRepository; await expect(new ProjectWorkbenchService(repository).saveOperation({projectId:'p',kind:'consumption',occurredOn:'2026-10-18',label:'Fuel',quantity:-1,amount:10,unit:'L',currency:'MRU'})).rejects.toThrow(); expect(repository.saveOperation).not.toHaveBeenCalled(); });
  it('does not mark an asset completed without inspection evidence', () => { const repository = { saveRealization:vi.fn() } as unknown as IProjectWorkbenchRepository; expect(() => new ProjectWorkbenchService(repository).saveRealization({projectId:'p',assetId:'a',realization:'completed',completedOn:'2026-10-18'})).toThrow('inspection'); expect(repository.saveRealization).not.toHaveBeenCalled(); });
});describe('Revenue reconciliation',()=>{
  it('matches validated receipts to customer invoices and isolates unallocated ones',()=>{
    const inv=[{id:'i1',source:'invoice',contextId:'p',designation:'F1',unit:'u',quantity:1,totalHt:100}] as BoqLineDTO[];
    const ops=[{id:'r1',kind:'revenue',status:'validated',amount:60,sourceLineId:'i1'},{id:'r2',kind:'revenue',status:'draft',amount:40,sourceLineId:'i1'},{id:'r3',kind:'revenue',status:'validated',amount:25}] as never;
    const r=ProjectWorkbenchService.reconcileRevenue(inv,ops);
    expect(r.lines[0]).toMatchObject({receivedAmount:60,remainingAmount:40,state:'partial'});
    expect(r.unallocatedAmount).toBe(25);
  });
});
