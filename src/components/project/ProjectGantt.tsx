import React, { useMemo } from 'react';
import ProjectGanttTimeline from './ProjectGanttTimeline';
import { ProjectMetricsOrchestrator } from '@/application/services/ProjectMetricsOrchestrator';
import type { ProjectDTO } from '@/dtos/entities/ProjectDTO';

interface ProjectGanttProps {
  project: ProjectDTO;
  phases?: any[];
  compact?: boolean;
}

/**
 * ProjectGantt — enveloppe du composant Gantt UNIQUE.
 * Aucune phase simulée : les données proviennent de l'orchestrateur central
 * (calendrier réel, poids et sa source, jalons 0/25/50/75/100).
 */
const ProjectGantt: React.FC<ProjectGanttProps> = ({ project, phases, compact = false }) => {
  const gantt = useMemo(
    () =>
      ProjectMetricsOrchestrator.compute({
        project: {
          id: (project as any)?.id,
          title: project?.title,
          budget: (project as any)?.budget ?? 0,
          progress: project?.progress ?? 0,
          startDate: project?.startDate ?? null,
          endDate: project?.endDate ?? null,
          interventionZones: (project as any)?.interventionZones ?? [],
        },
        phases: (phases || []).map((p: any) => ({
          id: p.id,
          name: p.name ?? p.phase ?? p.phase_name,
          weight: p.weight ?? p.weight_percentage,
          budget: p.budget ?? p.estimatedCost ?? p.estimated_cost,
          startDate: p.startDate ?? p.start_date,
          endDate: p.endDate ?? p.end_date,
          progress: p.progress ?? p.actualProgress ?? 0,
          actualCost: p.actualCost ?? p.actual_cost,
          status: p.status,
        })),
      }).gantt,
    [project, phases],
  );

  return (
    <div className={compact ? 'space-y-4' : 'p-6'}>
      <ProjectGanttTimeline gantt={gantt} showAsciiBars={!compact} />
    </div>
  );
};

export default ProjectGantt;
