import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFDocument, PDFSection, PDFCard, PDFRow, PDFCol, PDFText, PDFTable, PDFMetricCard } from './PDFDocument';
import { InspectionMetrics } from '@/application/services/InspectionReportingService';

interface InspectionPDFDocumentProps {
  inspection: any;
  reportConfig: {
    title: string;
    includeRecommendations: boolean;
    includePhotos: boolean;
    includeMetrics: boolean;
    includeTimeline: boolean;
    includeQualityScore: boolean;
    notes?: string;
  };
  metrics?: InspectionMetrics | null;
  recommendations?: string[];
  photos?: any[];
}

export function InspectionPDFDocument({
  inspection,
  reportConfig,
  metrics,
  recommendations,
  photos
}: InspectionPDFDocumentProps) {
  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'passed': 'Réussie',
      'failed': 'Échouée',
      'pending': 'En attente',
      'in_progress': 'En cours',
      'approved': 'Approuvée',
      'requires_changes': 'Modifications requises'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'passed': '#10b981',
      'failed': '#ef4444',
      'pending': '#f59e0b',
      'in_progress': '#3b82f6',
      'approved': '#10b981',
      'requires_changes': '#f97316'
    };
    return colorMap[status] || '#6b7280';
  };

  const calculateQualityScore = () => {
    // Simple quality score calculation based on status and progress
    if (inspection.status === 'passed' || inspection.status === 'approved') {
      return { score: 95, grade: 'Excellent', interpretation: 'Inspection complète et conforme' };
    } else if (inspection.status === 'requires_changes') {
      return { score: 70, grade: 'Satisfaisant', interpretation: 'Inspection globalement correcte avec quelques améliorations' };
    } else if (inspection.status === 'failed') {
      return { score: 40, grade: 'Insuffisant', interpretation: 'Inspection non conforme, actions correctives requises' };
    } else {
      return { score: 60, grade: 'En cours', interpretation: 'Inspection en cours d\'évaluation' };
    }
  };

  const qualityScore = calculateQualityScore();

  return (
    <PDFDocument
      title={reportConfig.title}
      subtitle={`Inspection ${inspection.id} - ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`}
    >
      {/* Inspection Overview */}
      <PDFSection title="Détails de l'Inspection" borderColor="#dc2626">
        <PDFCard>
          <PDFRow>
            <PDFCol>
              <PDFText label="ID Inspection" value={inspection.id} />
              <PDFText label="Type" value={inspection.inspection_type || 'Non spécifié'} />
              <PDFText label="Date" value={inspection.inspection_date ? format(new Date(inspection.inspection_date), 'dd/MM/yyyy') : 'Non défini'} />
            </PDFCol>
            <PDFCol>
              <PDFText label="Statut" value={getStatusText(inspection.status)} />
              <PDFText label="Progression" value={`${inspection.progress_at_inspection || 0}%`} />
              <PDFText label="Inspecteur" value={inspection.inspector_name || 'Non assigné'} />
            </PDFCol>
          </PDFRow>
        </PDFCard>
      </PDFSection>

      {/* Metrics Overview */}
      {reportConfig.includeMetrics && metrics && (
        <PDFSection title="Métriques de Performance" borderColor="#3b82f6">
          <PDFRow>
            <PDFMetricCard
              title="Total Inspections"
              value={metrics.totalInspections.toString()}
              color="#3b82f6"
            />
            <PDFMetricCard
              title="Inspections Réussies"
              value={metrics.passedInspections.toString()}
              color="#10b981"
            />
            <PDFMetricCard
              title="Taux de Conformité"
              value={`${metrics.complianceRate.toFixed(1)}%`}
              color="#059669"
            />
            <PDFMetricCard
              title="Score Moyen"
              value={`${metrics.averageScore.toFixed(1)}%`}
              color="#8b5cf6"
            />
          </PDFRow>
        </PDFSection>
      )}

      {/* Quality Score */}
      {reportConfig.includeQualityScore && (
        <PDFSection title="Score de Qualité" borderColor="#10b981">
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText label="Score" value={`${qualityScore.score}%`} />
                <PDFText label="Évaluation" value={qualityScore.grade} />
              </PDFCol>
              <PDFCol>
                <PDFText label="Interprétation" value={qualityScore.interpretation} />
              </PDFCol>
            </PDFRow>
          </PDFCard>
        </PDFSection>
      )}

      {/* Inspection Results */}
      <PDFSection title="Résultats de l'Inspection" borderColor="#059669">
        <PDFCard>
          <PDFRow>
            <PDFCol>
              <PDFText label="Statut final" value={getStatusText(inspection.status)} />
              <PDFText label="Progression" value={`${inspection.progress_at_inspection || 0}%`} />
            </PDFCol>
            <PDFCol>
              <PDFText label="Date d'inspection" value={inspection.inspection_date ? format(new Date(inspection.inspection_date), 'dd/MM/yyyy HH:mm') : 'Non défini'} />
            </PDFCol>
          </PDFRow>
          
          {inspection.comments && (
            <PDFRow>
              <PDFCol>
                <PDFText label="Commentaires de l'inspecteur" value={inspection.comments} />
              </PDFCol>
            </PDFRow>
          )}
        </PDFCard>
      </PDFSection>

      {/* Recommendations */}
      {reportConfig.includeRecommendations && recommendations && recommendations.length > 0 && (
        <PDFSection title="Recommandations" borderColor="#f59e0b">
          <PDFCard>
            {recommendations.map((rec, index) => (
              <PDFText key={index} label={`${index + 1}.`} value={rec} />
            ))}
          </PDFCard>
        </PDFSection>
      )}

      {/* Photos and Documents */}
      {reportConfig.includePhotos && photos && photos.length > 0 && (
        <PDFSection title="Photos et Documents" borderColor="#8b5cf6">
          <PDFTable
            headers={['Document', 'Type', 'Date', 'Taille']}
            data={photos.map(photo => [
              photo.title || photo.file_name || 'Document',
              photo.document_type || 'Photo',
              photo.created_at ? format(new Date(photo.created_at), 'dd/MM/yyyy') : 'N/A',
              photo.file_size ? `${(photo.file_size / 1024).toFixed(1)} KB` : 'N/A'
            ])}
            columnWidths={['40%', '20%', '20%', '20%']}
          />
        </PDFSection>
      )}

      {/* Additional Notes */}
      {reportConfig.notes && (
        <PDFSection title="Notes Additionnelles" borderColor="#6366f1">
          <PDFCard>
            <PDFText label="" value={reportConfig.notes} />
          </PDFCard>
        </PDFSection>
      )}
    </PDFDocument>
  );
}