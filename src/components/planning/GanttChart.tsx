/**
 * GanttChart — enveloppe de compatibilité.
 *
 * Il n'existe plus qu'UN SEUL pipeline Gantt : `ProjectMetricsOrchestrator`
 * produit le `GanttModel` (calendrier réel, poids et leur source, jalons
 * 0/25/50/75/100) et `ProjectGanttTimeline` l'affiche. Ce composant ne fait
 * plus aucun calcul : il normalise les props historiques puis délègue.
 */

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ProjectGanttTimeline from '@/components/project/ProjectGanttTimeline';
import { ProjectMetricsOrchestrator } from '@/application/services/ProjectMetricsOrchestrator';

interface GanttChartProps {
  projectId: string;
  projectData?: any;
  /** Filtre optionnel sur une phase précise. */
  phaseId?: string;
  onPhaseClick?: (phaseId: string) => void;
  onMilestoneClick?: (milestoneId: string) => void;
  compact?: boolean;
}

const normalizePhases = (projectData: any, phaseId?: string) => {
  const raw = (projectData?.phases || projectData?.construction_phases || []) as any[];
  const filtered = phaseId ? raw.filter((p) => p?.id === phaseId) : raw;
  return filtered.map((p: any) => ({
    id: p.id,
    name: p.name ?? p.phase_name ?? p.phase,
    weight: p.weight ?? p.weight_percentage,
    budget: p.budget ?? p.estimatedCost ?? p.estimated_cost,
    startDate: p.startDate ?? p.start_date,
    endDate: p.endDate ?? p.end_date,
    progress: p.progress ?? p.actualProgress ?? 0,
    actualCost: p.actualCost ?? p.actual_cost,
    status: p.status,
  }));
};

const GanttChart: React.FC<GanttChartProps> = ({ projectId, projectData, phaseId, compact = false }) => {
  const gantt = useMemo(() => {
    if (!projectData) return null;
    return ProjectMetricsOrchestrator.compute({
      project: {
        id: projectData.id ?? projectId,
        title: projectData.title,
        budget: projectData.budget ?? 0,
        progress: projectData.progress ?? 0,
        startDate: projectData.startDate ?? projectData.start_date ?? null,
        endDate: projectData.endDate ?? projectData.end_date ?? null,
      },
      phases: normalizePhases(projectData, phaseId),
    }).gantt;
  }, [projectData, projectId, phaseId]);

  if (!gantt || gantt.isEmpty) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Aucune phase planifiée : le calendrier Gantt sera disponible dès qu'une phase disposera de
          dates.
        </CardContent>
      </Card>
    );
  }

  return <ProjectGanttTimeline gantt={gantt} showAsciiBars={!compact} />;
};

export default GanttChart;
