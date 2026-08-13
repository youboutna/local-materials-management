/**
 * SupabasePhaseMaterialAdapter — implements IPhaseMaterialRepository over btp.phase_materials.
 * DB (snake_case) -> DTO (camelCase). No React, no business logic.
 */
import type {
  IPhaseMaterialRepository,
  PhaseMaterialInput,
  PhaseMaterialRow,
} from '@/domain/repositories/IPhaseMaterialRepository';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';

const TABLE = 'phase_materials';

interface PhaseMaterialDbRow {
  id: string;
  project_id: string | null;
  phase_id: string;
  material_id: string;
  quantity: number;
  created_at?: string | null;
  updated_at?: string | null;
}

function fromDb(row: PhaseMaterialDbRow): PhaseMaterialRow {
  return {
    id: row.id,
    projectId: row.project_id,
    phaseId: row.phase_id,
    materialId: row.material_id,
    quantity: Number(row.quantity ?? 0),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export class SupabasePhaseMaterialAdapter implements IPhaseMaterialRepository {
  async findByPhaseId(phaseId: string): Promise<PhaseMaterialRow[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('phase_id', phaseId);
    if (error) throw new Error(error.message);
    return ((data ?? []) as PhaseMaterialDbRow[]).map(fromDb);
  }

  async findByProjectId(projectId: string): Promise<PhaseMaterialRow[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('project_id', projectId);
    if (error) throw new Error(error.message);
    return ((data ?? []) as PhaseMaterialDbRow[]).map(fromDb);
  }

  /** Idempotent: find existing row for (phase_id, material_id) then update, else insert. */
  async upsert(input: PhaseMaterialInput): Promise<PhaseMaterialRow> {
    const { data: existing, error: findError } = await supabase
      .from(TABLE)
      .select('id, quantity')
      .eq('phase_id', input.phaseId)
      .eq('material_id', input.materialId)
      .maybeSingle();
    if (findError) throw new Error(findError.message);

    if (existing) {
      const { data, error } = await supabase
        .from(TABLE)
        .update({ quantity: input.quantity })
        .eq('id', (existing as { id: string }).id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return fromDb(data as PhaseMaterialDbRow);
    }

    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        project_id: input.projectId ?? null,
        phase_id: input.phaseId,
        material_id: input.materialId,
        quantity: input.quantity,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return fromDb(data as PhaseMaterialDbRow);
  }
}
