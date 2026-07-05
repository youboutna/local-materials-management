/**
 * WbsSelector — cascade Phase → Jalon → Tâche, driven by config referential.
 */
import { useMemo } from 'react';
import { WBS_REFERENTIAL, type WbsPhase } from '@/config/referentials/wbs/wbs.referential';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export interface WbsValue {
  phaseId?: string | null;
  milestoneId?: string | null;
  taskId?: string | null;
}

interface Props {
  value: WbsValue;
  onChange: (next: WbsValue) => void;
  disabled?: boolean;
}

export function WbsSelector({ value, onChange, disabled }: Props) {
  const phases: WbsPhase[] = WBS_REFERENTIAL;
  const phase = useMemo(() => phases.find((p) => p.id === value.phaseId) ?? null, [phases, value.phaseId]);
  const milestone = useMemo(() => phase?.milestones.find((m) => m.id === value.milestoneId) ?? null, [phase, value.milestoneId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <Label>Phase</Label>
        <Select
          value={value.phaseId ?? ''}
          onValueChange={(v) => onChange({ phaseId: v || null, milestoneId: null, taskId: null })}
          disabled={disabled}
        >
          <SelectTrigger><SelectValue placeholder="Phase WBS" /></SelectTrigger>
          <SelectContent>
            {phases.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Jalon</Label>
        <Select
          value={value.milestoneId ?? ''}
          onValueChange={(v) => onChange({ ...value, milestoneId: v || null, taskId: null })}
          disabled={disabled || !phase}
        >
          <SelectTrigger><SelectValue placeholder={phase ? 'Jalon' : 'Sélectionner phase'} /></SelectTrigger>
          <SelectContent>
            {phase?.milestones.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Tâche</Label>
        <Select
          value={value.taskId ?? ''}
          onValueChange={(v) => onChange({ ...value, taskId: v || null })}
          disabled={disabled || !milestone}
        >
          <SelectTrigger><SelectValue placeholder={milestone ? 'Tâche' : 'Sélectionner jalon'} /></SelectTrigger>
          <SelectContent>
            {milestone?.tasks.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
