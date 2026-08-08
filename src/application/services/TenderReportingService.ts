/**
 * Tender Reporting Service - Hexagonal Architecture
 * Business logic for tender reporting and analytics with proper error handling
 */

import { IReportingRepository } from '@/domain/repositories/IReportingRepository';
import { SupplierDTO } from '@/dtos/entities/SupplierDTO';
import { TenderDTO, TenderDocumentDTO } from '@/dtos/entities/TenderDTO';
import { TenderEstimateDTO } from '@/dtos/entities/TenderDTO';;
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface TenderReportData {
  tender: TenderDTO;
  estimates?: TenderEstimateDTO[];
  documents?: TenderDocumentDTO[];
  suppliers?: SupplierDTO[];
  timeline?: TenderTimelineEvent[];
  evaluation?: TenderEvaluation;
}

export interface TenderTimelineEvent {
  date: string;
  event: string;
  status: string;
  description?: string;
}

export interface TenderEvaluation {
  totalBids: number;
  averageBid: number;
  lowestBid: number;
  highestBid: number;
  recommendedBid?: TenderEstimateDTO;
  savings: number;
  evaluationScore: number;
}

export interface TenderMetrics {
  totalTenders: number;
  activeTenders: number;
  completedTenders: number;
  averageTimeToCompletion: number;
  successRate: number;
  totalValue: number;
}

export interface TenderRecommendation {
  category: 'planning' | 'promotion' | 'evaluation' | 'award' | 'analysis';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionRequired: boolean;
}

/**
 * Service for managing tender reporting and analytics with hexagonal architecture
 */
export class TenderReportingService {
  private reportingRepository: IReportingRepository;

  constructor() {
    this.reportingRepository = RepositoryFactory.getReportingRepository();
  }

  /**
   * Fetch comprehensive tender data for reporting
   */
  async fetchTenderReportData(tenderId: string): Promise<TenderReportData> {
    try {
      if (!tenderId || tenderId.trim() === '') {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender ID is required');
      }

      // Use reporting repository for tender data
      const tenderResult = await (this.reportingRepository as any).getTenderById?.(tenderId);

      if (!tenderResult) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Tender not found');
      }

      const tender = this.validateAndTransformTender(tenderResult);
      const timeline = this.generateTenderTimeline(tender);
      
      // Default evaluation
      const evaluation: TenderEvaluation = {
        totalBids: 0,
        averageBid: 0,
        lowestBid: 0,
        highestBid: 0,
        savings: 0,
        evaluationScore: 0
      };

      return {
        tender,
        timeline,
        evaluation
      };
    } catch (error) {
      console.error('Error fetching tender report data:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to fetch tender report data',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Calculate tender metrics for overview
   */
  async calculateTenderMetrics(): Promise<TenderMetrics> {
    try {
      return this.getDefaultMetrics();
    } catch (error) {
      console.error('Error calculating tender metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Generate tender recommendations
   */
  async generateTenderRecommendations(tenderId: string): Promise<TenderRecommendation[]> {
    try {
      const reportData = await this.fetchTenderReportData(tenderId);
      const recommendations: TenderRecommendation[] = [];

      switch (reportData.tender.status) {
        case 'draft':
          recommendations.push(
            {
              category: 'planning',
              priority: 'high',
              title: 'Finaliser les spécifications techniques',
              description: 'Compléter les documents techniques et les critères d\'évaluation',
              actionRequired: true
            },
            {
              category: 'planning',
              priority: 'medium',
              title: 'Préparer les documents d\'appel d\'offres',
              description: 'Rédiger les documents nécessaires pour la publication',
              actionRequired: true
            }
          );
          break;

        case 'published':
        case 'open':
          const daysUntilDeadline = reportData.tender.deadlineDate 
            ? differenceInDays(new Date(reportData.tender.deadlineDate), new Date())
            : 0;
          
          if (daysUntilDeadline < 7) {
            recommendations.push({
              category: 'promotion',
              priority: 'high',
              title: 'Date limite proche',
              description: `Il ne reste que ${daysUntilDeadline} jours avant la date limite`,
              actionRequired: true
            });
          }
          
          recommendations.push({
            category: 'promotion',
            priority: 'medium',
            title: 'Promouvoir l\'appel d\'offres',
            description: 'Contacter les fournisseurs qualifiés pour augmenter la participation',
            actionRequired: true
          });
          break;

        case 'awarded':
          recommendations.push({
            category: 'award',
            priority: 'high',
            title: 'Notifier les soumissionnaires',
            description: 'Informer tous les participants du résultat de l\'appel d\'offres',
            actionRequired: true
          });
          break;

        case 'closed':
          recommendations.push({
            category: 'analysis',
            priority: 'medium',
            title: 'Analyser les retours',
            description: 'Recueillir les feedbacks des fournisseurs et internes',
            actionRequired: false
          });
          break;
      }

      // Evaluation-based recommendations
      if (reportData.evaluation) {
        if (reportData.evaluation.savings > 20) {
          recommendations.push({
            category: 'analysis',
            priority: 'low',
            title: 'Excellentes économies',
            description: `Économies de ${reportData.evaluation.savings.toFixed(1)}% réalisées`,
            actionRequired: false
          });
        }

        if (reportData.evaluation.totalBids > 5) {
          recommendations.push({
            category: 'analysis',
            priority: 'low',
            title: 'Forte concurrence',
            description: `${reportData.evaluation.totalBids} offres reçues - excellent résultat`,
            actionRequired: false
          });
        }
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating tender recommendations:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to generate tender recommendations',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // Private helper methods

  private getDefaultMetrics(): TenderMetrics {
    return {
      totalTenders: 0,
      activeTenders: 0,
      completedTenders: 0,
      averageTimeToCompletion: 0,
      successRate: 0,
      totalValue: 0
    };
  }

  /**
   * Validate and transform tender data - camelCase DTO output
   */
  private validateAndTransformTender(data: any): TenderDTO {
    return {
      id: data.id,
      title: data.title || '',
      description: data.description || '',
      status: data.status || 'draft',
      budgetMin: data.budgetMin ?? data.budget_min ?? 0,
      budgetMax: data.budgetMax ?? data.budget_max ?? 0,
      deadlineDate: data.deadlineDate ?? data.deadline_date ?? null,
      publicationDate: data.publicationDate ?? data.publication_date ?? null,
      attributionDate: data.attributionDate ?? data.attribution_date ?? null,
      createdAt: data.createdAt ?? data.created_at ?? '',
      updatedAt: data.updatedAt ?? data.updated_at ?? '',
      projectId: data.projectId ?? data.project_id ?? null,
      tenderNumber: data.tenderNumber ?? data.tender_number ?? null,
      selectionMode: data.selectionMode ?? null,
      marketType: data.marketType ?? null,
      financingSource: data.financingSource ?? null,
      projectReference: data.projectReference ?? null,
      submissionDeadline: data.submissionDeadline ?? null,
      launchDate: data.launchDate ?? null,
      estimatedValue: data.estimatedValue ?? null,
      contractDuration: data.contractDuration ?? null,
      evaluationCriteria: data.evaluationCriteria ?? [],
      eligibilityRequirements: data.eligibilityRequirements ?? [],
      evaluationDeadline: data.evaluationDeadline ?? null,
      awardCriteria: data.awardCriteria ?? null,
      currentPhase: data.currentPhase ?? null,
      currentStage: data.currentStage ?? null,
      tenderCategory: data.tenderCategory ?? null,
      procurementType: data.procurementType ?? null,
      weight: data.weight ?? null
    };
  }

  /**
   * Generate tender timeline - uses camelCase DTO properties
   */
  private generateTenderTimeline(tender: TenderDTO): TenderTimelineEvent[] {
    const timeline: TenderTimelineEvent[] = [];

    if (tender.createdAt) {
      timeline.push({
        date: format(new Date(tender.createdAt), 'dd/MM/yyyy', { locale: fr }),
        event: 'Création',
        status: 'completed',
        description: 'Création de l\'appel d\'offres'
      });
    }

    if (tender.publicationDate) {
      timeline.push({
        date: format(new Date(tender.publicationDate), 'dd/MM/yyyy', { locale: fr }),
        event: 'Publication',
        status: 'completed',
        description: 'Publication de l\'appel d\'offres'
      });
    }

    if (tender.deadlineDate) {
      const isDeadlinePassed = new Date() > new Date(tender.deadlineDate);
      timeline.push({
        date: format(new Date(tender.deadlineDate), 'dd/MM/yyyy', { locale: fr }),
        event: 'Date limite',
        status: isDeadlinePassed ? 'completed' : 'pending',
        description: 'Date limite de soumission des offres'
      });
    }

    if (tender.attributionDate) {
      timeline.push({
        date: format(new Date(tender.attributionDate), 'dd/MM/yyyy', { locale: fr }),
        event: 'Attribution',
        status: 'completed',
        description: 'Attribution du marché'
      });
    }

    return timeline.sort((a, b) => 
      new Date(a.date.split('/').reverse().join('-')).getTime() - 
      new Date(b.date.split('/').reverse().join('-')).getTime()
    );
  }
}

// Factory function for service instance
let tenderReportingServiceInstance: TenderReportingService | null = null;

export function getTenderReportingService(): TenderReportingService {
  if (!tenderReportingServiceInstance) {
    tenderReportingServiceInstance = new TenderReportingService();
  }
  return tenderReportingServiceInstance;
}
