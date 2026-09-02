/**
 * src/components/boq/WbsScopeSelector.tsx
 * WbsScopeSelector — périmètre documentaire multi-options (phases / jalons / tâches).
 * Sert à restreindre les options proposées par WbsSelector : un DQE enrichi peut
 * couvrir plusieurs phases, jalons et tâches à la fois.
 */
import { useMemo } from 'react';
import type { WbsPhase } from '@/config/referentials/wbs/wbs.referential';
import type { WbsScopeValue } from './WbsSelector';

export type { WbsScopeValue } from './WbsSelector';
import { MultiSelectCombobox, type MultiSelectOption } from '@/components/ui/multi-select-combobox';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/hooks/useI18n';
import { T } from '@/components/i18n/T';

interface Props {
  phases: WbsPhase[];
  value: WbsScopeValue;
  onChange: (next: WbsScopeValue) => void;
  disabled?: boolean;
}

export const EMPTY_WBS_SCOPE: WbsScopeValue = { phaseIds: [], milestoneIds: [], taskIds: [] };

export function WbsScopeSelector({ phases, value, onChange, disabled }: Props) {
  const { t } = useI18n();

  /** Phases retenues (ou toutes si aucun filtre de phase). */
  const scopedPhases = useMemo(
    () => (value.phaseIds.length > 0 ? phases.filter((p) => value.phaseIds.includes(p.id)) : phases),
    [phases, value.phaseIds],
  );

  const phaseOptions = useMemo<MultiSelectOption[]>(
    () => phases.map((p) => ({ value: p.id, label: p.label })),
    [phases],
  );

  const milestoneOptions = useMemo<MultiSelectOption[]>(
    () => scopedPhases.flatMap((p) => p.milestones.map((m) => ({ value: m.id, label: m.label, description: p.label }))),
    [scopedPhases],
  );

  const scopedMilestones = useMemo(
    () => scopedPhases.flatMap((p) =>
      p.milestones.filter((m) => value.milestoneIds.length === 0 || value.milestoneIds.includes(m.id))
        .map((m) => ({ phase: p, milestone: m })),
    ),
    [scopedPhases, value.milestoneIds],
  );

  const taskOptions = useMemo<MultiSelectOption[]>(
    () => scopedMilestones.flatMap(({ milestone }) =>
      milestone.tasks.map((tk) => ({ value: tk.id, label: tk.label, description: milestone.label })),
    ),
    [scopedMilestones],
  );

  /** Nettoyage en cascade : un jalon/tâche hors périmètre est retiré automatiquement. */
  const setPhases = (phaseIds: string[]) => {
    const allowedMilestones = new Set(
      (phaseIds.length > 0 ? phases.filter((p) => phaseIds.includes(p.id)) : phases)
        .flatMap((p) => p.milestones.map((m) => m.id)),
    );
    const milestoneIds = value.milestoneIds.filter((id) => allowedMilestones.has(id));
    const allowedTasks = new Set(
      (phaseIds.length > 0 ? phases.filter((p) => phaseIds.includes(p.id)) : phases)
        .flatMap((p) => p.milestones.flatMap((m) => m.tasks.map((tk) => tk.id))),
    );
    onChange({ phaseIds, milestoneIds, taskIds: value.taskIds.filter((id) => allowedTasks.has(id)) });
  };

  const setMilestones = (milestoneIds: string[]) => {
    const allowedTasks = new Set(
      scopedPhases.flatMap((p) =>
        p.milestones
          .filter((m) => milestoneIds.length === 0 || milestoneIds.includes(m.id))
          .flatMap((m) => m.tasks.map((tk) => tk.id)),
      ),
    );
    onChange({ ...value, milestoneIds, taskIds: value.taskIds.filter((id) => allowedTasks.has(id)) });
  };

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
      <div className="min-w-0 space-y-1">
        <Label className="text-[11px] text-muted-foreground">
          <T k="auto.wbsscope.phases" fallback="Phases du document" />
        </Label>
        <MultiSelectCombobox
          values={value.phaseIds}
          onChange={setPhases}
          options={phaseOptions}
          disabled={disabled}
          placeholder={t('wbs.select_phase')}
          showBadges={false}
          size="sm"
        />
      </div>
      <div className="min-w-0 space-y-1">
        <Label className="text-[11px] text-muted-foreground">
          <T k="auto.wbsscope.jalons" fallback="Jalons du document" />
        </Label>
        <MultiSelectCombobox
          values={value.milestoneIds}
          onChange={setMilestones}
          options={milestoneOptions}
          disabled={disabled || milestoneOptions.length === 0}
          placeholder={t('wbs.select_milestone')}
          showBadges={false}
          size="sm"
        />
      </div>
      <div className="min-w-0 space-y-1">
        <Label className="text-[11px] text-muted-foreground">
          <T k="auto.wbsscope.taches" fallback="Tâches du document" />
        </Label>
        <MultiSelectCombobox
          values={value.taskIds}
          onChange={(taskIds) => onChange({ ...value, taskIds })}
          options={taskOptions}
          disabled={disabled || taskOptions.length === 0}
          placeholder={t('wbs.select_task')}
          showBadges={false}
          size="sm"
        />
      </div>
    </div>
  );
}
