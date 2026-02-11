/**
 * Tender Reporting Service - Hexagonal Architecture
 * Business logic for tender reporting and analytics with proper error handling
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ITenderReportingRepository } from '@/domain/repositories/ITenderReportingRepository';
import { TenderDTO, TenderEstimateDTO, TenderDocumentDTO, SupplierDTO } from '@/dtos/entities/TenderDTO';
import { format, differenceInDays } from 'date-fns';
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
  private tenderReportingRepository: ITenderReportingRepository;

  constructor() {
    this.tenderReportingRepository = RepositoryFactory.getTenderReportingRepository();
  }

  /**
   * Fetch comprehensive tender data for reporting
   */
  async fetchTenderReportData(tenderId: string): Promise<TenderReportData> {
    try {
      if (!tenderId || tenderId.trim() === '') {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender ID is required');
      }

      // Fetch all tender-related data in parallel
      const [
        tenderResult,
        estimatesResult,
        documentsResult,
        suppliersResult
      ] = await Promise.all([
        this.tenderReportingRepository.getTenderById(tenderId),
        this.tenderReportingRepository.getTenderEstimates(tenderId),
        this.tenderReportingRepository.getTenderDocuments(tenderId),
        this.tenderReportingRepository.getTenderSuppliers(tenderId)
      ]);

      if (!tenderResult) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Tender not found');
      }

      const tender = this.validateAndTransformTender(tenderResult);
      const estimates = estimatesResult.map(e => this.validateAndTransformEstimate(e));
      const documents = documentsResult.map(d => this.validateAndTransformDocument(d));
      const suppliers = suppliersResult.map(s => this.validateAndTransformSupplier(s));

      // Generate timeline
      const timeline = this.generateTenderTimeline(tender);
      
      // Calculate evaluation metrics
      const evaluation = this.calculateTenderEvaluation(estimates, tender);

      return {
        tender,
        estimates,
        documents,
        suppliers,
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
      const tenders = await this.tenderReportingRepository.getAllTenders();

      if (!tenders || tenders.length === 0) {
        return this.getDefaultMetrics();
      }

      const validTenders = tenders.filter(t => t !== null);
      const totalTenders = validTenders.length;
      
      const activeTenders = validTenders.filter(t => 
        ['open', 'evaluation', 'published'].includes(t.status)
      ).length;
      
      const completedTenders = validTenders.filter(t => 
        ['awarded', 'closed'].includes(t.status)
      ).length;

      // Calculate average time to completion
      const completedWithDates = validTenders.filter(t => 
        t.status === 'awarded' && t.publication_date && t.attribution_date
      );
      
      const totalDays = completedWithDates.reduce((sum, tender) => {
        return sum + differenceInDays(
          new Date(tender.attribution_date!),
          new Date(tender.publication_date!)
        );
      }, 0);

      const averageTimeToCompletion = completedWithDates.length > 0 
        ? totalDays / completedWithDates.length 
        : 0;

      // Calculate success rate (awarded vs published)
      const publishedTenders = validTenders.filter(t => t.publication_date).length;
      const awardedTenders = validTenders.filter(t => t.status === 'awarded').length;
      const successRate = publishedTenders > 0 ? (awardedTenders / publishedTenders) * 100 : 0;

      // Calculate total value
      const totalValue = validTenders.reduce((sum, tender) => {
        const budgetMax = tender.budget_max || 0;
        const budgetMin = tender.budget_min || 0;
        return sum + ((budgetMax + budgetMin) / 2);
      }, 0);

      return {
        totalTenders,
        activeTenders,
        completedTenders,
        averageTimeToCompletion,
        successRate,
        totalValue
      };
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

      // Status-based recommendations
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
              priority: 'high',
              title: 'Définir les critères d\'évaluation',
              description: 'Établir les critères pondérés pour l\'évaluation des offres',
              actionRequired: true
            },
            {
              category: 'planning',
              priority: 'medium',
              title: 'Préparer les documents d\'appel d\'offres',
              description: 'Rédiger les documents nécessaires pour la publication',
              actionRequired: true
            },
            {
              category: 'planning',
              priority: 'low',
              title: 'Planifier la publication',
              description: 'Définir le calendrier de publication et les délais',
              actionRequired: false
            }
          );
          break;

        case 'published':
        case 'open':
          const daysUntilDeadline = reportData.tender.deadline_date 
            ? differenceInDays(new Date(reportData.tender.deadline_date), new Date())
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
          
          recommendations.push(
            {
              category: 'promotion',
              priority: 'medium',
              title: 'Promouvoir l\'appel d\'offres',
              description: 'Contacter les fournisseurs qualifiés pour augmenter la participation',
              actionRequired: true
            },
            {
              category: 'promotion',
              priority: 'medium',
              title: 'Répondre aux questions',
              description: 'Traiter rapidement les demandes de clarification des soumissionnaires',
              actionRequired: true
            },
            {
              category: 'promotion',
              priority: 'low',
              title: 'Surveiller les soumissions',
              description: 'Suivre l\'arrivée des nouvelles offres',
              actionRequired: false
            }
          );
          break;

        case 'evaluation':
          if (reportData.evaluation.totalBids === 0) {
            recommendations.push({
              category: 'evaluation',
              priority: 'high',
              title: 'Aucune offre reçue',
              description: 'Envisager une republication ou une extension de délai',
              actionRequired: true
            });
          } else if (reportData.evaluation.totalBids < 3) {
            recommendations.push({
              category: 'evaluation',
              priority: 'medium',
              title: 'Peu d\'offres reçues',
              description: 'Élargir la recherche de fournisseurs pour la prochaine fois',
              actionRequired: false
            });
          }
          
          recommendations.push(
            {
              category: 'evaluation',
              priority: 'high',
              title: 'Évaluer toutes les offres',
              description: 'Analyser chaque offre selon les critères définis',
              actionRequired: true
            },
            {
              category: 'evaluation',
              priority: 'high',
              title: 'Vérifier la conformité',
              description: 'Contrôler la conformité technique et financière des offres',
              actionRequired: true
            },
            {
              category: 'evaluation',
              priority: 'medium',
              title: 'Préparer le rapport',
              description: 'Documenter le processus d\'évaluation et les résultats',
              actionRequired: true
            }
          );
          break;

        case 'awarded':
          recommendations.push(
            {
              category: 'award',
              priority: 'high',
              title: 'Notifier les soumissionnaires',
              description: 'Informer tous les participants du résultat de l\'appel d\'offres',
              actionRequired: true
            },
            {
              category: 'award',
              priority: 'high',
              title: 'Préparer le contrat',
              description: 'Rédiger le contrat avec le fournisseur attributaire',
              actionRequired: true
            },
            {
              category: 'award',
              priority: 'low',
              title: 'Archiver la documentation',
              description: 'Organiser et archiver tous les documents de l\'appel d\'offres',
              actionRequired: false
            }
          );
          break;

        case 'closed':
          recommendations.push(
            {
              category: 'analysis',
              priority: 'medium',
              title: 'Analyser les retours',
              description: 'Recueillir les feedbacks des fournisseurs et internes',
              actionRequired: false
            },
            {
              category: 'analysis',
              priority: 'medium',
              title: 'Documenter les leçons',
              description: 'Noter les points à améliorer pour les prochains appels d\'offres',
              actionRequired: false
            },
            {
              category: 'analysis',
              priority: 'low',
              title: 'Mettre à jour les procédures',
              description: 'Améliorer les processus basés sur l\'expérience acquise',
              actionRequired: false
            }
          );
          break;
      }

      // Evaluation-based recommendations
      if (reportData.evaluation.savings > 20) {
        recommendations.push({
          category: 'analysis',
          priority: 'low',
          title: 'Excellentes économies',
          description: `Économies de ${reportData.evaluation.savings.toFixed(1)}% réalisées`,
          actionRequired: false
        });
      } else if (reportData.evaluation.savings < 5) {
        recommendations.push({
          category: 'analysis',
          priority: 'medium',
          title: 'Économies limitées',
          description: 'Analyser les facteurs ayant limité les économies',
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

  /**
   * Get default metrics
   */
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
   * Validate and transform tender data
   */
  private validateAndTransformTender(data: any): TenderDTO {
    return {
      id: data.id,
      title: data.title || '',
      description: data.description || '',
      status: data.status || 'draft',
      budget_min: data.budget_min || 0,
      budget_max: data.budget_max || 0,
      deadline_date: data.deadline_date,
      publication_date: data.publication_date,
      attribution_date: data.attribution_date,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  /**
   * Validate and transform estimate data
   */
  private validateAndTransformEstimate(data: any): TenderEstimateDTO {
    return {
      id: data.id,
      tender_id: data.tender_id,
      supplier_id: data.supplier_id,
      final_total: data.final_total || 0,
      status: data.status || 'draft',
      created_at: data.created_at,
      updated_at: data.updated_at,
      suppliers: data.suppliers
    };
  }

  /**
   * Validate and transform document data
   */
  private validateAndTransformDocument(data: any): TenderDocumentDTO {
    return {
      id: data.id,
      tender_id: data.tender_id,
      name: data.name || '',
      type: data.type || 'other',
      file_url: data.file_url,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  /**
   * Validate and transform supplier data
   */
  private validateAndTransformSupplier(data: any): SupplierDTO {
    return {
      id: data.id,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      category: data.category || 'other',
      is_active: data.is_active !== false,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  /**
   * Generate tender timeline
   */
  private generateTenderTimeline(tender: TenderDTO): TenderTimelineEvent[] {
    const timeline: TenderTimelineEvent[] = [];

    if (tender.created_at) {
      timeline.push({
        date: format(new Date(tender.created_at), 'dd/MM/yyyy', { locale: fr }),
        event: 'Création',
        status: 'completed',
        description: 'Création de l\'appel d\'offres'
      });
    }

    if (tender.publication_date) {
      timeline.push({
        date: format(new Date(tender.publication_date), 'dd/MM/yyyy', { locale: fr }),
        event: 'Publication',
        status: 'completed',
        description: 'Publication de l\'appel d\'offres'
      });
    }

    if (tender.deadline_date) {
      const isDeadlinePassed = new Date() > new Date(tender.deadline_date);
      timeline.push({
        date: format(new Date(tender.deadline_date), 'dd/MM/yyyy', { locale: fr }),
        event: 'Date limite',
        status: isDeadlinePassed ? 'completed' : 'pending',
        description: 'Date limite de soumission des offres'
      });
    }

    if (tender.attribution_date) {
      timeline.push({
        date: format(new Date(tender.attribution_date), 'dd/MM/yyyy', { locale: fr }),
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

  /**
   * Calculate tender evaluation metrics
   */
  private calculateTenderEvaluation(estimates: TenderEstimateDTO[], tender: TenderDTO): TenderEvaluation {
    if (!estimates || estimates.length === 0) {
      return {
        totalBids: 0,
        averageBid: 0,
        lowestBid: 0,
        highestBid: 0,
        savings: 0,
        evaluationScore: 0
      };
    }

    const validEstimates = estimates.filter(e => e.final_total && e.final_total > 0);
    
    if (validEstimates.length === 0) {
      return {
        totalBids: estimates.length,
        averageBid: 0,
        lowestBid: 0,
        highestBid: 0,
        savings: 0,
        evaluationScore: 0
      };
    }

    const bids = validEstimates.map(e => e.final_total);
    const totalBids = validEstimates.length;
    const averageBid = bids.reduce((sum, bid) => sum + bid, 0) / totalBids;
    const lowestBid = Math.min(...bids);
    const highestBid = Math.max(...bids);
    
    // Find recommended bid (lowest bid from active supplier)
    const recommendedBid = validEstimates
      .filter(e => e.suppliers?.is_active !== false)
      .reduce((min, current) => 
        current.final_total < min.final_total ? current : min
      );

    // Calculate savings compared to budget
    const budgetEstimate = (tender.budget_max + tender.budget_min) / 2;
    const savings = budgetEstimate > 0 ? ((budgetEstimate - lowestBid) / budgetEstimate) * 100 : 0;

    // Calculate evaluation score based on bid distribution and savings
    let evaluationScore = 0;
    if (totalBids > 0) {
      evaluationScore += Math.min(totalBids * 10, 40); // Points for number of bids
      evaluationScore += Math.min(savings, 30); // Points for savings
      evaluationScore += Math.min((highestBid - lowestBid) / averageBid * 20, 30); // Points for bid variance
    }

    return {
      totalBids,
      averageBid,
      lowestBid,
      highestBid,
      recommendedBid,
      savings: Math.max(0, savings),
      evaluationScore: Math.min(100, evaluationScore)
    };
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
