import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorkbenchOperations, useWorkbenchFinance, useOperationContexts } from '@/hooks/hexagonal/useProjectWorkbenchHex';
import { ProjectWorkbenchTransformer } from '@/dtos/transforms/ProjectWorkbenchTransformer';
import type { ProjectOperationDTO, SaveProjectOperationDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
import type { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import type { TaskAssignmentDTO } from '@/dtos/entities/TaskAssignmentDTO';
import { Save, X } from 'lucide-react';
export function ProjectOperationEditor({ projectId, currency, date, kind, phases, tasks = [], existing, onClose }: { projectId: string; currency: string; date: string; kind: ProjectOperationDTO['kind']; phases: PhaseDTO[]; tasks?: TaskAssignmentDTO[]; existing?: ProjectOperationDTO; onClose: () => void }) {
  const { t, language } = useLanguage();
  const contexts=useOperationContexts(projectId);
  const finance = useWorkbenchFinance(projectId);
  const [form, setForm] = useState<SaveProjectOperationDTO>(existing || { projectId, kind, occurredOn: date, label: '', unit: '', currency, quantity: 1, amount: 0, status:'draft', contextCode:'unreconciled', perspective:'owner', requestKey:crypto.randomUUID(), resourceFamily: kind === 'consumption' ? 'material' : undefined });
  const [error, setError] = useState('');
  const { saveOperation, isPending } = useWorkbenchOperations(projectId);
  const update = (patch: Partial<SaveProjectOperationDTO>) => setForm(value => ({ ...value, ...patch }));
  return <form className="border-y border-border py-5 space-y-4" onSubmit={async event => { event.preventDefault(); setError(''); try { await saveOperation(ProjectWorkbenchTransformer.formToOperation(form)); onClose(); } catch (e) { setError(e instanceof Error ? e.message : t('common.error')); } }}>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div><Label>{t('workbench.context')}</Label><Select value={form.contextCode || 'unreconciled'} onValueChange={contextCode => update({contextCode})}><SelectTrigger aria-label={t('workbench.context')}><SelectValue placeholder={t('workbench.ph_select')} /></SelectTrigger><SelectContent>{[...new Map((contexts.data??[]).filter(item=>!Array.isArray(item.metadata.kinds)||item.metadata.kinds.includes(kind)).map(item=>[item.code,item])).values()].map(item => <SelectItem key={item.id} value={item.code}>{language==='ar'?item.labelAr||item.labelFr:language==='en'?item.labelEn||item.labelFr:item.labelFr}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>{t('workbench.resources')}</Label><Select value={form.resourceId||'none'} onValueChange={resourceId=>update({resourceId:resourceId==='none'?undefined:resourceId})}><SelectTrigger aria-label={t('workbench.resources')}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{t('workbench.no_source')}</SelectItem>{finance.data?.allocatedResources.map(item=><SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>{t('workbench.perspective')}</Label><Select value={form.perspective || 'owner'} onValueChange={perspective => update({perspective:perspective as 'owner'|'contractor'})}><SelectTrigger aria-label={t('workbench.perspective')}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="owner">{t('workbench.owner')}</SelectItem><SelectItem value="contractor">{t('workbench.contractor')}</SelectItem></SelectContent></Select></div>
      <div className="sm:col-span-2"><Label>{t('workbench.source_line')}</Label><Select value={form.sourceLineId || 'none'} onValueChange={id => { const line=finance.data?.lines.find(item => item.id===id); update({sourceLineId:line?.id,phaseId:line?.phaseId ?? form.phaseId,taskId:line?.taskId ?? undefined,unit:line?.unit ?? form.unit,label:form.label || line?.designation || ''}); }}><SelectTrigger aria-label={t('workbench.source_line')}><SelectValue placeholder={t('workbench.ph_select')} /></SelectTrigger><SelectContent><SelectItem value="none">{t('workbench.no_source')}</SelectItem>{finance.data?.lines.filter(line => line.id && (!form.phaseId || !line.phaseId || line.phaseId===form.phaseId)).map(line => <SelectItem key={line.id} value={line.id || ''}>{line.documentType || line.dqeType || line.source} · {line.designation} · {line.quantity} {line.unit}</SelectItem>)}</SelectContent></Select></div>
      <div className="sm:col-span-2"><Label>{t('workbench.linked_decompte')}</Label><Select value={form.decompteId || 'none'} onValueChange={id => update({decompteId:id==='none'?undefined:id})}><SelectTrigger aria-label={t('workbench.linked_decompte')}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{t('workbench.no_source')}</SelectItem>{finance.data?.decomptes.map(item => <SelectItem key={item.id} value={item.id}>{item.decompteNumber} · {item.validatedAmount.toLocaleString()} {currency}</SelectItem>)}</SelectContent></Select></div>
      <div><Label htmlFor="operation-label">{t('workbench.label')}</Label><Input id="operation-label" required value={form.label} onChange={e => update({ label: e.target.value })} /></div>
      <div><Label htmlFor="operation-date">{t('workbench.date')}</Label><Input id="operation-date" type="date" required value={form.occurredOn} onChange={e => update({ occurredOn: e.target.value })} /></div>
      <div><Label>{t('workbench.phase')}</Label><Select value={form.phaseId || 'none'} onValueChange={value => update({ phaseId: value === 'none' ? undefined : value, taskId: undefined })}><SelectTrigger aria-label={t('workbench.phase')}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{t('workbench.project_total')}</SelectItem>{phases.map(phase => <SelectItem key={phase.id} value={phase.id}>{phase.name}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>{t('workbench.task')}</Label><Select value={form.taskId || 'none'} onValueChange={value => update({ taskId: value === 'none' ? undefined : value })}><SelectTrigger aria-label={t('workbench.task')}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{t('workbench.project_total')}</SelectItem>{tasks.filter(task => !form.phaseId || task.phaseId === form.phaseId).map(task => <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>)}</SelectContent></Select></div>
      {kind === 'consumption' && <div><Label>{t('workbench.family')}</Label><Select value={form.resourceFamily} onValueChange={value => update({ resourceFamily: value as SaveProjectOperationDTO['resourceFamily'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['human','material','equipment'].map(family => <SelectItem key={family} value={family}>{t(`workbench.${family}`)}</SelectItem>)}</SelectContent></Select></div>}
      <div><Label htmlFor="operation-quantity">{t('workbench.quantity')}</Label><Input id="operation-quantity" type="number" min="0" step="any" required value={form.quantity} onChange={e => update({ quantity: Number(e.target.value) })} /></div>
      <div><Label htmlFor="operation-unit">{t('workbench.unit')}</Label><Input id="operation-unit" required value={form.unit} onChange={e => update({ unit: e.target.value })} /></div>
      <div><Label htmlFor="operation-amount">{t('workbench.amount')} ({form.currency})</Label><Input id="operation-amount" type="number" min="0" step="any" required value={form.amount} onChange={e => update({ amount: Number(e.target.value) })} /></div>
      <div><Label htmlFor="operation-source">{t('workbench.source')}</Label><Input id="operation-source" value={form.sourceReference || ''} onChange={e => update({ sourceReference: e.target.value })} /></div>
    </div>
    {finance.error && <p role="alert" className="text-destructive">{finance.error.message}</p>}
    {contexts.error && <p role="alert" className="text-destructive">{contexts.error.message}</p>}
    <div><Label htmlFor="operation-notes">{t('workbench.notes')}</Label><Textarea id="operation-notes" value={form.notes || ''} onChange={e => update({ notes: e.target.value })} /></div>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="flex gap-2"><Button type="submit" disabled={isPending}><Save className="h-4 w-4 mr-2" />{t('common.save')}</Button><Button type="button" variant="outline" disabled={isPending} onClick={onClose}><X className="h-4 w-4 mr-2" />{t('common.cancel')}</Button></div>
  </form>;
}