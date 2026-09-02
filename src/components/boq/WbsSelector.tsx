/**
 * WbsSelector — cascade Phase → Jalon → Tâche, driven by config referential.
 * Les libellés proviennent du glossaire i18n (jamais l'acronyme brut « WBS »).
 */
import { useMemo } from 'react';
import { WBS_REFERENTIAL, type WbsPhase } from '@/config/referentials/wbs/wbs.referential';
import { getPhasesForReferential, type ReferentialType } from '@/config/referentials';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/hooks/useI18n';
import { T } from '@/components/i18n/T';
import { Lock } from 'lucide-react';


export interface WbsValue {
  phaseId?: string | null;
  milestoneId?: string | null;
  taskId?: string | null;
}

/**
 * Périmètre documentaire multi-options : restreint les choix proposés.
 * Une liste vide = aucune restriction sur ce niveau.
 */
export interface WbsScopeValue {
  phaseIds: string[];
  milestoneIds: string[];
  taskIds: string[];
}


interface Props {
  value: WbsValue;
  onChange: (next: WbsValue) => void;
  disabled?: boolean;
  referentialCode?: ReferentialType;
  /** Override dynamique (ex. phases réelles du projet). Prioritaire sur referentialCode. */
  phases?: WbsPhase[];
  /** Périmètre documentaire : restreint les options proposées (liste vide = pas de filtre). */
  scope?: WbsScopeValue;
  /**
   * Champs héritant du contexte projet : affichés en lecture seule avec un cadenas
   * (anti-corruption — la saisie manuelle ne peut plus casser le rattachement).
   */
  locked?: { phase?: boolean; milestone?: boolean; task?: boolean };
}

const NONE = '__none__';

/** Applique le périmètre documentaire (phases/jalons/tâches retenus) à l'arbre WBS. */
export function applyWbsScope(phases: WbsPhase[], scope?: WbsScopeValue): WbsPhase[] {
  if (!scope) return phases;
  const keepPhase = scope.phaseIds.length > 0;
  const keepMilestone = scope.milestoneIds.length > 0;
  const keepTask = scope.taskIds.length > 0;
  if (!keepPhase && !keepMilestone && !keepTask) return phases;

  return phases
    .filter((p) => !keepPhase || scope.phaseIds.includes(p.id))
    .map((p) => ({
      ...p,
      milestones: p.milestones
        .filter((m) => !keepMilestone || scope.milestoneIds.includes(m.id))
        .map((m) => ({
          ...m,
          tasks: m.tasks.filter((tk) => !keepTask || scope.taskIds.includes(tk.id)),
        })),
    }));
}

export function WbsSelector({ value, onChange, disabled, referentialCode, phases: phasesOverride, locked, scope }: Props) {
  const { t } = useI18n();
  const phases: WbsPhase[] = useMemo(() => {
    const base: WbsPhase[] = (phasesOverride && phasesOverride.length > 0)
      ? phasesOverride
      : !referentialCode
        ? WBS_REFERENTIAL
        : getPhasesForReferential(referentialCode).map((phase) => ({
            id: phase.code,
            label: phase.label,
            milestones: phase.steps.map((step) => ({
              id: step.code,
              label: step.label,
              tasks: step.tasks.map((task) => ({ id: task.code, label: task.label })),
            })),
          }));
    return applyWbsScope(base, scope);
  }, [phasesOverride, referentialCode, scope]);

  const phase = useMemo(() => phases.find((p) => p.id === value.phaseId) ?? null, [phases, value.phaseId]);
  const milestone = useMemo(() => phase?.milestones.find((m) => m.id === value.milestoneId) ?? null, [phase, value.milestoneId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <Label className="flex items-center gap-1">
          <T k="auto.wbsselector.phase" fallback="Phase" />
          {locked?.phase && <Lock className="h-3 w-3 text-muted-foreground" aria-hidden />}
        </Label>
        <Select
          value={value.phaseId ?? NONE}
          onValueChange={(v) => onChange({ phaseId: v === NONE ? null : v, milestoneId: null, taskId: null })}
          disabled={disabled || locked?.phase}
        >
          <SelectTrigger><SelectValue placeholder={t('wbs.select_phase')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t('wbs.select_phase')}</SelectItem>
            {phases.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="flex items-center gap-1">
          <T k="auto.wbsselector.jalon" fallback="Jalon" />
          {locked?.milestone && <Lock className="h-3 w-3 text-muted-foreground" aria-hidden />}
        </Label>
        <Select
          value={value.milestoneId ?? NONE}
          onValueChange={(v) => onChange({ ...value, milestoneId: v === NONE ? null : v, taskId: null })}
          disabled={disabled || locked?.milestone || !phase}
        >
          <SelectTrigger><SelectValue placeholder={phase ? t('wbs.select_milestone') : t('wbs.select_phase_first')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t('wbs.select_milestone')}</SelectItem>
            {phase?.milestones.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="flex items-center gap-1">
          <T k="auto.wbsselector.tache" fallback="Tâche" />
          {locked?.task && <Lock className="h-3 w-3 text-muted-foreground" aria-hidden />}
        </Label>
        <Select
          value={value.taskId ?? NONE}
          onValueChange={(v) => onChange({ ...value, taskId: v === NONE ? null : v })}
          disabled={disabled || locked?.task || !milestone}
        >
          <SelectTrigger><SelectValue placeholder={milestone ? t('wbs.select_task') : t('wbs.select_milestone_first')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t('wbs.select_task')}</SelectItem>
            {milestone?.tasks.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
