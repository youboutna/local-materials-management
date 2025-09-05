// services/ProjectManagerContext.ts
import { createContext } from "react";
import {
  Alert,
  EVMData,
  GanttChartData,
  PERTAnalysis,
} from "@/services/ projectManagerWithActions"

export interface ProjectManagerState {
  alerts: Alert[];
  progress: number;
  evmData: EVMData;
  ganttData: GanttChartData;
  pertData: PERTAnalysis;
}

export interface ProjectManagerContextValue {
  data: ProjectManagerState | null;
  runChecks: () => Promise<void>;
  acknowledgeAlert: (
    alertId: string,
    userId: string,
    actionTaken?: string
  ) => void;
}

export const ProjectManagerContext =
  createContext<ProjectManagerContextValue | null>(null);