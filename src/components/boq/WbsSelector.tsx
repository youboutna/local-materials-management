/**
 * WbsSelector — cascade Phase → Jalon → Tâche, driven by config referential.
 */
import { useMemo } from 'react';
import { WBS_REFERENTIAL, type WbsPhase } from '@/config/referentials/wbs/wbs.referential';
import { getPhasesForReferential, type ReferentialType } from '@/config/referentials';
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
  referentialCode?: ReferentialType;
  /** Override dynamique (ex. phases réelles du projet). Prioritaire sur referentialCode. */
  phases?: WbsPhase[];
}

const NONE = '__none__';

export function WbsSelector({ value, onChange, disabled, referentialCode, phases: phasesOverride }: Props) {
  const phases: WbsPhase[] = useMemo(() => {
    if (phasesOverride && phasesOverride.length > 0) return phasesOverride;
    if (!referentialCode) return WBS_REFERENTIAL;
    return getPhasesForReferential(referentialCode).map((phase) => ({
      id: phase.code,
      label: phase.label,
      milestones: phase.steps.map((step) => ({
        id: step.code,
        label: step.label,
        tasks: step.tasks.map((task) => ({ id: task.code, label: task.label })),
      })),
    }));
  }, [phasesOverride, referentialCode]);
  const phase = useMemo(() => phases.find((p) => p.id === value.phaseId) ?? null, [phases, value.phaseId]);
  const milestone = useMemo(() => phase?.milestones.find((m) => m.id === value.milestoneId) ?? null, [phase, value.milestoneId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <Label>Phase</Label>
        <Select
          value={value.phaseId ?? NONE}
          onValueChange={(v) => onChange({ phaseId: v === NONE ? null : v, milestoneId: null, taskId: null })}
          disabled={disabled}
        >
          <SelectTrigger><SelectValue placeholder="Phase WBS" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Non assignée</SelectItem>
            {phases.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Jalon</Label>
        <Select
          value={value.milestoneId ?? NONE}
          onValueChange={(v) => onChange({ ...value, milestoneId: v === NONE ? null : v, taskId: null })}
          disabled={disabled || !phase}
        >
          <SelectTrigger><SelectValue placeholder={phase ? 'Jalon' : 'Sélectionner phase'} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Non assigné</SelectItem>
            {phase?.milestones.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Tâche</Label>
        <Select
          value={value.taskId ?? NONE}
          onValueChange={(v) => onChange({ ...value, taskId: v === NONE ? null : v })}
          disabled={disabled || !milestone}
        >
          <SelectTrigger><SelectValue placeholder={milestone ? 'Tâche' : 'Sélectionner jalon'} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Non assignée</SelectItem>
            {milestone?.tasks.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
