import React from 'react';
import GanttDiagramWithMilestones from './GanttDiagramWithMilestones';
import { ReportCalculations } from '@/utils/reportCalculations';
import type { ProjectDTO } from '@/dtos/entities/ProjectDTO';

interface ProjectGanttProps {
  project: ProjectDTO;
  phases?: any[];
  compact?: boolean;
}

const ProjectGantt: React.FC<ProjectGanttProps> = ({ project, phases, compact = false }) => {
  // Use provided phases or generate sample phases based on project data
  const startDate = project.startDate || new Date().toISOString().split('T')[0];
  const endDate = project.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const projectPhases = phases || [
    {
      id: 'phase-1',
      name: 'Phase 1 - Préparation',
      startDate: new Date(startDate),
      endDate: new Date(new Date(startDate).getTime() + 60 * 24 * 60 * 60 * 1000), // +60 days
      progress: project.progress > 80 ? 100 : project.progress > 60 ? 100 : project.progress * 1.5,
      status: project.progress > 20 ? 'completed' : project.progress > 10 ? 'in_progress' : 'planned'
    },
    {
      id: 'phase-2', 
      name: 'Phase 2 - Exécution',
      startDate: new Date(new Date(startDate).getTime() + 60 * 24 * 60 * 60 * 1000),
      endDate: new Date(new Date(startDate).getTime() + 150 * 24 * 60 * 60 * 1000), // +150 days
      progress: project.progress > 50 ? Math.min(100, (project.progress - 20) * 1.2) : 0,
      status: project.progress > 60 ? 'completed' : project.progress > 30 ? 'in_progress' : 'planned'
    },
    {
      id: 'phase-3',
      name: 'Phase 3 - Finalisation', 
      startDate: new Date(new Date(startDate).getTime() + 150 * 24 * 60 * 60 * 1000),
      endDate: new Date(endDate),
      progress: project.progress > 80 ? Math.min(100, (project.progress - 80) * 5) : 0,
      status: project.progress > 90 ? 'completed' : project.progress > 80 ? 'in_progress' : 'planned'
    }
  ];

  // Generate milestones based on real project data
  const milestones = ReportCalculations.calculateMilestoneStatus(project.progress);

  return (
    <div className={compact ? "space-y-4" : "p-6"}>
      <GanttDiagramWithMilestones
        projectTitle={project.title}
        projectPeriod={{
          start: new Date(startDate),
          end: new Date(endDate)
        }}
        phases={projectPhases}
        milestones={milestones}
        compact={compact}
      />
    </div>
  );
};

export default ProjectGantt;