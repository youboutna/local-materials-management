import React from 'react';
import GanttDiagramWithMilestones from './GanttDiagramWithMilestones';
import { ReportCalculations } from '@/utils/reportCalculations';

const ProjectGanttDemo = () => {
  // Sample project data
  const sampleProject = {
    id: '1',
    title: 'Réalisation des travaux des fouilles et tranchées',
    progress: 35,
    startDate: '2025-08-14',
    endDate: '2026-06-22',
    budget: 5000000
  };

  // Generate sample phases using our calculation utility
  const phases = [
    {
      id: 'phase-1',
      name: 'Phase 1',
      startDate: new Date('2025-08-14'),
      endDate: new Date('2025-10-14'),
      progress: 100,
      status: 'completed' as const
    },
    {
      id: 'phase-2', 
      name: 'Phase 2',
      startDate: new Date('2025-10-15'),
      endDate: new Date('2025-12-15'),
      progress: 100,
      status: 'completed' as const
    },
    {
      id: 'phase-3',
      name: 'Phase 3', 
      startDate: new Date('2025-12-16'),
      endDate: new Date('2026-02-16'),
      progress: 1,
      status: 'in_progress' as const
    },
    {
      id: 'phase-4',
      name: 'Phase 4',
      startDate: new Date('2026-02-17'),
      endDate: new Date('2026-04-17'), 
      progress: 0,
      status: 'planned' as const
    },
    {
      id: 'phase-5',
      name: 'Phase 5',
      startDate: new Date('2026-04-18'),
      endDate: new Date('2026-06-22'),
      progress: 0,
      status: 'planned' as const
    },
    {
      id: 'phase-6',
      name: 'Phase 6',
      startDate: new Date('2026-06-23'),
      endDate: new Date('2026-08-22'),
      progress: 0,
      status: 'planned' as const
    }
  ];

  // Generate milestones
  const milestones = ReportCalculations.calculateMilestoneStatus(sampleProject.progress);

  return (
    <div className="p-6">
      <GanttDiagramWithMilestones
        projectTitle={sampleProject.title}
        projectPeriod={{
          start: new Date(sampleProject.startDate),
          end: new Date(sampleProject.endDate)
        }}
        phases={phases}
        milestones={milestones}
      />
    </div>
  );
};

export default ProjectGanttDemo;