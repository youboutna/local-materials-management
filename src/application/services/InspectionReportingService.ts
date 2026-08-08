/**
 * Inspection Reporting Service - Hexagonal Architecture
 * Business logic for inspection reporting and analytics
 */

import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { InspectionDTO, InspectionDocumentEntity } from '@/dtos/entities/InspectionDTO';
import { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface InspectionReportData {
  inspection: InspectionDTO;
  project?: ProjectDTO;
  documents?: InspectionDocumentEntity[];
  photos?: InspectionDocumentEntity[];
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

export class InspectionReportingService {
  private inspectionRepository: IInspectionRepository;

  constructor() {
    this.inspectionRepository = RepositoryFactory.getInspectionRepository();
  }

  async fetchInspectionReportData(inspectionId: string): Promise<InspectionReportData> {
    try {
      if (!inspectionId?.trim()) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');

      const inspectionResult = await this.inspectionRepository.findById(inspectionId);
      if (!inspectionResult) throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');

      const inspection = this.validateAndTransformInspection(inspectionResult);
      const recommendations = await this.generateRecommendations(inspection);
      const timeline = this.generateInspectionTimeline([inspection]);
      const qualityScore = this.calculateQualityScore([inspection]);

      return { inspection, documents: [], photos: [], recommendations, timeline, qualityScore };
    } catch (error) {
      console.error('Error fetching inspection report data:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch inspection report data', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async calculateInspectionMetrics(projectId?: string): Promise<InspectionMetrics> {
    try {
      const inspections = projectId 
        ? await this.inspectionRepository.findByProjectId(projectId)
        : await this.inspectionRepository.findAll();

      if (!inspections || inspections.length === 0) return this.getDefaultMetrics();

      const totalInspections = inspections.length;
      const statusStr = (i: any) => String(i.status || '').toLowerCase();
      
      const passedInspections = inspections.filter(i => ['approved', 'passed'].includes(statusStr(i))).length;
      const failedInspections = inspections.filter(i => ['rejected', 'failed'].includes(statusStr(i))).length;
      const pendingInspections = inspections.filter(i => ['pending', 'in_progress'].includes(statusStr(i))).length;
      
      const totalProgress = inspections.reduce((sum, i) => sum + (i.progressAtInspection || 0), 0);
      const averageScore = totalInspections > 0 ? totalProgress / totalInspections : 0;
      const complianceRate = totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0;

      return { totalInspections, passedInspections, failedInspections, pendingInspections, averageScore, complianceRate, averageDuration: 0, overdueInspections: 0 };
    } catch (error) {
      console.error('Error calculating inspection metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  async generateRecommendations(inspection: InspectionDTO): Promise<string[]> {
    try {
      const recommendations: InspectionRecommendation[] = [];
      if (!inspection) return [];

      const statusStr = String(inspection.status || '').toLowerCase();

      if (['failed', 'rejected', 'requires_changes', 'requireschanges'].includes(statusStr)) {
        recommendations.push(
          { category: 'quality', priority: 'high', title: 'Vérifier la conformité des travaux', description: '', actionRequired: true },
          { category: 'quality', priority: 'high', title: 'Corriger les défauts identifiés', description: '', actionRequired: true },
          { category: 'planning', priority: 'medium', title: 'Programmer une nouvelle inspection', description: '', actionRequired: true },
        );
      } else if (['pending', 'in_progress'].includes(statusStr)) {
        recommendations.push(
          { category: 'planning', priority: 'high', title: 'Finaliser l\'inspection en cours', description: '', actionRequired: true },
          { category: 'compliance', priority: 'medium', title: 'Vérifier les éléments contrôlés', description: '', actionRequired: true },
        );
      } else if (['approved', 'passed', 'completed'].includes(statusStr)) {
        recommendations.push(
          { category: 'quality', priority: 'low', title: 'Maintenir le niveau de qualité', description: '', actionRequired: false },
          { category: 'documentation', priority: 'low', title: 'Documenter les bonnes pratiques', description: '', actionRequired: false },
        );
      }

      return recommendations.sort((a, b) => {
        const p = { high: 3, medium: 2, low: 1 };
        return p[b.priority] - p[a.priority];
      }).map(r => r.title);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return ['Erreur lors de la génération des recommandations'];
    }
  }

  generateInspectionTimeline(inspections: InspectionDTO[]): InspectionTimelineEvent[] {
    try {
      return inspections
        .filter(i => i.date || i.scheduledDate)
        .sort((a, b) => new Date(a.date || a.scheduledDate || '').getTime() - new Date(b.date || b.scheduledDate || '').getTime())
        .map(i => ({
          date: format(new Date(i.date || i.scheduledDate || new Date()), 'dd/MM/yyyy', { locale: fr }),
          status: String(i.status || 'pending'),
          inspector: i.inspector || 'Non assigné',
          progress: i.progressAtInspection || i.progress || 0,
          notes: i.notes || ''
        }));
    } catch (error) {
      console.error('Error generating inspection timeline:', error);
      return [];
    }
  }

  calculateQualityScore(inspections: InspectionDTO[]): QualityScore {
    try {
      if (!inspections?.length) return { score: 0, grade: 'N/A', interpretation: 'Aucune donnée' };

      const statusStr = (i: InspectionDTO) => String(i.status || '').toLowerCase();
      const completed = inspections.filter(i => ['approved', 'passed', 'failed', 'rejected', 'completed'].includes(statusStr(i)));
      if (!completed.length) return { score: 0, grade: 'En cours', interpretation: 'Inspections en cours' };

      const passed = completed.filter(i => ['approved', 'passed', 'completed'].includes(statusStr(i))).length;
      const score = (passed / completed.length) * 100;

      let grade: string, interpretation: string;
      if (score >= 90) { grade = 'Excellent'; interpretation = 'Qualité exceptionnelle'; }
      else if (score >= 80) { grade = 'Très Bien'; interpretation = 'Bonne qualité'; }
      else if (score >= 70) { grade = 'Bien'; interpretation = 'Qualité satisfaisante'; }
      else if (score >= 60) { grade = 'Passable'; interpretation = 'Qualité acceptable'; }
      else { grade = 'Insuffisant'; interpretation = 'Actions correctives requises'; }

      return { score, grade, interpretation };
    } catch (error) {
      console.error('Error calculating quality score:', error);
      return { score: 0, grade: 'Erreur', interpretation: 'Erreur de calcul' };
    }
  }

  private getDefaultMetrics(): InspectionMetrics {
    return { totalInspections: 0, passedInspections: 0, failedInspections: 0, pendingInspections: 0, averageScore: 0, complianceRate: 0, averageDuration: 0, overdueInspections: 0 };
  }

  private validateAndTransformInspection(data: any): InspectionDTO {
    return {
      id: data.id,
      projectId: data.project_id || data.projectId,
      title: data.title || '',
      description: data.description || '',
      status: data.status || 'pending',
      type: data.type || 'routine',
      priority: data.priority || 'medium',
      progress: data.progress || data.progressAtInspection || 0,
      date: data.date,
      inspector: data.inspector?.name || data.inspector || '',
      progressAtInspection: data.progress_at_inspection || data.progressAtInspection || 0,
      notes: data.comments || data.notes || '',
      scheduledDate: data.date,
      completedAt: data.completed_at || data.completedAt,
      createdAt: data.created_at || data.createdAt,
      updatedAt: data.updated_at || data.updatedAt,
    } as InspectionDTO;
  }

  private validateAndTransformDocument(data: any): InspectionDocumentEntity {
    return {
      id: data.id,
      type: (data.type || 'report') as InspectionDocumentEntity['type'],
      name: data.name || data.file_name || '',
      url: data.url || data.file_url || '',
      uploadedAt: data.uploaded_at || data.uploadedAt || new Date().toISOString(),
      uploadedBy: data.uploaded_by || data.uploadedBy || '',
    };
  }
}

let InspectionReportingServiceInstance: InspectionReportingService | null = null;
export function getInspectionReportingService(): InspectionReportingService {
  if (!InspectionReportingServiceInstance) {
    InspectionReportingServiceInstance = new InspectionReportingService();
  }
  return InspectionReportingServiceInstance;
}
