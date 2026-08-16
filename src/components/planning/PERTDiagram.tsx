/**
 * PERTDiagram — enveloppe de compatibilité.
 *
 * Le calcul PERT est assuré par un moteur unique (`PertService`, exposé par
 * `ProjectMetricsOrchestrator.compute().pert`) et affiché par
 * `UnifiedPERTAnalysis`. Ce composant ne recalcule rien : il fournit
 * uniquement les phases (props ou hook hexagonal) à l'orchestrateur.
 */

import React, { useMemo } from 'react';
import UnifiedPERTAnalysis from '@/components/project/UnifiedPERTAnalysis';
import { ProjectMetricsOrchestrator } from '@/application/services/ProjectMetricsOrchestrator';
import { useProjectPhasesHex } from '@/hooks/hexagonal/useProjectPhasesHex';

interface PERTDiagramProps {
  projectId: string;
  projectData?: any;
  /** Filtre optionnel sur une phase précise. */
  phaseId?: string;
  compact?: boolean;
}

const PERTDiagram: React.FC<PERTDiagramProps> = ({ projectId, projectData, phaseId }) => {
  const providedPhases = useMemo<any[]>(
    () => (projectData?.phases || projectData?.construction_phases || []) as any[],
    [projectData],
  );

  // Fallback hexagonal : aucune phase transmise par le parent → on les charge.
  const needsFetch = providedPhases.length === 0;
  const { phases: fetchedPhases, isLoading } = useProjectPhasesHex(
    needsFetch ? projectId : undefined,
  );

  const metrics = useMemo(() => {
    const raw = needsFetch ? (fetchedPhases as any[]) : providedPhases;
    if (!raw || raw.length === 0) return null;

    const phases = (phaseId ? raw.filter((p) => p?.id === phaseId) : raw).map((p: any) => ({
      id: p.id,
      name: p.name ?? p.phaseName ?? p.phase_name ?? p.phase,
      weight: p.weight ?? p.weight_percentage,
      budget: p.budget ?? p.estimatedCost ?? p.estimated_cost,
      startDate: p.startDate ?? p.start_date,
      endDate: p.endDate ?? p.end_date,
      progress: p.progress ?? 0,
      status: p.status,
    }));

    if (phases.length === 0) return null;

    return ProjectMetricsOrchestrator.compute({
      project: {
        id: projectData?.id ?? projectId,
        title: projectData?.title,
        budget: projectData?.budget ?? 0,
        progress: projectData?.progress ?? 0,
        startDate: projectData?.startDate ?? projectData?.start_date ?? null,
        endDate: projectData?.endDate ?? projectData?.end_date ?? null,
      },
      phases,
    });
  }, [needsFetch, fetchedPhases, providedPhases, projectData, projectId, phaseId]);

  if (needsFetch && isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="h-6 w-1/4 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded bg-muted" />
      </div>
    );
  }

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
