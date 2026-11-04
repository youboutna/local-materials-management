import type { ControlActionRecordKind, IControlActionContextRepository } from '@/domain/repositories/IControlActionContextRepository';

const TABLES: Record<ControlActionRecordKind, string> = {
  project: 'projects',
  insurance: 'insurance_certificates',
  inspection: 'inspections',
  bank_guarantee: 'bank_guarantees',
};

async function btp(): Promise<any> {
  const { btpClient } = await import('@/integrations/supabase/schema-clients');
  return btpClient;
}

async function run(q: PromiseLike<{ data: any; error: any }>) {
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export class SupabaseControlActionContextAdapter implements IControlActionContextRepository {
  async findRecord(kind: ControlActionRecordKind, id: string) {
    return (await run((await btp()).from(TABLES[kind]).select('*').eq('id', id).maybeSingle())) ?? null;
  }
  async findActiveEmployees(department?: string) {
    let q = (await btp()).from('employees').select('id, full_name, email, phone, position, department').eq('is_active', true);
    if (department) q = q.eq('department', department);
    return (await run(q)) ?? [];
  }
  async findEmployeesByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return (await run((await btp()).from('employees').select('id, full_name, email, phone, position').in('id', ids))) ?? [];
  }
  async findProjectOrganizations(projectId: string) {
    return (await run((await btp()).from('project_organizations')
      .select('id, project_id, organization_id, role, is_primary, contract_amount, contract_start_date, contract_end_date, organizations:organization_id(name)')
      .eq('project_id', projectId))) ?? [];
  }
  async findEmployee(id: string) {
    return (await run((await btp()).from('employees').select('id, full_name, email').eq('id', id).maybeSingle())) ?? null;
  }
  async findActiveSuppliers() {
    return (await run((await btp()).from('suppliers').select('id, name, email, phone, contact_person').eq('is_active', true))) ?? [];
  }
  async findDocumentsByInspection(inspectionId: string) {
    return (await run((await btp()).from('documents').select('*').eq('inspection_id', inspectionId))) ?? [];
  }
  async findActionHistory(entityType: string, entityId?: string) {
    let q = (await btp()).from('notifications').select('*').eq('type', 'system').like('metadata->entityType', entityType);
    if (entityId) q = q.eq('metadata->entityId', entityId);
    return (await run(q.order('created_at', { ascending: false }))) ?? [];
  }
}
