/**
 * SupabaseRiskAdapter - Persistance réelle des risques projet (btp.project_risks)
 * Architecture hexagonale : Repository port → Adapter → Supabase
 */
import { btpClient } from '@/integrations/supabase/schema-clients';
import { IRiskRepository } from '@/domain/repositories/IRiskRepository';
import { Risk, RiskDetails } from '@/domain/entities/Risk';
import { RiskStatus, RiskLevel, RiskCategory, RISK_CATEGORY_VALUES, RISK_STATUS_VALUES } from '@/domain/entities/RiskTypesExport';

const TABLE = 'project_risks';

interface RiskRow {
  id: string;
  project_id: string;
  risk_title: string;
  risk_description: string | null;
  probability: string | null;
  impact: string | null;
  probability_numeric: number | null;
  impact_numeric: number | null;
  risk_score: number | null;
  risk_level: string | null;
  category: string | null;
  mitigation_strategy: string | null;
  mitigation_plan: string | null;
  contingency_plan: string | null;
  costs: number | null;
  timeline_impact: number | null;
  review_date: string | null;
  due_date: string | null;
  owner_id: string | null;
  identified_by: string | null;
  identified_date: string | null;
  status: string | null;
  status_new: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Normalise une catégorie libre vers les catégories du domaine */
function normalizeCategory(value?: string | null): RiskCategory {
  const v = (value || '').toLowerCase();
  if (RISK_CATEGORY_VALUES.includes(v as RiskCategory)) return v as RiskCategory;
  const map: Record<string, RiskCategory> = {
    security: 'safety',
    health_safety: 'safety',
    environmental: 'compliance',
    regulatory: 'compliance',
    quality: 'technical',
    schedule: 'operational',
    resource: 'operational',
    stakeholder: 'strategic',
  };
  return map[v] || 'operational';
}

/** Normalise un statut libre vers les statuts du domaine */
function normalizeStatus(value?: string | null): RiskStatus {
  const v = (value || '').toLowerCase();
  if (RISK_STATUS_VALUES.includes(v as RiskStatus)) return v as RiskStatus;
  const map: Record<string, RiskStatus> = {
    open: 'identified',
    assessed: 'monitored',
    monitoring: 'monitored',
    escalated: 'monitored',
    closed: 'resolved',
    accepted: 'resolved',
  };
  return map[v] || 'identified';
}

/** Convertit une échelle 1-10 (ou 0-1) vers 0-1 */
function toUnit(value?: number | string | null, fallback = 0.5): number {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (n === null || n === undefined || Number.isNaN(n)) return fallback;
  if (n > 1) return Math.min(1, n / 10);
  return Math.max(0, n);
}

function toTen(value: number): number {
  return Math.max(1, Math.min(10, Math.round((value || 0) * 10)));
}

function toDomain(row: RiskRow): Risk {
  const probability = toUnit(row.probability_numeric ?? row.probability);
  const impact = toUnit(row.impact_numeric ?? row.impact);
  const details: RiskDetails = {
    mitigationPlan: row.mitigation_plan,
    contingencyPlan: row.contingency_plan,
    costs: row.costs,
    timelineImpact: row.timeline_impact,
    reviewDate: row.review_date,
    ownerId: row.owner_id,
    dueDate: row.due_date,
  };

  return Risk.create({
    id: row.id,
    project: { id: row.project_id, title: '' },
    title: row.risk_title,
    description: row.risk_description || undefined,
    probability,
    impact,
    status: normalizeStatus(row.status_new ?? row.status),
    category: normalizeCategory(row.category),
    mitigationStrategy: row.mitigation_strategy,
    identifiedBy: row.identified_by ? { id: row.identified_by, fullName: '' } : null,
    identifiedDate: row.identified_date,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    details,
  });
}

function toRow(risk: Risk): Record<string, unknown> {
  const d = risk.details || {};
  const probTen = toTen(risk.probability);
  const impactTen = toTen(risk.impact);

  return {
    id: risk.id,
    project_id: risk.projectId,
    risk_title: risk.title,
    risk_description: risk.description,
    probability: String(probTen),
    impact: String(impactTen),
    probability_numeric: probTen,
    impact_numeric: impactTen,
    risk_score: probTen * impactTen,
    risk_level: risk.getRiskLevel(),
    category: risk.category,
    mitigation_strategy: risk.mitigationStrategy,
    mitigation_plan: d.mitigationPlan ?? risk.mitigationStrategy ?? null,
    contingency_plan: d.contingencyPlan ?? null,
    costs: d.costs ?? 0,
    timeline_impact: d.timelineImpact ?? 0,
    review_date: d.reviewDate || null,
    due_date: d.dueDate || null,
    owner_id: d.ownerId || null,
    identified_by: risk.identifiedBy?.id || null,
    status: risk.status,
    status_new: risk.status,
  };
}

export class SupabaseRiskAdapter implements IRiskRepository {
  private async query(): Promise<RiskRow[]> {
    const { data, error } = await btpClient.from(TABLE).select('*');
    if (error) throw new Error(`Risk fetch failed: ${error.message}`);
    return (data || []) as unknown as RiskRow[];
  }

  async findById(id: string): Promise<Risk | null> {
    const { data, error } = await btpClient.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Risk fetch failed: ${error.message}`);
    return data ? toDomain(data as unknown as RiskRow) : null;
  }

  async findAll(): Promise<Risk[]> {
    return (await this.query()).map(toDomain);
  }

  async save(risk: Risk): Promise<void> {
    const { error } = await btpClient.from(TABLE).upsert(toRow(risk) as never, { onConflict: 'id' });
    if (error) throw new Error(`Risk save failed: ${error.message}`);
  }

  async update(id: string, data: Partial<Risk> & { details?: RiskDetails }): Promise<void> {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const src = data as Record<string, unknown>;

    if (src.title !== undefined) payload.risk_title = src.title;
    if (src.description !== undefined) payload.risk_description = src.description;
    if (src.probability !== undefined) {
      const ten = toTen(toUnit(src.probability as number));
      payload.probability = String(ten);
      payload.probability_numeric = ten;
    }
    if (src.impact !== undefined) {
      const ten = toTen(toUnit(src.impact as number));
      payload.impact = String(ten);
      payload.impact_numeric = ten;
    }
    if (payload.probability_numeric && payload.impact_numeric) {
      payload.risk_score = (payload.probability_numeric as number) * (payload.impact_numeric as number);
    }
    if (src.status !== undefined) {
      const status = normalizeStatus(src.status as string);
      payload.status = status;
      payload.status_new = status;
    }
    if (src.category !== undefined) payload.category = normalizeCategory(src.category as string);
    if (src.mitigationStrategy !== undefined) payload.mitigation_strategy = src.mitigationStrategy;

    const d = data.details;
    if (d) {
      if (d.mitigationPlan !== undefined) payload.mitigation_plan = d.mitigationPlan;
      if (d.contingencyPlan !== undefined) payload.contingency_plan = d.contingencyPlan;
      if (d.costs !== undefined) payload.costs = d.costs;
      if (d.timelineImpact !== undefined) payload.timeline_impact = d.timelineImpact;
      if (d.reviewDate !== undefined) payload.review_date = d.reviewDate || null;
      if (d.dueDate !== undefined) payload.due_date = d.dueDate || null;
      if (d.ownerId !== undefined) payload.owner_id = d.ownerId || null;
    }

    const { error } = await btpClient.from(TABLE).update(payload as never).eq('id', id);
    if (error) throw new Error(`Risk update failed: ${error.message}`);
  }

  async delete(id: string): Promise<void> {
    const { error } = await btpClient.from(TABLE).delete().eq('id', id);
    if (error) throw new Error(`Risk delete failed: ${error.message}`);
  }

  async findByProjectId(projectId: string): Promise<Risk[]> {
    if (!projectId) return [];
    const { data, error } = await btpClient
      .from(TABLE)
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(`Risk fetch failed: ${error.message}`);
    return ((data || []) as unknown as RiskRow[]).map(toDomain);
  }

  async findByStatus(status: RiskStatus): Promise<Risk[]> {
    return (await this.findAll()).filter(r => r.status === status);
  }

  async findByLevel(level: RiskLevel): Promise<Risk[]> {
    return (await this.findAll()).filter(r => r.getRiskLevel() === level);
  }

  async findActive(): Promise<Risk[]> {
    return (await this.findAll()).filter(r => r.status !== 'resolved');
  }

  async findCritical(): Promise<Risk[]> {
    return (await this.findAll()).filter(r => r.getRiskLevel() === 'critical');
  }

  async countByStatus(projectId: string): Promise<Record<RiskStatus, number>> {
    const risks = await this.findByProjectId(projectId);
    const counts: Record<string, number> = { identified: 0, monitored: 0, mitigated: 0, resolved: 0 };
    risks.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts as Record<RiskStatus, number>;
  }

  async countByLevel(projectId: string): Promise<Record<RiskLevel, number>> {
    const risks = await this.findByProjectId(projectId);
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    risks.forEach(r => { const l = r.getRiskLevel(); counts[l] = (counts[l] || 0) + 1; });
    return counts as Record<RiskLevel, number>;
  }

  async getAverageRiskScore(projectId: string): Promise<number> {
    const risks = await this.findByProjectId(projectId);
    if (!risks.length) return 0;
    return risks.reduce((sum, r) => sum + r.getRiskScore(), 0) / risks.length;
  }

  async getHighestRisks(projectId: string, limit: number): Promise<Risk[]> {
    const risks = await this.findByProjectId(projectId);
    return risks.sort((a, b) => b.getRiskScore() - a.getRiskScore()).slice(0, limit);
  }

  async getUnmitigatedRisks(projectId: string): Promise<Risk[]> {
    const risks = await this.findByProjectId(projectId);
    return risks.filter(r => !r.mitigationStrategy && r.status !== 'resolved');
  }
}
