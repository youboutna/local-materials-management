/**
 * Supabase Reception Adapter — btp.receptions (snake_case) ↔ ReceptionDTO (camelCase).
 * Collections (participants, findings, decisions…) are stored as JSON on the reception row.
 */
import { IReceptionRepository } from '@/domain/repositories/IReceptionRepository';
import { ReceptionDTO } from '@/dtos/entities/ReceptionDTO';

type Row = Record<string, any>;
type NewReception = Omit<ReceptionDTO, 'id' | 'createdAt' | 'updatedAt'>;
type Criteria = Parameters<IReceptionRepository['search']>[0];

const TABLE = 'receptions';

async function db() {
  const { btpClient } = await import('@/integrations/supabase/schema-clients');
  return btpClient as unknown as { from: (t: string) => any };
}

const arr = (v: unknown) => (Array.isArray(v) ? v : []);

export class SupabaseReceptionAdapter implements IReceptionRepository {
  static toDTO(r: Row): ReceptionDTO {
    return {
      id: r.id,
      projectId: r.project_id,
      phaseId: r.phase_id ?? undefined,
      type: r.type,
      status: r.status,
      scheduledDate: r.scheduled_date,
      actualDate: r.actual_date ?? undefined,
      receptionCommittee: arr(r.reception_committee),
      chairmanId: r.chairman_id ?? '',
      chairmanName: r.chairman_name ?? '',
      participants: arr(r.participants),
      documents: arr(r.documents),
      inspections: arr(r.inspections),
      findings: arr(r.findings),
      decisions: arr(r.decisions),
      conditions: arr(r.conditions),
      provisionalValidUntil: r.provisional_valid_until ?? undefined,
      definitiveApprovalDate: r.definitive_approval_date ?? undefined,
      notes: r.notes ?? '',
      createdBy: r.created_by ?? '',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    } as ReceptionDTO;
  }

  static toRow(d: Partial<ReceptionDTO>): Row {
    const map: Array<[keyof ReceptionDTO, string]> = [
      ['projectId', 'project_id'], ['phaseId', 'phase_id'], ['type', 'type'], ['status', 'status'],
      ['scheduledDate', 'scheduled_date'], ['actualDate', 'actual_date'], ['chairmanId', 'chairman_id'],
      ['chairmanName', 'chairman_name'], ['receptionCommittee', 'reception_committee'],
      ['participants', 'participants'], ['documents', 'documents'], ['inspections', 'inspections'],
      ['findings', 'findings'], ['decisions', 'decisions'], ['conditions', 'conditions'],
      ['provisionalValidUntil', 'provisional_valid_until'], ['definitiveApprovalDate', 'definitive_approval_date'],
      ['notes', 'notes'], ['createdBy', 'created_by'],
    ];
    const row: Row = {};
    for (const [k, c] of map) {
      if (d[k] === undefined) continue;
      const v = d[k] as unknown;
      row[c] = v === '' && (c.endsWith('_id') || c.endsWith('_date') || c.endsWith('_until')) ? null : v;
    }
    return row;
  }

  private async list(build: (q: any) => any): Promise<ReceptionDTO[]> {
    const client = await db();
    const { data, error } = await build(client.from(TABLE).select('*')).order('scheduled_date', { ascending: true });
    if (error) throw new Error(`Failed to load receptions: ${error.message}`);
    return (data ?? []).map(SupabaseReceptionAdapter.toDTO);
  }

  private async require(id: string): Promise<ReceptionDTO> {
    const r = await this.findById(id);
    if (!r) throw new Error('Reception not found');
    return r;
  }

  async create(reception: NewReception): Promise<ReceptionDTO> {
    const client = await db();
    const { data, error } = await client.from(TABLE).insert(SupabaseReceptionAdapter.toRow(reception)).select('*').single();
    if (error) throw new Error(`Failed to create reception: ${error.message}`);
    return SupabaseReceptionAdapter.toDTO(data);
  }

  async findById(id: string): Promise<ReceptionDTO | null> {
    const client = await db();
    const { data, error } = await client.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Failed to load reception: ${error.message}`);
    return data ? SupabaseReceptionAdapter.toDTO(data) : null;
  }

  findByProjectId(projectId: string) { return this.list(q => q.eq('project_id', projectId)); }

  async update(id: string, updates: Partial<ReceptionDTO>): Promise<ReceptionDTO> {
    const client = await db();
    const { data, error } = await client.from(TABLE).update(SupabaseReceptionAdapter.toRow(updates)).eq('id', id).select('*').single();
    if (error) throw new Error(`Failed to update reception: ${error.message}`);
    return SupabaseReceptionAdapter.toDTO(data);
  }

  async delete(id: string): Promise<void> {
    const client = await db();
    const { error } = await client.from(TABLE).delete().eq('id', id);
    if (error) throw new Error(`Failed to delete reception: ${error.message}`);
  }

  findByType(projectId: string, type: 'provisional' | 'definitive') { return this.list(q => q.eq('project_id', projectId).eq('type', type)); }
  findByStatus(status: string) { return this.list(q => q.eq('status', status)); }
  findByDateRange(startDate: string, endDate: string) { return this.list(q => q.gte('scheduled_date', startDate).lte('scheduled_date', endDate)); }
  findByChairman(chairmanId: string) { return this.list(q => q.eq('chairman_id', chairmanId)); }

  async createBatch(receptions: NewReception[]): Promise<ReceptionDTO[]> {
    if (receptions.length === 0) return [];
    const client = await db();
    const { data, error } = await client.from(TABLE).insert(receptions.map(r => SupabaseReceptionAdapter.toRow(r))).select('*');
    if (error) throw new Error(`Failed to create receptions: ${error.message}`);
    return (data ?? []).map(SupabaseReceptionAdapter.toDTO);
  }

  async updateBatch(updates: Array<{ id: string; data: Partial<ReceptionDTO> }>): Promise<ReceptionDTO[]> {
    const out: ReceptionDTO[] = [];
    for (const u of updates) out.push(await this.update(u.id, u.data));
    return out;
  }

  search(c: Criteria) {
    return this.list(q => {
      let r = q;
      if (c.projectId) r = r.eq('project_id', c.projectId);
      if (c.type) r = r.eq('type', c.type);
      if (c.status) r = r.eq('status', c.status);
      if (c.chairmanId) r = r.eq('chairman_id', c.chairmanId);
      if (c.dateRange) r = r.gte('scheduled_date', c.dateRange.start).lte('scheduled_date', c.dateRange.end);
      return r;
    });
  }

  /** Valid when every participant approved and no blocking (critical, open) finding remains. */
  async validateReception(id: string): Promise<boolean> {
    const r = await this.require(id);
    const participantsOk = r.participants.length > 0 && r.participants.every(p => p.hasApproved);
    const blocking = (r.findings as any[]).some(f => f?.severity === 'critical' && f?.status !== 'resolved');
    return participantsOk && !blocking;
  }

  async getReceptionWorkflow(projectId: string) {
    const receptions = await this.findByProjectId(projectId);
    return {
      provisional: receptions.filter(r => r.type === 'provisional'),
      definitive: receptions.filter(r => r.type === 'definitive'),
    };
  }

  private async patchList(id: string, key: 'documents' | 'participants' | 'findings' | 'decisions', fn: (items: any[]) => any[]) {
    const r = await this.require(id);
    await this.update(id, { [key]: fn(r[key] as any[]) } as Partial<ReceptionDTO>);
  }

  addDocument(id: string, document: any) { return this.patchList(id, 'documents', l => [...l, document]); }
  removeDocument(id: string, documentId: string) { return this.patchList(id, 'documents', l => l.filter(d => d.id !== documentId)); }
  async getDocuments(id: string) { return (await this.require(id)).documents; }
  async updateCommittee(id: string, committee: string[]) { await this.update(id, { receptionCommittee: committee }); }
  addCommitteeMember(id: string, member: any) { return this.patchList(id, 'participants', l => [...l.filter(p => p.id !== member.id), member]); }
  removeCommitteeMember(id: string, memberId: string) { return this.patchList(id, 'participants', l => l.filter(p => p.id !== memberId)); }
  addFinding(id: string, finding: any) { return this.patchList(id, 'findings', l => [...l, finding]); }
  updateFinding(id: string, findingId: string, finding: any) { return this.patchList(id, 'findings', l => l.map(f => (f.id === findingId ? { ...f, ...finding } : f))); }
  addDecision(id: string, decision: any) { return this.patchList(id, 'decisions', l => [...l, decision]); }

  async getReceptionStats(projectId: string) {
    const rs = await this.findByProjectId(projectId);
    const by = (s: string) => rs.filter(r => r.status === s).length;
    return {
      total: rs.length,
      provisional: rs.filter(r => r.type === 'provisional').length,
      definitive: rs.filter(r => r.type === 'definitive').length,
      approved: by('approved'),
      pending: by('scheduled') + by('in_progress') + by('pending'),
      rejected: by('rejected'),
    };
  }

  async getReceptionTimeline(projectId: string) {
    const rs = await this.findByProjectId(projectId);
    return rs.map(r => ({ date: r.actualDate ?? r.scheduledDate, type: r.type, status: r.status, description: r.notes }));
  }
}
