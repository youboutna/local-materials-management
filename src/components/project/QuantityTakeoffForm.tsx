/**
 * QuantityTakeoffForm - Quantity calculation form
 * Now consumes the shared BOQ core (BoqCalculatorService + BoqValidatorService)
 * so the same logic powers Tender DQE Estimator and DQE Import.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useMaterialsForTakeoff } from '@/hooks/hexagonal';
import { useMaterialById } from '@/hooks/hexagonal/useMaterialsHexCentralized';
import { BOQ_UNITS, BoqUnit } from '@/config/referentials/boq/units.referential';
import { BoqCalculatorService } from '@/application/services/boq/BoqCalculatorService';
import { BoqValidatorService, BoqFieldError } from '@/application/services/boq/BoqValidatorService';
import { WBS_REFERENTIAL, getPhase } from '@/config/referentials/wbs/wbs.referential';
import { getQuantityTakeoffService } from '@/application/services/QuantityTakeoffService';

interface QuantityTakeoffFormProps {
  projectId: string;
  onSubmitSuccess?: () => void;
}

interface FormData {
  materialId: string;
  elementType: string;
  unit: BoqUnit;
  length: number;
  width: number;
  height: number;
  phaseId: string;
  milestoneId: string;
  taskId: string;
  note: string;
}

const initialState: FormData = {
  materialId: '',
  elementType: '',
  unit: 'm³',
  length: 0,
  width: 0,
  height: 0,
  phaseId: '',
  milestoneId: '',
  taskId: '',
  note: '',
};

const DEFAULT_VAT = 0.2;

const QuantityTakeoffForm = ({ projectId, onSubmitSuccess }: QuantityTakeoffFormProps) => {
  const [formData, setFormData] = useState<FormData>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data: materials } = useMaterialsForTakeoff();
  const { data: selectedMaterial } = useMaterialById(formData.materialId);

  const unitPrice = (selectedMaterial as { pricePerUnit?: number } | null | undefined)?.pricePerUnit ?? 0;

  // Live totals from BOQ core (single source of truth, shared with Tender/DQE)
  const totals = useMemo(
    () =>
      BoqCalculatorService.computeTotals({
        unit: formData.unit,
        length: formData.length,
        width: formData.width,
        height: formData.height,
        unitPrice,
        vatRate: DEFAULT_VAT,
      }),
    [formData.unit, formData.length, formData.width, formData.height, unitPrice]
  );

  // WBS cascade
  const phase = getPhase(formData.phaseId);
  const milestone = phase?.milestones.find((m) => m.id === formData.milestoneId);

  useEffect(() => {
    // Reset lower WBS levels when a higher one changes
    setFormData((prev) => {
      if (!phase) return { ...prev, milestoneId: '', taskId: '' };
      if (!milestone && prev.milestoneId) return { ...prev, milestoneId: '', taskId: '' };
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.phaseId, formData.milestoneId]);

  const updateFormData = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field as string]) return prev;
      const { [field as string]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1) Domain validation via shared validator
    const result = BoqValidatorService.validate({
      materialId: formData.materialId,
      elementType: formData.elementType,
      unit: formData.unit,
      length: formData.length,
      width: formData.width,
      height: formData.height,
      unitPrice,
    });

    if (!result.ok) {
      const map: Record<string, string> = {};
      result.errors.forEach((e: BoqFieldError) => (map[e.field] = e.message));
      setFieldErrors(map);
      toast({
        title: 'Champs invalides',
        description: result.message,
        variant: 'destructive',
      });
      return;
    }

    // 2) Persist through hexagonal service (real error surfaced on failure)
    try {
      setSubmitting(true);
      const { QuantityTakeoffService } = await import('@/application/services/QuantityTakeoffService');
      const service = getQuantityTakeoffService();
      await service.createQuantityTakeoff({
        project_id: projectId,
        material_id: formData.materialId,
        element_type: formData.elementType,
        unit: formData.unit,
        length: formData.length,
        width: formData.width || undefined,
        height: formData.height || undefined,
        unit_price: unitPrice || undefined,
        phase_id: formData.phaseId || undefined,
        milestone_id: formData.milestoneId || undefined,
        note: formData.note || undefined,
      });

      toast({
        title: 'Métré créé',
        description: `Quantité: ${totals.quantity.toFixed(2)} ${formData.unit} — Total HT: ${totals.totalHt.toFixed(2)}`,
      });

      setFormData(initialState);
      setFieldErrors({});
      onSubmitSuccess?.();
    } catch (error) {
      console.error('Error creating quantity takeoff:', error);
      const message =
        error instanceof Error ? error.message : 'Impossible de créer le métré. Veuillez réessayer.';
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const unitDef = BOQ_UNITS.find((u) => u.code === formData.unit)!;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouveau Calcul Métré</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="material">Matériau</Label>
            <Select value={formData.materialId} onValueChange={(v) => updateFormData('materialId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un matériau..." />
              </SelectTrigger>
              <SelectContent>
                {materials?.map((material) => (
                  <SelectItem key={material.id} value={material.id}>
                    {material.name} ({material.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.materialId && (
              <p className="text-xs text-destructive mt-1">{fieldErrors.materialId}</p>
            )}
            {selectedMaterial && (
              <p className="text-xs text-muted-foreground mt-1">
                PU: {unitPrice.toFixed(2)} / unité de référence
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="elementType">Type d'élément</Label>
            <Input
              id="elementType"
              type="text"
              value={formData.elementType}
              onChange={(e) => updateFormData('elementType', e.target.value)}
              placeholder="Ex: Mur, Dalle, Poutre..."
            />
            {fieldErrors.elementType && (
              <p className="text-xs text-destructive mt-1">{fieldErrors.elementType}</p>
            )}
          </div>

          {/* WBS cascade — Phase / Jalon / Tâche */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Phase</Label>
              <Select value={formData.phaseId} onValueChange={(v) => updateFormData('phaseId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Phase..." />
                </SelectTrigger>
                <SelectContent>
                  {WBS_REFERENTIAL.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jalon</Label>
              <Select
                value={formData.milestoneId}
                onValueChange={(v) => updateFormData('milestoneId', v)}
                disabled={!phase}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Jalon..." />
                </SelectTrigger>
                <SelectContent>
                  {phase?.milestones.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tâche</Label>
              <Select
                value={formData.taskId}
                onValueChange={(v) => updateFormData('taskId', v)}
                disabled={!milestone}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tâche..." />
                </SelectTrigger>
                <SelectContent>
                  {milestone?.tasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="unit">Unité</Label>
            <Select value={formData.unit} onValueChange={(v) => updateFormData('unit', v as BoqUnit)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOQ_UNITS.map((u) => (
                  <SelectItem key={u.code} value={u.code}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.unit && <p className="text-xs text-destructive mt-1">{fieldErrors.unit}</p>}
          </div>

          <div>
            <Label htmlFor="length">Longueur (m)</Label>
            <Input
              id="length"
              type="number"
              step="0.01"
              value={formData.length}
              onChange={(e) => updateFormData('length', parseFloat(e.target.value) || 0)}
            />
            {fieldErrors.length && <p className="text-xs text-destructive mt-1">{fieldErrors.length}</p>}
          </div>

          {unitDef.requires.width && (
            <div>
              <Label htmlFor="width">Largeur (m)</Label>
              <Input
                id="width"
                type="number"
                step="0.01"
                value={formData.width}
                onChange={(e) => updateFormData('width', parseFloat(e.target.value) || 0)}
              />
              {fieldErrors.width && <p className="text-xs text-destructive mt-1">{fieldErrors.width}</p>}
            </div>
          )}

          {unitDef.requires.height && (
            <div>
              <Label htmlFor="height">Hauteur (m)</Label>
              <Input
                id="height"
                type="number"
                step="0.01"
                value={formData.height}
                onChange={(e) => updateFormData('height', parseFloat(e.target.value) || 0)}
              />
              {fieldErrors.height && <p className="text-xs text-destructive mt-1">{fieldErrors.height}</p>}
            </div>
          )}

          <div>
            <Label htmlFor="note">Note (optionnel)</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => updateFormData('note', e.target.value)}
              placeholder="Notes additionnelles..."
            />
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-1">
            <div className="text-lg font-semibold">
              Quantité calculée: {totals.quantity.toFixed(2)} {formData.unit}
            </div>
            {unitPrice > 0 && (
              <>
                <div className="text-sm text-muted-foreground">
                  Total HT: {totals.totalHt.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  TVA ({(DEFAULT_VAT * 100).toFixed(0)}%): {totals.totalTva.toFixed(2)}
                </div>
                <div className="text-sm font-medium">Total TTC: {totals.totalTtc.toFixed(2)}</div>
              </>
            )}
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Création...' : 'Créer Métré'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuantityTakeoffForm;
