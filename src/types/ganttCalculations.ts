import { differenceInDays, addDays, isWithinInterval } from "date-fns";

export interface GanttCalculations {
  calculateCriticalPath: (phases: any[]) => string[];
  calculatePhaseDependencies: (phases: any[]) => { [key: string]: string[] };
  calculateResourceAllocation: (phases: any[]) => { [key: string]: number };
  calculateTimelineMetrics: (phases: any[]) => {
    totalDuration: number;
    completedDuration: number;
    delayedPhases: number;
    upcomingMilestones: number;
  };
}

export const ganttCalculations: GanttCalculations = {
  calculateCriticalPath: (phases) => {
    // Simple critical path calculation based on longest duration
    const sortedPhases = [...phases].sort((a, b) => {
      const durationA = differenceInDays(
        new Date(a.endDate),
        new Date(a.startDate)
      );
      const durationB = differenceInDays(
        new Date(b.endDate),
        new Date(b.startDate)
      );
      return durationB - durationA;
    });

    // Take phases that are 80% or more of the longest phase duration
    if (sortedPhases.length === 0) return [];

    const maxDuration = differenceInDays(
      new Date(sortedPhases[0].endDate),
      new Date(sortedPhases[0].startDate)
    );

    return sortedPhases
      .filter((phase) => {
        const duration = differenceInDays(
          new Date(phase.endDate),
          new Date(phase.startDate)
        );
        return duration >= maxDuration * 0.8;
      })
      .map((phase) => phase.id);
  },

  calculatePhaseDependencies: (phases) => {
    const dependencies: { [key: string]: string[] } = {};

    phases.forEach((phase, index) => {
      if (index > 0) {
        dependencies[phase.id] = [phases[index - 1].id];
      }
    });

    return dependencies;
  },

  calculateResourceAllocation: (phases) => {
    const allocation: { [key: string]: number } = {};

    phases.forEach((phase) => {
      // Simple allocation: longer phases get more resources
      const duration = differenceInDays(
        new Date(phase.endDate),
        new Date(phase.startDate)
      );
      allocation[phase.id] = Math.min(100, duration * 2); // Max 100%
    });

    return allocation;
  },

  calculateTimelineMetrics: (phases) => {
    if (phases.length === 0) {
      return {
        totalDuration: 0,
        completedDuration: 0,
        delayedPhases: 0,
        upcomingMilestones: 0,
      };
    }

    // Find overall project dates
    const startDates = phases.map((p) => new Date(p.startDate).getTime());
    const endDates = phases.map((p) => new Date(p.endDate).getTime());
    const projectStart = new Date(Math.min(...startDates));
    const projectEnd = new Date(Math.max(...endDates));

    const totalDuration = differenceInDays(projectEnd, projectStart);

    // Calculate completed duration based on progress
    let completedDuration = 0;
    phases.forEach((phase) => {
      const phaseDuration = differenceInDays(
        new Date(phase.endDate),
        new Date(phase.startDate)
      );
      completedDuration += (phaseDuration * (phase.progress || 0)) / 100;
    });

    // Count delayed phases (in_progress but behind schedule)
    const delayedPhases = phases.filter((phase) => {
      if (phase.status !== "in_progress") return false;

      const phaseDuration = differenceInDays(
        new Date(phase.endDate),
        new Date(phase.startDate)
      );
      const expectedProgress =
        (differenceInDays(new Date(), new Date(phase.startDate)) /
          phaseDuration) *
        100;

      return (phase.progress || 0) < expectedProgress * 0.8; // More than 20% behind
    }).length;

    // Count upcoming milestones (within next 30 days)
    const upcomingMilestones = phases.filter((phase) => {
      const daysToEnd = differenceInDays(new Date(phase.endDate), new Date());
      return daysToEnd > 0 && daysToEnd <= 30;
    }).length;

    return {
      totalDuration,
      completedDuration,
      delayedPhases,
      upcomingMilestones,
    };
  },
};
