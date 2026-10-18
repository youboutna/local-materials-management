import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorkbenchCalendarActions } from '@/hooks/hexagonal/useProjectWorkbenchHex';
import { TaskAssignmentTransformer } from '@/dtos/transforms/TaskAssignmentTransformer';
import type { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import type { TaskAssignmentDTO } from '@/dtos/entities/TaskAssignmentDTO';
import { Save, X } from 'lucide-react';

export function WorkbenchTaskEditor({ projectId, date, phases, existing, onClose }: {projectId: string; date: string; phases: PhaseDTO[]; existing?: TaskAssignmentDTO; onClose: () => void}) {
  const { t } = useLanguage();
  const actions = useWorkbenchCalendarActions(projectId);
  const [form,setForm] = useState({ title: existing?.title || '', phaseId: existing?.phaseId || '', startDate: existing?.startDate?.slice(0,10) || '', endDate: existing?.endDate?.slice(0,10) || '', dueDate: existing?.dueDate?.slice(0,10) || (existing ? '' : date), notes: existing?.notes || '' });
  const [error,setError] = useState('');
  const update = (patch: Partial<typeof form>) => setForm(current => ({...current,...patch}));
  return <form className="space-y-4 border-y border-border py-4" onSubmit={async event => {
    event.preventDefault(); setError('');
    try {
      const input = { ...form, projectId };
      await actions.saveTask({ id: existing?.id, data: existing ? TaskAssignmentTransformer.formToUpdateDTO(input) : TaskAssignmentTransformer.formToCreateDTO(input) });
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : t('common.error')); }
  }}>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div><Label htmlFor="calendar-task-title">{t('workbench.label')}</Label><Input id="calendar-task-title" required value={form.title} onChange={e => update({title:e.target.value})} /></div>
      <div><Label>{t('workbench.phase')}</Label><Select value={form.phaseId || 'none'} onValueChange={value => update({phaseId:value === 'none' ? '' : value})}><SelectTrigger aria-label={t('workbench.phase')}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{t('workbench.project_total')}</SelectItem>{phases.map(phase => <SelectItem key={phase.id} value={phase.id}>{phase.name}</SelectItem>)}</SelectContent></Select></div>
      {(['startDate','endDate','dueDate'] as const).map((key,index) => <div key={key}><Label htmlFor={`task-${key}`}>{t(`workbench.${['start','end','due'][index]}`)}</Label><Input id={`task-${key}`} type="date" value={form[key]} onChange={e => update({[key]:e.target.value})} /></div>)}
    </div>
    <div><Label htmlFor="calendar-task-notes">{t('workbench.notes')}</Label><Textarea id="calendar-task-notes" value={form.notes} onChange={e => update({notes:e.target.value})} /></div>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="flex gap-2"><Button type="submit" disabled={actions.isPending}><Save className="h-4 w-4 mr-2" />{t('common.save')}</Button><Button type="button" variant="outline" disabled={actions.isPending} onClick={onClose}><X className="h-4 w-4 mr-2" />{t('common.cancel')}</Button></div>
  </form>;
}