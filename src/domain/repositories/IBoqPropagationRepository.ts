/**
 * Port de propagation DQE -> Ressources planifiées.
 * Cible : btp.phase_materials, btp.phase_employees, btp.project_resources.
 */

export interface PhaseMaterialAllocation {
  phaseId: string;
  projectId: string;
  materialId: string;
  quantity: number;
}

export interface PhaseEmployeeAllocation {
  phaseId: string;
  employeeName: string;
  employeeRole: string;
  dailyRate?: number | null;
}

export interface ProjectResourceAllocation {
  projectId: string;
  type: string;
  name: string;
  quantity?: number | null;
  unit?: string | null;
  costPerUnit?: number | null;
  totalCost?: number | null;
  notes?: string | null;
}

export interface PhaseResourceCounts {
  phaseId: string;
  materials: number;
  employees: number;
  takeoffs: number;
}

export interface IBoqPropagationRepository {
  upsertPhaseMaterials(allocations: PhaseMaterialAllocation[]): Promise<number>;
  upsertPhaseEmployees(allocations: PhaseEmployeeAllocation[]): Promise<number>;
  upsertProjectResources(allocations: ProjectResourceAllocation[]): Promise<number>;
  countPhaseResources(projectId: string): Promise<PhaseResourceCounts[]>;
}
