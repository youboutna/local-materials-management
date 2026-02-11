/**
 * Inspection Reporting Service - Hexagonal Architecture
 * Business logic for inspection reporting and analytics with proper error handling
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { IInspectionReportingRepository } from '@/domain/repositories/IInspectionReportingRepository';
import { InspectionDTO, InspectionDocumentDTO, ProjectDTO } from '@/dtos/entities/InspectionDTO';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface InspectionReportData {
  inspection: InspectionDTO;
  project?: ProjectDTO;
  documents?: InspectionDocumentDTO[];
  photos?: InspectionDocumentDTO[];
  recommendations?: string[];
  timeline?: InspectionTimelineEvent[];
  qualityScore?: QualityScore;
}

export interface InspectionTimelineEvent {
  date: string;
  status: string;
  inspector: string;
  progress: number;
  notes: string;
}

export interface InspectionMetrics {
  totalInspections: number;
  passedInspections: number;
  failedInspections: number;
  pendingInspections: number;
  averageScore: number;
  complianceRate: number;
  averageDuration: number;
  overdueInspections: number;
}

export interface QualityScore {
  score: number;
  grade: string;
  interpretation: string;
}

export interface InspectionRecommendation {
  category: 'quality' | 'safety' | 'compliance' | 'documentation' | 'planning';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionRequired: boolean;
}

/**
 * Service for managing inspection reporting and analytics with hexagonal architecture
 */
export class InspectionReportingService {
  private inspectionReportingRepository: IInspectionReportingRepository;

  constructor() {
    this.inspectionReportingRepository = RepositoryFactory.getInspectionReportingRepository();
  }

  /**
   * Fetch comprehensive inspection data for reporting
   */
  async fetchInspectionReportData(inspectionId: string): Promise<InspectionReportData> {
    try {
      if (!inspectionId || inspectionId.trim() === '') {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');
      }

      // Fetch all inspection-related data in parallel
      const [
        inspectionResult,
        documentsResult,
        photosResult
      ] = await Promise.all([
        this.inspectionReportingRepository.getInspectionById(inspectionId),
        this.inspectionReportingRepository.getInspectionDocuments(inspectionId),
        this.inspectionReportingRepository.getInspectionPhotos(inspectionId)
      ]);

      if (!inspectionResult) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');
      }

      const inspection = this.validateAndTransformInspection(inspectionResult);
      const documents = documentsResult.map(d => this.validateAndTransformDocument(d));
      const photos = photosResult.map(p => this.validateAndTransformDocument(p));

      // Generate recommendations based on inspection status
      const recommendations = await this.generateRecommendations(inspection);

      // Generate timeline
      const timeline = this.generateInspectionTimeline([inspection]);

      // Calculate quality score
      const qualityScore = this.calculateQualityScore([inspection]);

      return {
        inspection,
        project: inspection.project,
        documents,
        photos,
        recommendations,
        timeline,
        qualityScore
      };
    } catch (error) {
      console.error('Error fetching inspection report data:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to fetch inspection report data',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Calculate inspection metrics for project overview
   */
  async calculateInspectionMetrics(projectId?: string): Promise<InspectionMetrics> {
    try {
      const inspections = await this.inspectionReportingRepository.getInspections(projectId);

      if (!inspections || inspections.length === 0) {
        return this.getDefaultMetrics();
      }

      const validInspections = inspections.filter(i => i !== null);
      const totalInspections = validInspections.length;
      
      const passedInspections = validInspections.filter(i => 
        ['approved', 'passed'].includes(i.status)
      ).length;
      
      const failedInspections = validInspections.filter(i => 
        ['rejected', 'failed'].includes(i.status)
      ).length;
      
      const pendingInspections = validInspections.filter(i => 
        ['pending', 'in_progress'].includes(i.status)
      ).length;
      
      // Calculate average score if progress data is available
      const totalProgress = validInspections.reduce((sum, inspection) => 
        sum + (inspection.progressAtInspection || 0), 0
      );
      const averageScore = totalInspections > 0 ? totalProgress / totalInspections : 0;
      
      const complianceRate = totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0;

      // Calculate average duration
      const completedInspections = validInspections.filter(i => 
        i.date && i.completedAt
      );
      const averageDuration = completedInspections.length > 0 
        ? completedInspections.reduce((sum, inspection) => {
            const duration = inspection.completedAt && inspection.date
              ? new Date(inspection.completedAt).getTime() - new Date(inspection.date).getTime()
              : 0;
            return sum + duration;
          }, 0) / completedInspections.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      // Calculate overdue inspections
      const overdueInspections = validInspections.filter(i => {
        if (!i.dueDate || ['approved', 'passed', 'rejected', 'failed'].includes(i.status)) {
          return false;
        }
        return new Date() > new Date(i.dueDate);
      }).length;

      return {
        totalInspections,
        passedInspections,
        failedInspections,
        pendingInspections,
        averageScore,
        complianceRate,
        averageDuration,
        overdueInspections
      };
    } catch (error) {
      console.error('Error calculating inspection metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Generate recommendations based on inspection status and data
   */
  async generateRecommendations(inspection: InspectionDTO): Promise<string[]> {
    try {
      const recommendations: InspectionRecommendation[] = [];

      if (!inspection) return recommendations.map(r => r.title);

      // Status-based recommendations
      switch (inspection.status) {
        case 'failed':
        case 'rejected':
        case 'requires_changes':
          recommendations.push(
            {
              category: 'quality',
              priority: 'high',
              title: 'Vérifier la conformité des travaux',
              description: 'Vérifier la conformité des travaux aux spécifications techniques',
              actionRequired: true
            },
            {
              category: 'quality',
              priority: 'high',
              title: 'Corriger les défauts identifiés',
              description: 'Corriger les défauts identifiés lors de l\'inspection',
              actionRequired: true
            },
            {
              category: 'planning',
              priority: 'medium',
              title: 'Programmer une nouvelle inspection',
              description: 'Programmer une nouvelle inspection après corrections',
              actionRequired: true
            },
            {
              category: 'documentation',
              priority: 'medium',
              title: 'Documenter les actions correctives',
              description: 'Documenter toutes les actions correctives entreprises',
              actionRequired: true
            },
            {
              category: 'safety',
              priority: 'high',
              title: 'Former l\'équipe sur les non-conformités',
              description: 'Former l\'équipe sur les points de non-conformité',
              actionRequired: true
            }
          );
          break;
        
        case 'pending':
        case 'in_progress':
          recommendations.push(
            {
              category: 'planning',
              priority: 'high',
              title: 'Finaliser l\'inspection en cours',
              description: 'Finaliser l\'inspection en cours',
              actionRequired: true
            },
            {
              category: 'compliance',
              priority: 'medium',
              title: 'Vérifier les éléments contrôlés',
              description: 'Vérifier que tous les éléments requis ont été contrôlés',
              actionRequired: true
            },
            {
              category: 'documentation',
              priority: 'medium',
              title: 'Préparer la documentation',
              description: 'Préparer la documentation nécessaire',
              actionRequired: false
            },
            {
              category: 'planning',
              priority: 'low',
              title: 'Coordonner avec l\'équipe',
              description: 'Coordonner avec l\'équipe d\'inspection',
              actionRequired: false
            }
          );
          break;
        
        case 'approved':
        case 'passed':
          recommendations.push(
            {
              category: 'quality',
              priority: 'low',
              title: 'Maintenir le niveau de qualité',
              description: 'Maintenir le niveau de qualité actuel',
              actionRequired: false
            },
            {
              category: 'documentation',
              priority: 'low',
              title: 'Documenter les bonnes pratiques',
              description: 'Documenter les bonnes pratiques observées',
              actionRequired: false
            },
            {
              category: 'planning',
              priority: 'low',
              title: 'Partager les retours d\'expérience',
              description: 'Partager les retours d\'expérience positifs avec l\'équipe',
              actionRequired: false
            },
            {
              category: 'planning',
              priority: 'medium',
              title: 'Planifier les inspections de suivi',
              description: 'Planifier les inspections de suivi si nécessaire',
              actionRequired: false
            }
          );
          break;
        
        default:
          recommendations.push(
            {
              category: 'planning',
              priority: 'high',
              title: 'Définir le statut de l\'inspection',
              description: 'Définir le statut de l\'inspection',
              actionRequired: true
            },
            {
              category: 'planning',
              priority: 'medium',
              title: 'Programmer les contrôles nécessaires',
              description: 'Programmer les contrôles nécessaires',
              actionRequired: false
            },
            {
              category: 'documentation',
              priority: 'medium',
              title: 'Préparer la documentation',
              description: 'Préparer la documentation d\'inspection',
              actionRequired: false
            }
          );
      }

      // Progress-based recommendations
      const progress = inspection.progressAtInspection || 0;
      if (progress < 25) {
        recommendations.push({
          category: 'safety',
          priority: 'medium',
          title: 'Surveillance renforcée requise',
          description: 'Surveillance renforcée requise en début de projet',
          actionRequired: false
        });
      } else if (progress > 75) {
        recommendations.push({
          category: 'quality',
          priority: 'low',
          title: 'Inspection de finition',
          description: 'Inspection de finition et contrôle qualité final',
          actionRequired: false
        });
      }

      // Sort by priority and return titles
      return recommendations
        .sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
        .map(r => r.title);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return ['Erreur lors de la génération des recommandations'];
    }
  }

  /**
   * Generate inspection timeline for reporting
   */
  generateInspectionTimeline(inspections: InspectionDTO[]): InspectionTimelineEvent[] {
    try {
      return inspections
        .filter(inspection => inspection.date)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(inspection => ({
          date: format(new Date(inspection.date), 'dd/MM/yyyy', { locale: fr }),
          status: inspection.status || 'pending',
          inspector: inspection.inspector || 'Non assigné',
          progress: inspection.progressAtInspection || 0,
          notes: inspection.comments || 'Aucune note'
        }));
    } catch (error) {
      console.error('Error generating inspection timeline:', error);
      return [];
    }
  }

  /**
   * Calculate quality score based on inspection results
   */
  calculateQualityScore(inspections: InspectionDTO[]): QualityScore {
    try {
      if (!inspections || inspections.length === 0) {
        return {
          score: 0,
          grade: 'N/A',
          interpretation: 'Aucune donnée d\'inspection disponible'
        };
      }

      const completedInspections = inspections.filter(i => 
        ['approved', 'passed', 'failed', 'rejected'].includes(i.status)
      );

      if (completedInspections.length === 0) {
        return {
          score: 0,
          grade: 'En cours',
          interpretation: 'Inspections en cours d\'évaluation'
        };
      }

      const passedInspections = completedInspections.filter(i => 
        ['approved', 'passed'].includes(i.status)
      ).length;

      const score = (passedInspections / completedInspections.length) * 100;
      
      let grade: string;
      let interpretation: string;

      if (score >= 90) {
        grade = 'Excellent';
        interpretation = 'Qualité exceptionnelle, conformité totale aux standards';
      } else if (score >= 80) {
        grade = 'Très Bien';
        interpretation = 'Bonne qualité, quelques améliorations mineures possibles';
      } else if (score >= 70) {
        grade = 'Bien';
        interpretation = 'Qualité satisfaisante, améliorations recommandées';
      } else if (score >= 60) {
        grade = 'Passable';
        interpretation = 'Qualité acceptable, surveillance renforcée nécessaire';
      } else {
        grade = 'Insuffisant';
        interpretation = 'Qualité insuffisante, actions correctives urgentes requises';
      }

      return { score, grade, interpretation };
    } catch (error) {
      console.error('Error calculating quality score:', error);
      return {
        score: 0,
        grade: 'Erreur',
        interpretation: 'Erreur lors du calcul du score de qualité'
      };
    }
  }

  // Private helper methods

  /**
   * Get default metrics
   */
  private getDefaultMetrics(): InspectionMetrics {
    return {
      totalInspections: 0,
      passedInspections: 0,
      failedInspections: 0,
      pendingInspections: 0,
      averageScore: 0,
      complianceRate: 0,
      averageDuration: 0,
      overdueInspections: 0
    };
  }

  /**
   * Validate and transform inspection data
   */
  private validateAndTransformInspection(data: any): InspectionDTO {
    return {
      id: data.id,
      projectId: data.project_id,
      title: data.title || '',
      description: data.description || '',
      status: data.status || 'pending',
      date: data.date,
      inspector: data.inspector || '',
      progressAtInspection: data.progress_at_inspection || 0,
      comments: data.comments || '',
      dueDate: data.due_date,
      completedAt: data.completed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      project: data.projects
    };
  }

  /**
   * Validate and transform document data
   */
  private validateAndTransformDocument(data: any): InspectionDocumentDTO {
    return {
      id: data.id,
      inspectionId: data.inspection_id,
      name: data.name || '',
      type: data.type || 'document',
      fileUrl: data.file_url,
      mimeType: data.mime_type,
      size: data.size || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

// Factory function for service instance
let inspectionReportingServiceInstance: InspectionReportingService | null = null;

export function getInspectionReportingService(): InspectionReportingService {
  if (!inspectionReportingServiceInstance) {
    inspectionReportingServiceInstance = new InspectionReportingService();
  }
  return inspectionReportingServiceInstance;
}
