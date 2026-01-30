/**
 * RiskService - Service hexagonal pour la gestion des risques
 * Respecte l'architecture hexagonale : Service → Repository → Adapter → Supabase
 */

import { Risk, RiskStatus, RiskLevel, RiskCategory } from '@/domain/entities/Risk';
import { IRiskRepository } from '@/domain/repositories/IRiskRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { RiskTransformer } from '@/dtos/transforms/RiskTransformer';

// Create array of categories for validation
const RISK_CATEGORIES = ['technical', 'financial', 'operational', 'strategic', 'compliance', 'safety'] as const;

export interface RiskDTO {
  id?: string;
  project_id?: string;
  title: string;
  description?: string;
  probability: number; // 0-1
  impact: number; // 0-1
  status: RiskStatus;
  category: RiskCategory;
  mitigation_strategy?: string;
  identified_by?: string;
  identified_date?: string;
  related_tasks?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateRiskRequest {
  project_id: string;
  title: string;
  description?: string;
  probability: number;
  impact: number;
  category: RiskCategory;
  mitigation_strategy?: string;
  identified_by?: string;
}

export interface UpdateRiskRequest {
  title?: string;
  description?: string;
  probability?: number;
  impact?: number;
  status?: RiskStatus;
  category?: RiskCategory;
  mitigation_strategy?: string;
  related_tasks?: string[];
}

export class RiskService {
  private riskRepository: IRiskRepository;

  constructor() {
    this.riskRepository = RepositoryFactory.getRiskRepository();
  }

  /**
   * Obtenir tous les risques d'un projet
   */
  async getProjectRisks(projectId: string): Promise<RiskDTO[]> {
    try {
      const risks = await this.riskRepository.findByProjectId(projectId);
      return risks.map(risk => RiskTransformer.toDTO(risk));
    } catch (error) {
      console.error('Error fetching project risks:', error);
      throw new Error('Failed to fetch project risks');
    }
  }

  /**
   * Créer un nouveau risque
   */
  async createRisk(data: CreateRiskRequest): Promise<RiskDTO> {
    try {
      // Validation des données
      this.validateRiskData(data);

      // Création de l'entité
      const risk = new Risk(
        crypto.randomUUID(),
        { id: data.project_id, title: '' }, // Project minimal
        data.title,
        data.description || null,
        data.probability,
        data.impact,
        'identified', // Status par défaut
        data.category,
        data.mitigation_strategy || null,
        data.identified_by ? { id: data.identified_by, fullName: '' } : null,
        new Date().toISOString(),
        [],
        new Date().toISOString(),
        new Date().toISOString()
      );

      // Sauvegarde via le repository
      const savedRisk = await this.riskRepository.save(risk);
      return RiskTransformer.toDTO(savedRisk);
    } catch (error) {
      console.error('Error creating risk:', error);
      throw new Error('Failed to create risk');
    }
  }

  /**
   * Mettre à jour un risque
   */
  async updateRisk(riskId: string, data: UpdateRiskRequest): Promise<RiskDTO> {
    try {
      const existingRisk = await this.riskRepository.findById(riskId);
      if (!existingRisk) {
        throw new Error('Risk not found');
      }

      // Create updated risk with new values
      const updatedRisk = new Risk(
        existingRisk.id,
        existingRisk.project,
        data.title !== undefined ? data.title : existingRisk.title,
        data.description !== undefined ? data.description : existingRisk.description,
        data.probability !== undefined ? data.probability : existingRisk.probability,
        data.impact !== undefined ? data.impact : existingRisk.impact,
        data.status !== undefined ? data.status : existingRisk.status,
        data.category !== undefined ? data.category : existingRisk.category,
        data.mitigation_strategy !== undefined ? data.mitigation_strategy : existingRisk.mitigationStrategy,
        existingRisk.identifiedBy,
        existingRisk.identifiedDate,
        data.related_tasks !== undefined ? data.related_tasks : existingRisk.relatedTasks,
        existingRisk.createdAt,
        new Date().toISOString()
      );

      const savedRisk = await this.riskRepository.save(updatedRisk);
      return RiskTransformer.toDTO(savedRisk);
    } catch (error) {
      console.error('Error updating risk:', error);
      throw new Error('Failed to update risk');
    }
  }

  /**
   * Supprimer un risque
   */
  async deleteRisk(riskId: string): Promise<void> {
    try {
      await this.riskRepository.delete(riskId);
    } catch (error) {
      console.error('Error deleting risk:', error);
      throw new Error('Failed to delete risk');
    }
  }

  /**
   * Calculer le niveau de risque (probability * impact)
   */
  calculateRiskLevel(probability: number, impact: number): RiskLevel {
    const score = probability * impact;
    
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.3) return 'medium';
    return 'low';
  }

  /**
   * Obtenir les statistiques des risques d'un projet
   */
  async getRiskStatistics(projectId: string): Promise<{
    total: number;
    byStatus: Record<RiskStatus, number>;
    byLevel: Record<RiskLevel, number>;
    byCategory: Record<RiskCategory, number>;
  }> {
    try {
      const risks = await this.getProjectRisks(projectId);
      
      const stats = {
        total: risks.length,
        byStatus: {
          identified: 0,
          monitored: 0,
          mitigated: 0,
          resolved: 0
        } as Record<RiskStatus, number>,
        byLevel: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        } as Record<RiskLevel, number>,
        byCategory: {
          technical: 0,
          financial: 0,
          operational: 0,
          strategic: 0,
          compliance: 0,
          safety: 0
        } as Record<RiskCategory, number>
      };

      risks.forEach(risk => {
        // Compter par statut
        stats.byStatus[risk.status]++;
        
        // Compter par niveau
        const level = this.calculateRiskLevel(risk.probability, risk.impact);
        stats.byLevel[level]++;
        
        // Compter par catégorie
        stats.byCategory[risk.category]++;
      });

      return stats;
    } catch (error) {
      console.error('Error calculating risk statistics:', error);
      throw new Error('Failed to calculate risk statistics');
    }
  }

  /**
   * Valider les données d'un risque
   */
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

    if (!RISK_CATEGORIES.includes(data.category as any)) {
      throw new Error('Invalid risk category');
    }
  }

  /**
   * Synchroniser les risques pour un projet (remplacer tous les risques)
   */
  async syncProjectRisks(projectId: string, risks: CreateRiskRequest[]): Promise<RiskDTO[]> {
    try {
      // Supprimer tous les risques existants
      const existingRisks = await this.getProjectRisks(projectId);
      await Promise.all(
        existingRisks.map(risk => this.deleteRisk(risk.id!))
      );

      // Créer les nouveaux risques
      const createdRisks = await Promise.all(
        risks.map(riskData => this.createRisk({ ...riskData, project_id: projectId }))
      );

      return createdRisks;
    } catch (error) {
      console.error('Error syncing project risks:', error);
      throw new Error('Failed to sync project risks');
    }
  }
}
