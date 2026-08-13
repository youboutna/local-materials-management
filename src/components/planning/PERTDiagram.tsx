/**
 * PERTDiagram — enveloppe de compatibilité.
 *
 * Le calcul PERT est désormais assuré par un moteur unique (`PertService`,
 * exposé par `ProjectMetricsOrchestrator.compute().pert`) et affiché par
 * `UnifiedPERTAnalysis`. Ce composant ne recalcule plus rien.
 */

import React, { useMemo } from 'react';
import UnifiedPERTAnalysis from '@/components/project/UnifiedPERTAnalysis';
import { ProjectMetricsOrchestrator } from '@/application/services/ProjectMetricsOrchestrator';

interface PERTDiagramProps {
  projectId: string;
  projectData?: any;
  /** Filtre optionnel sur une phase précise. */
  phaseId?: string;
  compact?: boolean;
}

const PERTDiagram: React.FC<PERTDiagramProps> = ({ projectId, projectData, phaseId }) => {
  const metrics = useMemo(() => {
    if (!projectData) return null;
    const raw = (projectData.phases || projectData.construction_phases || []) as any[];
    const phases = (phaseId ? raw.filter((p) => p?.id === phaseId) : raw).map((p: any) => ({
      id: p.id,
      name: p.name ?? p.phase_name ?? p.phase,
      weight: p.weight ?? p.weight_percentage,
      budget: p.budget ?? p.estimatedCost ?? p.estimated_cost,
      startDate: p.startDate ?? p.start_date,
      endDate: p.endDate ?? p.end_date,
      progress: p.progress ?? 0,
      status: p.status,
    }));

    return ProjectMetricsOrchestrator.compute({
      project: {
        id: projectData.id ?? projectId,
        title: projectData.title,
        budget: projectData.budget ?? 0,
        progress: projectData.progress ?? 0,
        startDate: projectData.startDate ?? projectData.start_date ?? null,
        endDate: projectData.endDate ?? projectData.end_date ?? null,
      },
      phases,
    });
  }, [projectData, projectId, phaseId]);

  if (!metrics) {
    return (
      <p className="text-sm text-muted-foreground">
        Données de planification indisponibles : l'analyse PERT nécessite les phases du projet.
      </p>
    );
  }

  return (
    <UnifiedPERTAnalysis pert={metrics.pert} referenceDurationDays={metrics.referenceDurationDays} />
  );
};

export default PERTDiagram;
