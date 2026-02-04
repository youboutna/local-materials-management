/**
 * RiskService - Service hexagonal pour la gestion des risques
 * Respecte l'architecture hexagonale : Service → Repository → Adapter → Supabase
 */

import { Risk } from '@/domain/entities/Risk';
import { RiskStatus, RiskLevel, RiskCategory } from '@/domain/entities/RiskTypesExport';
import { IRiskRepository } from '@/domain/repositories/IRiskRepository';
import { RiskTransformer } from '@/dtos/transforms/RiskTransformer';
import { 
  RiskDTO,
  CreateRiskRequestDTO,
  UpdateRiskRequestDTO,
  RiskCategory,
  RiskCategory,
  RiskCategory,
  RiskStatus
} from '@/dtos/entities/RiskDTO';


export class RiskService {
  private riskRepository: IRiskRepository;

  constructor(private riskRepository: IRiskRepository) {}

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
  async createRisk(data: CreateRiskRequestDTO): Promise<RiskDTO> {
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
        RiskStatus.IDENTIFIED, // Status par défaut
        data.category,
        data.mitigation_strategy || null,
        data.identified_by ? { id: data.identified_by, fullName: '' } : null,
        new Date().toISOString(),
        [],
        new Date().toISOString(),
        new Date().toISOString()
      );

      // Sauvegarde via le repository (save returns void)
      await this.riskRepository.save(risk);
      // Return the risk we created since save doesn't return it
      return RiskTransformer.toDTO(risk);
    } catch (error) {
      console.error('Error creating risk:', error);
      throw new Error('Failed to create risk');
    }
  }

  /**
   * Mettre à jour un risque
   */
  async updateRisk(riskId: string, data: UpdateRiskRequestDTO): Promise<RiskDTO> {
    try {
      const existingRisk = await this.riskRepository.findById(riskId);
      if (!existingRisk) {
        throw new Error('Risk not found');
      }

      // Validate status transition if status is being updated
      if (data.status && !this.isValidStatusTransition(existingRisk.status as RiskStatus, data.status as RiskStatus)) {
        throw new Error(`Invalid status transition from ${existingRisk.status} to ${data.status}`);
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

      // save returns void, so we return the updated risk entity
      await this.riskRepository.save(updatedRisk);
      return RiskTransformer.toDTO(updatedRisk);
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
          [RiskStatus.IDENTIFIED]: 0,
          [RiskStatus.MONITORED]: 0,
          [RiskStatus.MITIGATED]: 0,
          [RiskStatus.RESOLVED]: 0
        } as Record<RiskStatus, number>,
        byLevel: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        } as Record<RiskLevel, number>,
        byCategory: {
          [RiskCategory.TECHNICAL]: 0,
          [RiskCategory.FINANCIAL]: 0,
          [RiskCategory.OPERATIONAL]: 0,
          [RiskCategory.STRATEGIC]: 0,
          [RiskCategory.COMPLIANCE]: 0,
          [RiskCategory.SAFETY]: 0
        } as Record<RiskCategory, number>
      };

      risks.forEach(risk => {
        // Compter par statut
        stats.byStatus[risk.status as RiskStatus]++;
        
        // Compter par niveau
        const level = this.calculateRiskLevel(risk.probability, risk.impact);
        stats.byLevel[level]++;
        
        // Compter par catégorie
        stats.byCategory[risk.category as RiskCategory]++;
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
  private validateRiskData(data: CreateRiskRequestDTO | UpdateRiskRequestDTO): void {
    if ('title' in data && (!data.title || data.title.trim().length === 0)) {
      throw new Error('Risk title is required');
    }

    if ('probability' in data && (data.probability < 0 || data.probability > 1)) {
      throw new Error('Probability must be between 0 and 1');
    }

    if ('impact' in data && (data.impact < 0 || data.impact > 1)) {
      throw new Error('Impact must be between 0 and 1');
    }

    if ('category' in data && !Object.values(RiskCategory).includes(data.category as RiskCategory)) {
      throw new Error(`Invalid risk category: ${data.category}`);
    }

    if ('status' in data && data.status && !Object.values(RiskStatus).includes(data.status as RiskStatus)) {
      throw new Error(`Invalid risk status: ${data.status}`);
    }
  }

  /**
   * Synchroniser les risques pour un projet (remplacer tous les risques)
   */
  async syncProjectRisks(projectId: string, risks: CreateRiskRequestDTO[]): Promise<RiskDTO[]> {
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

  /**
   * Add status transition validation
   */
  private isValidStatusTransition(current: RiskStatus, next: RiskStatus): boolean {
    const validTransitions: Record<RiskStatus, RiskStatus[]> = {
      [RiskStatus.IDENTIFIED]: [RiskStatus.MONITORED, RiskStatus.MITIGATED, RiskStatus.RESOLVED],
      [RiskStatus.MONITORED]: [RiskStatus.MITIGATED, RiskStatus.RESOLVED],
      [RiskStatus.MITIGATED]: [RiskStatus.RESOLVED],
      [RiskStatus.RESOLVED]: []
    };
    return validTransitions[current].includes(next);
  }
}
