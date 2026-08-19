/**
 * PhaseEmployeeService — main d'œuvre affectée à une phase (btp.phase_employees).
 * TypeScript pur : aucun hook, aucun accès direct au client Supabase.
 */
import type {
  IPhaseEmployeeRepository,
  PhaseEmployeeInput,
  PhaseEmployeeRow,
} from '@/domain/repositories/IPhaseEmployeeRepository';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export class PhaseEmployeeService {
  constructor(private readonly repository: IPhaseEmployeeRepository) {}

  async getByPhase(phaseId: string): Promise<PhaseEmployeeRow[]> {
    if (!phaseId) return [];
    return this.repository.findByPhaseId(phaseId);
  }

  async assign(input: PhaseEmployeeInput): Promise<PhaseEmployeeRow> {
    if (!input.phaseId || !input.employeeName?.trim()) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase et nom du membre sont requis');
    }
    return this.repository.create({
      ...input,
      employeeName: input.employeeName.trim(),
      employeeRole: input.employeeRole?.trim() || 'Membre',
    });
  }

  async update(id: string, updates: Partial<PhaseEmployeeInput>): Promise<PhaseEmployeeRow> {
    if (!id) throw new AppError(ErrorCode.VALIDATION_ERROR, "Identifiant d'affectation requis");
    return this.repository.update(id, updates);
  }

  async remove(id: string): Promise<void> {
    if (!id) throw new AppError(ErrorCode.VALIDATION_ERROR, "Identifiant d'affectation requis");
    await this.repository.delete(id);
  }

  /** Coût main d'œuvre indicatif (somme des taux journaliers). */
  totalDailyCost(rows: PhaseEmployeeRow[]): number {
    return rows.reduce((sum, row) => sum + (row.dailyRate || 0), 0);
  }
}

let instance: PhaseEmployeeService | null = null;

export function getPhaseEmployeeService(): PhaseEmployeeService {
  if (!instance) instance = new PhaseEmployeeService(RepositoryFactory.getPhaseEmployeeRepository());
  return instance;
}
