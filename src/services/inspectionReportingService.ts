import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface InspectionReportData {
  inspection: any;
  project?: any;
  documents?: any[];
  photos?: any[];
  recommendations?: string[];
}

export interface InspectionMetrics {
  totalInspections: number;
  passedInspections: number;
  failedInspections: number;
  pendingInspections: number;
  averageScore: number;
  complianceRate: number;
}

export class InspectionReportingService {
  
  /**
   * Fetch comprehensive inspection data for reporting
   */
  static async fetchInspectionReportData(inspectionId: string): Promise<InspectionReportData> {
    try {
      const [
        inspectionResult,
        documentsResult,
        photosResult
      ] = await Promise.all([
        supabase
          .from('inspections')
          .select(`
            *,
            projects (
              id,
              title,
              project_reference,
              description
            )
          `)
          .eq('id', inspectionId)
          .single(),
        supabase
          .from('documents')
          .select('*')
          .eq('inspection_id', inspectionId),
        supabase
          .from('documents')
          .select('*')
          .eq('inspection_id', inspectionId)
          .like('mime_type', 'image%')
      ]);

      const inspection = inspectionResult.data;
      const documents = documentsResult.data || [];
      const photos = photosResult.data || [];

      // Generate recommendations based on inspection status
      const recommendations = this.generateRecommendations(inspection);

      return {
        inspection,
        project: inspection?.projects,
        documents,
        photos,
        recommendations
      };
    } catch (error) {
      console.error('Error fetching inspection report data:', error);
      throw error;
    }
  }

  /**
   * Calculate inspection metrics for project overview
   */
  static async calculateInspectionMetrics(projectId?: string): Promise<InspectionMetrics> {
    try {
      let query = supabase.from('inspections').select('*');
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data: inspections } = await query;

      if (!inspections || inspections.length === 0) {
        return {
          totalInspections: 0,
          passedInspections: 0,
          failedInspections: 0,
          pendingInspections: 0,
          averageScore: 0,
          complianceRate: 0
        };
      }

      const totalInspections = inspections.length;
      const passedInspections = inspections.filter(i => i.status === 'approved' || i.status === 'passed').length;
      const failedInspections = inspections.filter(i => i.status === 'rejected' || i.status === 'failed').length;
      const pendingInspections = inspections.filter(i => i.status === 'pending' || i.status === 'in_progress').length;
      
      // Calculate average score if progress data is available
      const totalProgress = inspections.reduce((sum, inspection) => sum + (inspection.progress_at_inspection || 0), 0);
      const averageScore = totalInspections > 0 ? totalProgress / totalInspections : 0;
      
      const complianceRate = totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0;

      return {
        totalInspections,
        passedInspections,
        failedInspections,
        pendingInspections,
        averageScore,
        complianceRate
      };
    } catch (error) {
      console.error('Error calculating inspection metrics:', error);
      return {
        totalInspections: 0,
        passedInspections: 0,
        failedInspections: 0,
        pendingInspections: 0,
        averageScore: 0,
        complianceRate: 0
      };
    }
  }

  /**
   * Generate recommendations based on inspection status and data
   */
  static generateRecommendations(inspection: any): string[] {
    const recommendations: string[] = [];
    
    if (!inspection) return recommendations;

    switch (inspection.status) {
      case 'failed':
      case 'rejected':
      case 'requires_changes':
        recommendations.push(
          'Vérifier la conformité des travaux aux spécifications techniques',
          'Corriger les défauts identifiés lors de l\'inspection',
          'Programmer une nouvelle inspection après corrections',
          'Documenter toutes les actions correctives entreprises',
          'Former l\'équipe sur les points de non-conformité'
        );
        break;
      
      case 'pending':
      case 'in_progress':
        recommendations.push(
          'Finaliser l\'inspection en cours',
          'Vérifier que tous les éléments requis ont été contrôlés',
          'Préparer la documentation nécessaire',
          'Coordonner avec l\'équipe d\'inspection'
        );
        break;
      
      case 'approved':
      case 'passed':
        recommendations.push(
          'Maintenir le niveau de qualité actuel',
          'Documenter les bonnes pratiques observées',
          'Partager les retours d\'expérience positifs avec l\'équipe',
          'Planifier les inspections de suivi si nécessaire'
        );
        break;
      
      default:
        recommendations.push(
          'Définir le statut de l\'inspection',
          'Programmer les contrôles nécessaires',
          'Préparer la documentation d\'inspection'
        );
    }

    // Add progress-based recommendations
    const progress = inspection.progress_at_inspection || 0;
    if (progress < 25) {
      recommendations.push('Surveillance renforcée requise en début de projet');
    } else if (progress > 75) {
      recommendations.push('Inspection de finition et contrôle qualité final');
    }

    return recommendations;
  }

  /**
   * Generate inspection timeline for reporting
   */
  static generateInspectionTimeline(inspections: any[]): Array<{
    date: string;
    status: string;
    inspector: string;
    progress: number;
    notes: string;
  }> {
    return inspections
      .filter(inspection => inspection.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(inspection => ({
        date: format(new Date(inspection.date), 'dd/MM/yyyy', { locale: fr }),
        status: inspection.status || 'pending',
        inspector: inspection.inspector || 'Non assigné',
        progress: inspection.progress_at_inspection || 0,
        notes: inspection.comments || 'Aucune note'
      }));
  }

  /**
   * Calculate quality score based on inspection results
   */
  static calculateQualityScore(inspections: any[]): {
    score: number;
    grade: string;
    interpretation: string;
  } {
    if (!inspections || inspections.length === 0) {
      return {
        score: 0,
        grade: 'N/A',
        interpretation: 'Aucune donnée d\'inspection disponible'
      };
    }

    const completedInspections = inspections.filter(i => 
      i.status === 'approved' || i.status === 'passed' || i.status === 'failed' || i.status === 'rejected'
    );

    if (completedInspections.length === 0) {
      return {
        score: 0,
        grade: 'En cours',
        interpretation: 'Inspections en cours d\'évaluation'
      };
    }

    const passedInspections = completedInspections.filter(i => 
      i.status === 'approved' || i.status === 'passed'
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
  }
}