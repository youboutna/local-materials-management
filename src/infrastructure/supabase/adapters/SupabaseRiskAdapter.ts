// @ts-nocheck
// Supabase Adapter for Risk Repository
// Note: Risk table doesn't exist in current schema - this is a stub implementation
// that can be connected when the table is created
import { IRiskRepository } from '@/domain/repositories/IRiskRepository';
import { Risk } from '@/domain/entities/Risk';
import { RiskStatus, RiskLevel, RiskCategory } from '@/domain/entities/RiskTypesExport';

export class SupabaseRiskAdapter implements IRiskRepository {
  // In-memory storage for risks until table is created
  private risks: Risk[] = [];

  async findById(id: string): Promise<Risk | null> {
    return this.risks.find(r => r.id === id) || null;
  }

  async findAll(): Promise<Risk[]> {
    return [...this.risks];
  }

  async save(risk: Risk): Promise<void> {
    const existingIndex = this.risks.findIndex(r => r.id === risk.id);
    if (existingIndex >= 0) {
      this.risks[existingIndex] = risk;
    } else {
      this.risks.push(risk);
    }
  }

  async update(id: string, data: Partial<Risk>): Promise<void> {
    const index = this.risks.findIndex(r => r.id === id);
    if (index >= 0) {
      const existing = this.risks[index];
      this.risks[index] = new Risk(
        existing.id,
        existing.projectId,
        data.title ?? existing.title,
        data.description ?? existing.description,
        data.probability ?? existing.probability,
        data.impact ?? existing.impact,
        data.status ?? existing.status,
        data.mitigationStrategy ?? existing.mitigationStrategy,
        existing.identifiedBy,
        existing.identifiedDate,
        existing.relatedTasks,
        existing.createdAt,
        new Date().toISOString()
      );
    }
  }

  async delete(id: string): Promise<void> {
    this.risks = this.risks.filter(r => r.id !== id);
  }

  async findByProjectId(projectId: string): Promise<Risk[]> {
    return this.risks.filter(r => r.projectId === projectId);
  }

  async findByStatus(status: RiskStatus): Promise<Risk[]> {
    return this.risks.filter(r => r.status === status);
  }

  async findByLevel(level: RiskLevel): Promise<Risk[]> {
    return this.risks.filter(r => r.getRiskLevel() === level);
  }

  async findActive(): Promise<Risk[]> {
    return this.risks.filter(r => r.isActive());
  }

  async findCritical(): Promise<Risk[]> {
    return this.risks.filter(r => r.requiresImmediateAction());
  }

  async countByStatus(projectId: string): Promise<Record<RiskStatus, number>> {
    const projectRisks = this.risks.filter(r => r.projectId === projectId);
    const counts: Record<string, number> = {
      identified: 0,
      monitored: 0,
      mitigated: 0,
      resolved: 0
    };
    
    projectRisks.forEach(r => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });

    return counts as Record<RiskStatus, number>;
  }

  async countByLevel(projectId: string): Promise<Record<RiskLevel, number>> {
    const projectRisks = this.risks.filter(r => r.projectId === projectId);
    const counts: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    
    projectRisks.forEach(r => {
      const level = r.getRiskLevel();
      counts[level] = (counts[level] || 0) + 1;
    });

    return counts as Record<RiskLevel, number>;
  }

  async getAverageRiskScore(projectId: string): Promise<number> {
    const projectRisks = this.risks.filter(r => r.projectId === projectId);
    if (projectRisks.length === 0) return 0;
    
    const totalScore = projectRisks.reduce((sum, r) => sum + r.getRiskScore(), 0);
    return totalScore / projectRisks.length;
  }

  async getHighestRisks(projectId: string, limit: number): Promise<Risk[]> {
    return this.risks
      .filter(r => r.projectId === projectId)
      .sort((a, b) => b.getRiskScore() - a.getRiskScore())
      .slice(0, limit);
  }

  async getUnmitigatedRisks(projectId: string): Promise<Risk[]> {
    return this.risks.filter(
      r => r.projectId === projectId && !r.hasMitigation() && r.isActive()
    );
  }
}
