 
import { differenceInDays, addDays, isWithinInterval } from "date-fns";

export interface PERTActivity {
  id: string;
  name: string;
  description?: string;
  optimistic: number;  // days
  mostLikely: number;  // days
  pessimistic: number; // days
  predecessors?: string[];
  successors?: string[];
  startDate?: Date;
  endDate?: Date;
  progress?: number;
  status?: string;
  budget?: number;
  actualCost?: number;
}

export interface PERTAnalysisResult {
  activities: (PERTActivity & {
    pertEstimate: number;
    standardDeviation: number;
    variance: number;
    earliestStart: number;
    earliestFinish: number;
    latestStart: number;
    latestFinish: number;
    slackTime: number;
    isCritical: boolean;
  })[];
  criticalPath: string[];
  totalExpectedDuration: number;
  totalVariance: number;
  totalStandardDeviation: number;
  earliestStartTimes: { [activityId: string]: number };
  latestFinishTimes: { [activityId: string]: number };
  confidenceIntervals: {
    '68%': [number, number];
    '95%': [number, number];
    '99%': [number, number];
  };
  probabilityOnSchedule?: number;
  probabilityOnBudget?: number;
}

export interface NetworkNode {
  id: string;
  name: string;
  pertEstimate: number;
  earliestStart: number;
  latestFinish: number;
  slackTime: number;
  isCritical: boolean;
  x: number;
  y: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  isCritical: boolean;
}

export interface PERTNetwork {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

// Helper functions
const calculatePERTEstimate = (optimistic: number, mostLikely: number, pessimistic: number): number => {
  return (optimistic + 4 * mostLikely + pessimistic) / 6;
};

const calculateStandardDeviation = (optimistic: number, pessimistic: number): number => {
  return (pessimistic - optimistic) / 6;
};

const calculateVariance = (optimistic: number, pessimistic: number): number => {
  return Math.pow((pessimistic - optimistic) / 6, 2);
};

const calculateZScore = (targetDuration: number, expectedDuration: number, standardDeviation: number): number => {
  return (targetDuration - expectedDuration) / standardDeviation;
};

const calculateProbability = (z: number): number => {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  let probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  if (z > 0) probability = 1 - probability;
  return probability * 100;
};

const calculateForwardPass = (activities: PERTActivity[]): { earliestStart: number, earliestFinish: number }[] => {
  const results: { earliestStart: number, earliestFinish: number }[] = [];
  
  activities.forEach(activity => {
    let earliestStart = 0;
    
    if (activity.predecessors && activity.predecessors.length > 0) {
      earliestStart = Math.max(
        ...activity.predecessors.map(predId => {
          const predIndex = activities.findIndex(a => a.id === predId);
          return predIndex >= 0 && results[predIndex] 
            ? results[predIndex].earliestFinish 
            : 0;
        })
      );
    }
    
    const pertEstimate = calculatePERTEstimate(
      activity.optimistic,
      activity.mostLikely,
      activity.pessimistic
    );
    
    const earliestFinish = earliestStart + pertEstimate;
    
    results.push({ earliestStart, earliestFinish });
  });
  
  return results;
};

const calculateBackwardPass = (
  activities: PERTActivity[], 
  forwardResults: { earliestStart: number, earliestFinish: number }[],
  projectEndTime: number
): { latestStart: number, latestFinish: number }[] => {
  const results: { latestStart: number, latestFinish: number }[] = new Array(activities.length);
  
  // Initialize from end to start
  for (let i = activities.length - 1; i >= 0; i--) {
    const activity = activities[i];
    let latestFinish = projectEndTime;
    
    if (activity.successors && activity.successors.length > 0) {
      latestFinish = Math.min(
        ...activity.successors.map(succId => {
          const succIndex = activities.findIndex(a => a.id === succId);
          return succIndex >= 0 && results[succIndex] 
            ? results[succIndex].latestStart 
            : projectEndTime;
        })
      );
    }
    
    const pertEstimate = calculatePERTEstimate(
      activity.optimistic,
      activity.mostLikely,
      activity.pessimistic
    );
    
    const latestStart = latestFinish - pertEstimate;
    
    results[i] = { latestStart, latestFinish };
  }
  
  return results;
};

const calculateSlackTimes = (
  earliestStart: number[], 
  latestStart: number[]
): number[] => {
  return earliestStart.map((es, i) => latestStart[i] - es);
};

const identifyCriticalPath = (activities: PERTActivity[], slackTimes: number[]): string[] => {
  const criticalPath: string[] = [];
  
  slackTimes.forEach((slack, index) => {
    if (slack === 0) {
      criticalPath.push(activities[index].id);
    }
  });
  
  return criticalPath;
};

const generateNetwork = (activities: PERTActivity[], analysis: PERTAnalysisResult): PERTNetwork => {
  const nodes: NetworkNode[] = [];
  const links: NetworkLink[] = [];
  
  activities.forEach((activity, index) => {
    const nodeAnalysis = analysis.activities.find(a => a.id === activity.id);
    if (!nodeAnalysis) return;
    
    const row = Math.floor(index / 4);
    const col = index % 4;
    
    nodes.push({
      id: activity.id,
      name: activity.name,
      pertEstimate: nodeAnalysis.pertEstimate,
      earliestStart: nodeAnalysis.earliestStart,
      latestFinish: nodeAnalysis.latestFinish,
      slackTime: nodeAnalysis.slackTime,
      isCritical: nodeAnalysis.isCritical,
      x: col * 200 + 100,
      y: row * 150 + 100
    });
    
    if (activity.predecessors) {
      activity.predecessors.forEach(predId => {
        const isPredCritical = analysis.activities.find(a => a.id === predId)?.isCritical || false;
        links.push({
          source: predId,
          target: activity.id,
          isCritical: nodeAnalysis.isCritical && isPredCritical
        });
      });
    }
  });
  
  return { nodes, links };
};

// Main PERT analysis function
export const performFullAnalysis = (activities: PERTActivity[]): PERTAnalysisResult => {
  if (activities.length === 0) {
    return {
      activities: [],
      criticalPath: [],
      totalExpectedDuration: 0,
      totalVariance: 0,
      totalStandardDeviation: 0,
      earliestStartTimes: {},
      latestFinishTimes: {},
      confidenceIntervals: {
        '68%': [0, 0],
        '95%': [0, 0],
        '99%': [0, 0]
      }
    };
  }
  
  // Calculate PERT estimates for each activity
  const activitiesWithEstimates = activities.map(activity => ({
    ...activity,
    pertEstimate: calculatePERTEstimate(activity.optimistic, activity.mostLikely, activity.pessimistic),
    standardDeviation: calculateStandardDeviation(activity.optimistic, activity.pessimistic),
    variance: calculateVariance(activity.optimistic, activity.pessimistic)
  }));
  
  // Forward pass
  const forwardResults = calculateForwardPass(activitiesWithEstimates);
  
  // Find project end time (max earliest finish)
  const projectEndTime = Math.max(...forwardResults.map(r => r.earliestFinish));
  
  // Backward pass
  const backwardResults = calculateBackwardPass(
    activitiesWithEstimates, 
    forwardResults, 
    projectEndTime
  );
  
  // Calculate slack times
  const slackTimes = calculateSlackTimes(
    forwardResults.map(r => r.earliestStart),
    backwardResults.map(r => r.latestStart)
  );
  
  // Identify critical path
  const criticalPath = identifyCriticalPath(activitiesWithEstimates, slackTimes);
  
  // Calculate total variance and standard deviation
  const totalVariance = activitiesWithEstimates
    .filter(a => criticalPath.includes(a.id))
    .reduce((sum, activity) => sum + activity.variance, 0);
  
  const totalStandardDeviation = Math.sqrt(totalVariance);
  
  // Calculate confidence intervals
  const confidenceIntervals = {
    '68%': [projectEndTime - totalStandardDeviation, projectEndTime + totalStandardDeviation] as [number, number],
    '95%': [projectEndTime - 2 * totalStandardDeviation, projectEndTime + 2 * totalStandardDeviation] as [number, number],
    '99%': [projectEndTime - 3 * totalStandardDeviation, projectEndTime + 3 * totalStandardDeviation] as [number, number]
  };
  
  // Build result object
  const analysisResult: PERTAnalysisResult = {
    activities: activitiesWithEstimates.map((activity, index) => ({
      ...activity,
      earliestStart: forwardResults[index].earliestStart,
      earliestFinish: forwardResults[index].earliestFinish,
      latestStart: backwardResults[index].latestStart,
      latestFinish: backwardResults[index].latestFinish,
      slackTime: slackTimes[index],
      isCritical: criticalPath.includes(activity.id)
    })),
    criticalPath,
    totalExpectedDuration: projectEndTime,
    totalVariance,
    totalStandardDeviation,
    earliestStartTimes: Object.fromEntries(
      activitiesWithEstimates.map((a, i) => [a.id, forwardResults[i].earliestStart])
    ),
    latestFinishTimes: Object.fromEntries(
      activitiesWithEstimates.map((a, i) => [a.id, backwardResults[i].latestFinish])
    ),
    confidenceIntervals
  };
  
  return analysisResult;
};

// Calculate probability of meeting target date
export const calculateScheduleProbability = (
  targetDate: Date,
  projectStartDate: Date,
  analysis: PERTAnalysisResult
): number => {
  const targetDuration = differenceInDays(targetDate, projectStartDate);
  const zScore = calculateZScore(
    targetDuration,
    analysis.totalExpectedDuration,
    analysis.totalStandardDeviation
  );
  
  return calculateProbability(zScore);
};

// Convert phases to PERT activities
export const convertPhasesToPERTActivities = (phases: any[]): PERTActivity[] => {
  return phases.map((phase, index) => {
    const baseDuration = differenceInDays(
      new Date(phase.endDate || phase.end_date),
      new Date(phase.startDate || phase.start_date)
    ) || 30;
    
    // Create successors array (activities that depend on this one)
    const successors = phases[index + 1] ? [`pert-${phases[index + 1].id || index + 1}`] : [];
    
    return {
      id: `pert-${phase.id || index}`,
      name: phase.name || phase.phase_name || `Phase ${index + 1}`,
      description: phase.description,
      optimistic: Math.round(baseDuration * 0.7),  // 70% of base
      mostLikely: baseDuration,                    // Base estimate
      pessimistic: Math.round(baseDuration * 1.5), // 150% of base
      predecessors: index > 0 ? [`pert-${phases[index - 1].id || index - 1}`] : [],
      successors: successors,
      progress: phase.progress,
      status: phase.status,
      budget: phase.budget || phase.estimated_cost,
      actualCost: phase.actual_cost
    };
  });
};

// Export all functions as an object
export const pertCalculations = {
  calculatePERTEstimate,
  calculateStandardDeviation,
  calculateVariance,
  calculateZScore,
  calculateProbability,
  calculateForwardPass,
  calculateBackwardPass,
  calculateSlackTimes,
  identifyCriticalPath,
  generateNetwork,
  performFullAnalysis,
  calculateScheduleProbability,
  convertPhasesToPERTActivities,
};