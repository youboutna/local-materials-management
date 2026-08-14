/**
 * Adapter Supabase de propagation DQE -> Ressources planifiées.
 */
import { btpClient } from '@/integrations/supabase/schema-clients';
import type {
  IBoqPropagationRepository,
  PhaseEmployeeAllocation,
  PhaseMaterialAllocation,
  PhaseResourceCounts,
  ProjectResourceAllocation,
} from '@/domain/repositories/IBoqPropagationRepository';

export class SupabaseBoqPropagationAdapter implements IBoqPropagationRepository {
  async upsertPhaseMaterials(allocations: PhaseMaterialAllocation[]): Promise<number> {
    if (!allocations.length) return 0;
    let written = 0;

    for (const allocation of allocations) {
      const { data: existing, error: readError } = await btpClient
        .from('phase_materials')
        .select('id')
        .eq('phase_id', allocation.phaseId)
        .eq('material_id', allocation.materialId)
        .maybeSingle();
      if (readError) throw readError;

      if (existing?.id) {
        const { error } = await btpClient
          .from('phase_materials')
          .update({ quantity: allocation.quantity, project_id: allocation.projectId })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await btpClient.from('phase_materials').insert({
          phase_id: allocation.phaseId,
          project_id: allocation.projectId,
          material_id: allocation.materialId,
          quantity: allocation.quantity,
        } as never);
        if (error) throw error;
      }
      written += 1;
    }

    return written;
  }

  async upsertPhaseEmployees(allocations: PhaseEmployeeAllocation[]): Promise<number> {
    if (!allocations.length) return 0;
    let written = 0;

    for (const allocation of allocations) {
      const { data: existing, error: readError } = await btpClient
        .from('phase_employees')
        .select('id')
        .eq('phase_id', allocation.phaseId)
        .eq('employee_name', allocation.employeeName)
        .eq('employee_role', allocation.employeeRole)
        .maybeSingle();
      if (readError) throw readError;

      if (existing?.id) {
        const { error } = await btpClient
          .from('phase_employees')
          .update({ daily_rate: allocation.dailyRate ?? null })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await btpClient.from('phase_employees').insert({
          phase_id: allocation.phaseId,
          employee_name: allocation.employeeName,
          employee_role: allocation.employeeRole,
          daily_rate: allocation.dailyRate ?? null,
        } as never);
        if (error) throw error;
      }
      written += 1;
    }

    return written;
  }

  async upsertProjectResources(allocations: ProjectResourceAllocation[]): Promise<number> {
    if (!allocations.length) return 0;
    let written = 0;

    for (const allocation of allocations) {
      const { data: existing, error: readError } = await btpClient
        .from('project_resources')
        .select('id')
        .eq('project_id', allocation.projectId)
        .eq('type', allocation.type)
        .eq('name', allocation.name)
        .maybeSingle();
      if (readError) throw readError;

      const payload = {
        project_id: allocation.projectId,
        type: allocation.type,
        name: allocation.name,
        quantity: allocation.quantity != null ? Math.round(allocation.quantity) : null,
        unit: allocation.unit ?? null,
        cost_per_unit: allocation.costPerUnit ?? null,
        total_cost: allocation.totalCost ?? null,
        notes: allocation.notes ?? null,
      };

      if (existing?.id) {
        const { error } = await btpClient.from('project_resources').update(payload as never).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await btpClient.from('project_resources').insert(payload as never);
        if (error) throw error;
      }
      written += 1;
    }

    return written;
  }

  async countPhaseResources(projectId: string): Promise<PhaseResourceCounts[]> {
    const { data: phases, error: phasesError } = await btpClient
      .from('project_phases')
      .select('id')
      .eq('project_id', projectId);
    if (phasesError) throw phasesError;

    const phaseIds = (phases ?? []).map((p: { id: string }) => p.id);
    if (!phaseIds.length) return [];

    const [materials, employees, takeoffs] = await Promise.all([
      btpClient.from('phase_materials').select('phase_id').in('phase_id', phaseIds),
      btpClient.from('phase_employees').select('phase_id').in('phase_id', phaseIds),
      btpClient.from('quantity_takeoffs').select('phase_id').eq('project_id', projectId),
    ]);

    if (materials.error) throw materials.error;
    if (employees.error) throw employees.error;
    if (takeoffs.error) throw takeoffs.error;

    const tally = (rows: Array<{ phase_id: string | null }> | null) => {
      const map = new Map<string, number>();
      (rows ?? []).forEach((row) => {
        if (!row.phase_id) return;
        map.set(row.phase_id, (map.get(row.phase_id) ?? 0) + 1);
      });
      return map;
    };

    const materialMap = tally(materials.data as Array<{ phase_id: string | null }>);
    const employeeMap = tally(employees.data as Array<{ phase_id: string | null }>);
    const takeoffMap = tally(takeoffs.data as Array<{ phase_id: string | null }>);

    return phaseIds.map((phaseId) => ({
      phaseId,
      materials: materialMap.get(phaseId) ?? 0,
      employees: employeeMap.get(phaseId) ?? 0,
      takeoffs: takeoffMap.get(phaseId) ?? 0,
    }));
  }
}

export const boqPropagationRepository = new SupabaseBoqPropagationAdapter();
