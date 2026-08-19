/**
 * IPhaseEmployeeRepository — port pour btp.phase_employees (main d'œuvre d'une phase).
 * DTO camelCase uniquement : la conversion snake_case est faite par l'adapter.
 */

export interface PhaseEmployeeRow {
  id: string;
  phaseId: string;
  employeeName: string;
  employeeRole: string;
  employeeContact: string | null;
  dailyRate: number | null;
  startDate: string | null;
  endDate: string | null;
  isPrimarySupplier: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PhaseEmployeeInput {
  phaseId: string;
  employeeName: string;
  employeeRole: string;
  employeeContact?: string | null;
  dailyRate?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isPrimarySupplier?: boolean;
}

export interface IPhaseEmployeeRepository {
  findByPhaseId(phaseId: string): Promise<PhaseEmployeeRow[]>;
  create(input: PhaseEmployeeInput): Promise<PhaseEmployeeRow>;
  update(id: string, updates: Partial<PhaseEmployeeInput>): Promise<PhaseEmployeeRow>;
  delete(id: string): Promise<void>;
}
