import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorkbenchOperations } from '@/hooks/hexagonal/useProjectWorkbenchHex';
import { ProjectWorkbenchTransformer } from '@/dtos/transforms/ProjectWorkbenchTransformer';
import type { ProjectOperationDTO, SaveProjectOperationDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
import type { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import { Save, X } from 'lucide-react';
export function ProjectOperationEditor({ projectId, currency, date, kind, phases, existing, onClose }: { projectId: string; currency: string; date: string; kind: ProjectOperationDTO['kind']; phases: PhaseDTO[]; existing?: ProjectOperationDTO; onClose: () => void }) {
  const { t } = useLanguage();
  const [form, setForm] = useState<SaveProjectOperationDTO>(existing || { projectId, kind, occurredOn: date, label: '', unit: '', currency, quantity: 1, amount: 0, resourceFamily: kind === 'consumption' ? 'material' : undefined });
  const [error, setError] = useState('');
  const { saveOperation, isPending } = useWorkbenchOperations(projectId);
  const update = (patch: Partial<SaveProjectOperationDTO>) => setForm(value => ({ ...value, ...patch }));
  return <form className="border-y border-border py-5 space-y-4" onSubmit={async event => { event.preventDefault(); setError(''); try { await saveOperation(ProjectWorkbenchTransformer.formToOperation(form)); onClose(); } catch (e) { setError(e instanceof Error ? e.message : t('common.error')); } }}>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div><Label htmlFor="operation-label">{t('workbench.label')}</Label><Input id="operation-label" required value={form.label} onChange={e => update({ label: e.target.value })} /></div>
      <div><Label htmlFor="operation-date">{t('workbench.date')}</Label><Input id="operation-date" type="date" required value={form.occurredOn} onChange={e => update({ occurredOn: e.target.value })} /></div>
      <div><Label>{t('workbench.phase')}</Label><Select value={form.phaseId || 'none'} onValueChange={value => update({ phaseId: value === 'none' ? undefined : value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{t('workbench.project_total')}</SelectItem>{phases.map(phase => <SelectItem key={phase.id} value={phase.id}>{phase.name}</SelectItem>)}</SelectContent></Select></div>
      {kind === 'consumption' && <div><Label>{t('workbench.family')}</Label><Select value={form.resourceFamily} onValueChange={value => update({ resourceFamily: value as SaveProjectOperationDTO['resourceFamily'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['human','material','equipment'].map(family => <SelectItem key={family} value={family}>{t(`workbench.${family}`)}</SelectItem>)}</SelectContent></Select></div>}
      <div><Label htmlFor="operation-quantity">{t('workbench.quantity')}</Label><Input id="operation-quantity" type="number" min="0" step="any" required value={form.quantity} onChange={e => update({ quantity: Number(e.target.value) })} /></div>
      <div><Label htmlFor="operation-unit">{t('workbench.unit')}</Label><Input id="operation-unit" required value={form.unit} onChange={e => update({ unit: e.target.value })} /></div>
      <div><Label htmlFor="operation-amount">{t('workbench.amount')} ({form.currency})</Label><Input id="operation-amount" type="number" min="0" step="any" required value={form.amount} onChange={e => update({ amount: Number(e.target.value) })} /></div>
      <div><Label htmlFor="operation-source">{t('workbench.source')}</Label><Input id="operation-source" value={form.sourceReference || ''} onChange={e => update({ sourceReference: e.target.value })} /></div>
    </div>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="flex gap-2"><Button type="submit" disabled={isPending}><Save className="h-4 w-4 mr-2" />{t('common.save')}</Button><Button type="button" variant="outline" disabled={isPending} onClick={onClose}><X className="h-4 w-4 mr-2" />{t('common.cancel')}</Button></div>
  </form>;
}