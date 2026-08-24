/**
 * PhasePlanningQuickEdit — Mode 1 : édition/sauvegarde PARTIELLE de l'onglet Planification.
 *
 * Ne persiste que les champs de planification (dates, progression, budget) via
 * le même service que le workflow global (usePhaseDetails → PhaseService).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, AlertTriangle } from 'lucide-react';
import TabSaveBar from './TabSaveBar';
import {
  PhaseEditDraft,
  draftDurationDays,
  validatePhaseDraftStep,
} from './PhaseEditDraft';
import { formatAmount2, formatPercent2 } from '@/utils/reportNumbers';
import { T } from '@/components/i18n/T';

interface PhasePlanningQuickEditProps {
  /** Valeurs persistées (source de vérité) */
  value: PhaseEditDraft;
  isSaving?: boolean;
  disabled?: boolean;
  /** Persiste uniquement les champs de planification */
  onSave: (partial: Partial<PhaseEditDraft>) => Promise<void> | void;
}

const PhasePlanningQuickEdit: React.FC<PhasePlanningQuickEditProps> = ({
  value,
  isSaving = false,
  disabled = false,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<PhaseEditDraft>(value);

  useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [value, isEditing]);

  const isDirty = useMemo(
    () =>
      draft.startDate !== value.startDate ||
      draft.endDate !== value.endDate ||
      draft.progress !== value.progress ||
      draft.estimatedCost !== value.estimatedCost,
    [draft, value]
  );

  const validation = validatePhaseDraftStep('planning', draft);
  const duration = draftDurationDays(draft);

  const handleSave = async () => {
    if (!validation.isValid) return;
    await onSave({
      startDate: draft.startDate,
      endDate: draft.endDate,
      progress: draft.progress,
      estimatedCost: draft.estimatedCost,
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardContent className="space-y-3 py-3">
        <TabSaveBar
          title="Planification"
          icon={<Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
          isEditing={isEditing}
          isSaving={isSaving}
          isDirty={isDirty && validation.isValid}
          disabled={disabled}
          onEdit={() => setIsEditing(true)}
          onSave={handleSave}
          onCancel={() => {
            setDraft(value);
            setIsEditing(false);
          }}
        />

        {!isEditing ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-1 text-sm text-muted-foreground">
            <span>
              📅 {value.startDate || '—'} → {value.endDate || '—'} ({draftDurationDays(value)} <T k="auto.phaseplanning.jours" fallback="jours" />)
            </span>
            <span>📊 {formatPercent2(value.progress)}</span>
            <span>💰 {formatAmount2(value.estimatedCost)}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 px-1">
            <div className="space-y-1.5">
              <Label className="text-xs"><T k="auto.phaseplanning.date_debut" fallback="Date de début" /></Label>
              <Input
                type="date"
                value={draft.startDate}
                onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs"><T k="auto.phaseplanning.date_fin" fallback="Date de fin" /></Label>
              <Input
                type="date"
                value={draft.endDate}
                onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs"><T k="auto.phaseplanning.progression" fallback="Progression (%)" /></Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={draft.progress}
                onChange={(e) => setDraft({ ...draft, progress: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs"><T k="auto.phaseplanning.budget" fallback="Budget (MRU)" /></Label>
              <Input
                type="number"
                min={0}
                value={draft.estimatedCost}
                onChange={(e) => setDraft({ ...draft, estimatedCost: Number(e.target.value) || 0 })}
              />
            </div>
            <p className="sm:col-span-4 text-xs text-muted-foreground">
              <T k="auto.phaseplanning.duree_calculee" fallback="Durée calculée" /> : {duration} <T k="auto.phaseplanning.jours" fallback="jours" />
            </p>
          </div>
        )}

        {isEditing && !validation.isValid && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <ul className="list-disc pl-4">
                {validation.errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default PhasePlanningQuickEdit;
