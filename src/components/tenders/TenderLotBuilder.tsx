/**
 * TenderLotBuilder - Create tender lots aligned with project phases
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Package,
  Plus,
  Trash2,
  Link2,
  DollarSign,
  Layers,
  CheckCircle,
  AlertTriangle,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Phase {
  id: string;
  name: string;
  description?: string;
  budget?: number;
  steps?: Step[];
}

interface Step {
  id: string;
  name: string;
  order: number;
}

interface TenderLot {
  id: string;
  number: number;
  title: string;
  description?: string;
  estimatedAmount?: number;
  linkedPhaseIds: string[];
  linkedStepIds: string[];
  requirements?: string[];
  deliverables?: string[];
}

interface TenderLotBuilderProps {
  tenderId: string;
  projectId?: string;
  lots?: TenderLot[];
  onChange?: (lots: TenderLot[]) => void;
  readOnly?: boolean;
}

const TenderLotBuilder: React.FC<TenderLotBuilderProps> = ({
  tenderId,
  projectId,
  lots: externalLots,
  onChange,
  readOnly = false
}) => {
  const [internalLots, setInternalLots] = useState<TenderLot[]>([]);
  const lots = externalLots || internalLots;
  
  const handleLotsChange = (newLots: TenderLot[]) => {
    if (onChange) {
      onChange(newLots);
    } else {
      setInternalLots(newLots);
    }
  };
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedLot, setExpandedLot] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProjectPhases();
    }
  }, [projectId]);

  const loadProjectPhases = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_phases')
        .select(`
          *,
          phase_steps (*)
        `)
        .eq('project_id', projectId)
        .order('phase_order', { ascending: true });

      if (error) throw error;

      setPhases((data || []).map((p: any) => ({
        id: p.id,
        name: p.phase_name || p.name,
        description: p.description,
        budget: p.budget_allocated,
        steps: (p.phase_steps || []).map((s: any) => ({
          id: s.id,
          name: s.step_name || s.name,
          order: s.step_order || 0
        }))
      })));
    } catch (error) {
      console.error('Error loading phases:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLot = () => {
    const newLot: TenderLot = {
      id: `lot-${Date.now()}`,
      number: lots.length + 1,
      title: `Lot ${lots.length + 1}`,
      linkedPhaseIds: [],
      linkedStepIds: [],
      requirements: [],
      deliverables: []
    };
    handleLotsChange([...lots, newLot]);
    setExpandedLot(newLot.id);
  };

  const updateLot = (lotId: string, updates: Partial<TenderLot>) => {
    handleLotsChange(lots.map(lot => lot.id === lotId ? { ...lot, ...updates } : lot));
  };

  const removeLot = (lotId: string) => {
    handleLotsChange(lots.filter(lot => lot.id !== lotId));
  };

  const togglePhaseLink = (lotId: string, phaseId: string) => {
    const lot = lots.find(l => l.id === lotId);
    if (!lot) return;

    const newPhaseIds = lot.linkedPhaseIds.includes(phaseId)
      ? lot.linkedPhaseIds.filter(id => id !== phaseId)
      : [...lot.linkedPhaseIds, phaseId];

    updateLot(lotId, { linkedPhaseIds: newPhaseIds });
  };

  const toggleStepLink = (lotId: string, stepId: string) => {
    const lot = lots.find(l => l.id === lotId);
    if (!lot) return;

    const newStepIds = lot.linkedStepIds.includes(stepId)
      ? lot.linkedStepIds.filter(id => id !== stepId)
      : [...lot.linkedStepIds, stepId];

    updateLot(lotId, { linkedStepIds: newStepIds });
  };

  const calculateEstimatedFromPhases = (lotId: string) => {
    const lot = lots.find(l => l.id === lotId);
    if (!lot) return;

    const linkedPhases = phases.filter(p => lot.linkedPhaseIds.includes(p.id));
    const estimatedAmount = linkedPhases.reduce((sum, p) => sum + (p.budget || 0), 0);

    updateLot(lotId, { estimatedAmount });
  };

  const getLinkedPhasesCount = (lot: TenderLot) => {
    return lot.linkedPhaseIds.length;
  };

  const getLinkedStepsCount = (lot: TenderLot) => {
    return lot.linkedStepIds.length;
  };

  const totalEstimated = lots.reduce((sum, lot) => sum + (lot.estimatedAmount || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-primary" />
            Lots de l'Appel d'Offres
          </CardTitle>
          {!readOnly && (
            <Button onClick={addLot} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un lot
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">{lots.length} lot(s)</span>
            {projectId && (
              <Badge variant="outline" className="gap-1">
                <Link2 className="h-3 w-3" />
                Projet lié
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">
              {(totalEstimated / 1000000).toFixed(2)}M MRU
            </span>
          </div>
        </div>

        {/* Lots */}
        {lots.length > 0 ? (
          <Accordion
            type="single"
            collapsible
            value={expandedLot || undefined}
            onValueChange={(val) => setExpandedLot(val)}
          >
            {lots.map((lot, index) => (
              <AccordionItem
                key={lot.id}
                value={lot.id}
                className="border rounded-lg mb-2 overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 [&[data-state=open]]:bg-muted/30">
                  <div className="flex items-center gap-3 flex-1">
                    {!readOnly && (
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    )}
                    <Badge className="bg-primary">Lot {lot.number}</Badge>
                    <span className="font-medium">{lot.title}</span>
                    <div className="flex items-center gap-2 ml-auto mr-4">
                      {getLinkedPhasesCount(lot) > 0 && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Layers className="h-3 w-3" />
                          {getLinkedPhasesCount(lot)} phase(s)
                        </Badge>
                      )}
                      {lot.estimatedAmount && (
                        <Badge variant="secondary" className="text-xs">
                          {(lot.estimatedAmount / 1000000).toFixed(2)}M
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <div className="px-4 pb-4 space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Titre du lot</Label>
                        <Input
                          value={lot.title}
                          onChange={(e) => updateLot(lot.id, { title: e.target.value })}
                          disabled={readOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Montant estimé (MRU)</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={lot.estimatedAmount || ''}
                            onChange={(e) => updateLot(lot.id, { estimatedAmount: Number(e.target.value) })}
                            disabled={readOnly}
                            placeholder="0"
                          />
                          {projectId && phases.length > 0 && !readOnly && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => calculateEstimatedFromPhases(lot.id)}
                              title="Calculer à partir des phases liées"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={lot.description || ''}
                        onChange={(e) => updateLot(lot.id, { description: e.target.value })}
                        disabled={readOnly}
                        rows={2}
                      />
                    </div>

                    {/* Phase Linking */}
                    {projectId && phases.length > 0 && (
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-primary" />
                          Phases du projet liées
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {phases.map(phase => (
                            <div
                              key={phase.id}
                              className={cn(
                                "p-3 rounded-lg border cursor-pointer transition-all",
                                lot.linkedPhaseIds.includes(phase.id)
                                  ? "border-primary bg-primary/5"
                                  : "hover:border-primary/50"
                              )}
                              onClick={() => !readOnly && togglePhaseLink(lot.id, phase.id)}
                            >
                              <div className="flex items-start gap-2">
                                <Checkbox
                                  checked={lot.linkedPhaseIds.includes(phase.id)}
                                  disabled={readOnly}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">{phase.name}</p>
                                  {phase.budget && (
                                    <p className="text-xs text-muted-foreground">
                                      Budget: {(phase.budget / 1000000).toFixed(2)}M MRU
                                    </p>
                                  )}
                                  {phase.steps && phase.steps.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {phase.steps.slice(0, 3).map(step => (
                                        <div
                                          key={step.id}
                                          className="flex items-center gap-2 text-xs"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            !readOnly && toggleStepLink(lot.id, step.id);
                                          }}
                                        >
                                          <Checkbox
                                            checked={lot.linkedStepIds.includes(step.id)}
                                            className="h-3 w-3"
                                            disabled={readOnly}
                                          />
                                          <span className="text-muted-foreground">{step.name}</span>
                                        </div>
                                      ))}
                                      {phase.steps.length > 3 && (
                                        <span className="text-xs text-muted-foreground">
                                          +{phase.steps.length - 3} autres
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {!readOnly && (
                      <div className="flex justify-end pt-2 border-t">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeLot(lot.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Supprimer le lot
                        </Button>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun lot défini</p>
            {!readOnly && (
              <Button variant="outline" className="mt-4" onClick={addLot}>
                <Plus className="h-4 w-4 mr-2" />
                Créer le premier lot
              </Button>
            )}
          </div>
        )}

        {/* Validation */}
        {lots.length > 0 && (
          <div className={cn(
            "p-3 rounded-lg border",
            lots.every(l => l.title && l.estimatedAmount)
              ? "bg-success/10 border-success/30"
              : "bg-amber-500/10 border-amber-500/30"
          )}>
            <div className="flex items-center gap-2 text-sm">
              {lots.every(l => l.title && l.estimatedAmount) ? (
                <>
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-success font-medium">Tous les lots sont configurés</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-600">
                    {lots.filter(l => !l.title || !l.estimatedAmount).length} lot(s) incomplet(s)
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TenderLotBuilder;
