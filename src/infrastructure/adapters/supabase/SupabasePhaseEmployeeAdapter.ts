/**
 * SupabasePhaseEmployeeAdapter — implémente IPhaseEmployeeRepository sur btp.phase_employees.
 * DB (snake_case) -> DTO (camelCase). Aucun React, aucune logique métier.
 */
import type {
  IPhaseEmployeeRepository,
  PhaseEmployeeInput,
  PhaseEmployeeRow,
} from '@/domain/repositories/IPhaseEmployeeRepository';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';

const TABLE = 'phase_employees';

interface PhaseEmployeeDbRow {
  id: string;
  phase_id: string;
  employee_id: string | null;
  employee_name: string | null;
  employee_role: string | null;
  employee_contact: string | null;
  daily_rate: number | null;
  start_date: string | null;
  end_date: string | null;
  is_primary_supplier: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

function fromDb(row: PhaseEmployeeDbRow): PhaseEmployeeRow {
  return {
    id: row.id,
    phaseId: row.phase_id,
    employeeId: row.employee_id ?? null,
    employeeName: row.employee_name ?? '',
    employeeRole: row.employee_role ?? '',
    employeeContact: row.employee_contact ?? null,
    dailyRate: row.daily_rate != null ? Number(row.daily_rate) : null,
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    isPrimarySupplier: !!row.is_primary_supplier,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

function toDb(input: Partial<PhaseEmployeeInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.phaseId !== undefined) row.phase_id = input.phaseId;
  if (input.employeeId !== undefined) row.employee_id = input.employeeId ?? null;
  if (input.employeeName !== undefined) row.employee_name = input.employeeName;
  if (input.employeeRole !== undefined) row.employee_role = input.employeeRole;
  if (input.employeeContact !== undefined) row.employee_contact = input.employeeContact ?? null;
  if (input.dailyRate !== undefined) row.daily_rate = input.dailyRate ?? null;
  if (input.startDate !== undefined) row.start_date = input.startDate || null;
  if (input.endDate !== undefined) row.end_date = input.endDate || null;
  if (input.isPrimarySupplier !== undefined) row.is_primary_supplier = !!input.isPrimarySupplier;
  return row;
}

export class SupabasePhaseEmployeeAdapter implements IPhaseEmployeeRepository {
  async findByPhaseId(phaseId: string): Promise<PhaseEmployeeRow[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('phase_id', phaseId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as PhaseEmployeeDbRow[]).map(fromDb);
  }

  async create(input: PhaseEmployeeInput): Promise<PhaseEmployeeRow> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(toDb(input) as never)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return fromDb(data as unknown as PhaseEmployeeDbRow);
  }

  async update(id: string, updates: Partial<PhaseEmployeeInput>): Promise<PhaseEmployeeRow> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(toDb(updates) as never)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return fromDb(data as unknown as PhaseEmployeeDbRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
