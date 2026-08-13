import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
/**
 * RiskService - Service hexagonal pour la gestion des risques
 * Respecte l'architecture hexagonale : Service → Repository → Adapter → Supabase
 * Les échelles UI (1-10) sont normalisées vers le domaine (0-1).
 */

import { Risk, RiskDetails, RiskCategory as DomainRiskCategory, RiskStatus as DomainRiskStatus } from '@/domain/entities/Risk';
import { RISK_CATEGORY_VALUES, RISK_STATUS_VALUES } from '@/domain/entities/RiskTypesExport';
import { IRiskRepository } from '@/domain/repositories/IRiskRepository';
import { RiskTransformer } from '@/dtos/transforms/RiskTransformer';
import { RiskDTO } from '@/dtos/entities/RiskDTO';

// Local types for service
export interface CreateRiskRequest {
  project_id: string;
  title: string;
  description?: string;
  probability: number; // 1-10 (UI) ou 0-1
  impact: number; // 1-10 (UI) ou 0-1
  category?: string;
  mitigation_strategy?: string;
  identified_by?: string;
  // Détails opérationnels
  mitigation_plan?: string;
  contingency_plan?: string;
  costs?: number;
  timeline_impact?: number;
  review_date?: string;
  owner_id?: string;
  due_date?: string;
  status?: string;
}

export interface UpdateRiskRequest {
  title?: string;
  description?: string;
  probability?: number;
  impact?: number;
  status?: string;
  category?: string;
  mitigation_strategy?: string;
  mitigation_plan?: string;
  contingency_plan?: string;
  costs?: number;
  timeline_impact?: number;
  review_date?: string;
  owner_id?: string;
  due_date?: string;
}

/** Normalise une valeur 1-10 (ou 0-1) vers 0-1 */
function toUnit(value?: number | null, fallback = 0.5): number {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  if (value > 1) return Math.min(1, value / 10);
  return Math.max(0, value);
}

function normalizeCategory(value?: string | null): DomainRiskCategory {
  const v = (value || '').toLowerCase();
  if (RISK_CATEGORY_VALUES.includes(v as DomainRiskCategory)) return v as DomainRiskCategory;
  const map: Record<string, DomainRiskCategory> = {
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

function normalizeStatus(value?: string | null): DomainRiskStatus {
  const v = (value || '').toLowerCase();
  if (RISK_STATUS_VALUES.includes(v as DomainRiskStatus)) return v as DomainRiskStatus;
  const map: Record<string, DomainRiskStatus> = {
    open: 'identified',
    assessed: 'monitored',
    monitoring: 'monitored',
    escalated: 'monitored',
    closed: 'resolved',
    accepted: 'resolved',
  };
  return map[v] || 'identified';
}

export class RiskService {
  constructor(private riskRepository: IRiskRepository) {}

  async getProjectRisks(projectId: string): Promise<RiskDTO[]> {
    if (!projectId) return [];
    const risks = await this.riskRepository.findByProjectId(projectId);
    return risks.map(risk => RiskTransformer.toDTO(risk));
  }

  async createRisk(data: CreateRiskRequest): Promise<RiskDTO> {
    this.validateRiskData(data);

    const details: RiskDetails = {
      mitigationPlan: data.mitigation_plan ?? data.mitigation_strategy ?? null,
      contingencyPlan: data.contingency_plan ?? null,
      costs: data.costs ?? 0,
      timelineImpact: data.timeline_impact ?? 0,
      reviewDate: data.review_date || null,
      ownerId: data.owner_id || null,
      dueDate: data.due_date || null,
    };

    const risk = Risk.create({
      id: crypto.randomUUID(),
      project: { id: data.project_id, title: '' },
      title: data.title,
      description: data.description || undefined,
      probability: toUnit(data.probability),
      impact: toUnit(data.impact),
      status: normalizeStatus(data.status),
      category: normalizeCategory(data.category),
      mitigationStrategy: data.mitigation_strategy || data.mitigation_plan || null,
      identifiedBy: data.identified_by ? { id: data.identified_by, fullName: '' } : null,
      details,
    });

    await this.riskRepository.save(risk);
    return RiskTransformer.toDTO(risk);
  }

  async updateRisk(riskId: string, data: UpdateRiskRequest): Promise<RiskDTO> {
    const existing = await this.riskRepository.findById(riskId);
    if (!existing) {
      throw new Error('Risk not found');
    }

    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.probability !== undefined) updates.probability = toUnit(data.probability);
    if (data.impact !== undefined) updates.impact = toUnit(data.impact);
    if (data.status !== undefined) updates.status = normalizeStatus(data.status);
    if (data.category !== undefined) updates.category = normalizeCategory(data.category);
    if (data.mitigation_strategy !== undefined) updates.mitigationStrategy = data.mitigation_strategy;

    const details: RiskDetails = {};
    if (data.mitigation_plan !== undefined) details.mitigationPlan = data.mitigation_plan;
    if (data.contingency_plan !== undefined) details.contingencyPlan = data.contingency_plan;
    if (data.costs !== undefined) details.costs = data.costs;
    if (data.timeline_impact !== undefined) details.timelineImpact = data.timeline_impact;
    if (data.review_date !== undefined) details.reviewDate = data.review_date;
    if (data.owner_id !== undefined) details.ownerId = data.owner_id;
    if (data.due_date !== undefined) details.dueDate = data.due_date;
    if (Object.keys(details).length) updates.details = details;

    await this.riskRepository.update(riskId, updates as never);
    const updated = await this.riskRepository.findById(riskId);
    if (!updated) throw new Error('Failed to retrieve updated risk');
    return RiskTransformer.toDTO(updated);
  }

  async deleteRisk(riskId: string): Promise<void> {
    await this.riskRepository.delete(riskId);
  }

  async getRiskById(riskId: string): Promise<RiskDTO | null> {
    const risk = await this.riskRepository.findById(riskId);
    return risk ? RiskTransformer.toDTO(risk) : null;
  }

  private validateRiskData(data: CreateRiskRequest): void {
    if (!data.project_id) {
      throw new Error('Le projet doit être enregistré avant d\'ajouter des risques');
    }
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Risk title is required');
    }
  }
}

let riskServiceInstance: RiskService | null = null;
export function getRiskService(): RiskService {
  if (!riskServiceInstance) {
    riskServiceInstance = new RiskService(RepositoryFactory.getRiskRepository());
  }
  return riskServiceInstance;
}
