import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
/**
 * RiskService - Service hexagonal pour la gestion des risques
 * Respecte l'architecture hexagonale : Service → Repository → Adapter → Supabase
 */

import { Risk, RiskStatus as DomainRiskStatus } from '@/domain/entities/Risk';
import { IRiskRepository } from '@/domain/repositories/IRiskRepository';
import { RiskTransformer } from '@/dtos/transforms/RiskTransformer';
import { RiskDTO } from '@/dtos/entities/RiskDTO';

// Local types for service
interface CreateRiskRequest {
  project_id: string;
  title: string;
  description?: string;
  probability: number;
  impact: number;
  category?: string;
  mitigation_strategy?: string;
  identified_by?: string;
}

interface UpdateRiskRequest {
  title?: string;
  description?: string;
  probability?: number;
  impact?: number;
  status?: string;
  category?: string;
  mitigation_strategy?: string;
}

export class RiskService {
  constructor(private riskRepository: IRiskRepository) {}

  async getProjectRisks(projectId: string): Promise<RiskDTO[]> {
    try {
      const risks = await this.riskRepository.findByProjectId(projectId);
      return risks.map(risk => RiskTransformer.toDTO(risk));
    } catch (error) {
      console.error('Error fetching project risks:', error);
      throw new Error('Failed to fetch project risks');
    }
  }

  async createRisk(data: CreateRiskRequest): Promise<RiskDTO> {
    try {
      this.validateRiskData(data);

      const risk = new Risk(
        crypto.randomUUID(),
        { id: data.project_id, title: '' } as any,
        data.title,
        data.description || null,
        data.probability,
        data.impact,
        'open' as DomainRiskStatus,
        data.category as any || 'technical',
        data.mitigation_strategy || null,
        data.identified_by ? { id: data.identified_by, fullName: '' } as any : null,
        new Date().toISOString(),
        [],
        new Date().toISOString(),
        new Date().toISOString()
      );

      await this.riskRepository.save(risk);
      return RiskTransformer.toDTO(risk);
    } catch (error) {
      console.error('Error creating risk:', error);
      throw new Error('Failed to create risk');
    }
  }

  async updateRisk(riskId: string, data: UpdateRiskRequest): Promise<RiskDTO> {
    try {
      const existing = await this.riskRepository.findById(riskId);
      if (!existing) {
        throw new Error('Risk not found');
      }

      await this.riskRepository.update(riskId, data as any);
      const updated = await this.riskRepository.findById(riskId);
      
      if (!updated) {
        throw new Error('Failed to retrieve updated risk');
      }

      return RiskTransformer.toDTO(updated);
    } catch (error) {
      console.error('Error updating risk:', error);
      throw new Error('Failed to update risk');
    }
  }

  async deleteRisk(riskId: string): Promise<void> {
    try {
      await this.riskRepository.delete(riskId);
    } catch (error) {
      console.error('Error deleting risk:', error);
      throw new Error('Failed to delete risk');
    }
  }

  async getRiskById(riskId: string): Promise<RiskDTO | null> {
    try {
      const risk = await this.riskRepository.findById(riskId);
      return risk ? RiskTransformer.toDTO(risk) : null;
    } catch (error) {
      console.error('Error fetching risk:', error);
      throw new Error('Failed to fetch risk');
    }
  }

  private validateRiskData(data: CreateRiskRequest): void {
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Risk title is required');
    }
    if (data.probability < 0 || data.probability > 1) {
      throw new Error('Probability must be between 0 and 1');
    }
    if (data.impact < 0 || data.impact > 1) {
      throw new Error('Impact must be between 0 and 1');
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
