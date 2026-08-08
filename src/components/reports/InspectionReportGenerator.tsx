import { InspectionMetrics, InspectionReportData, getInspectionReportingService } from '@/application/services/InspectionReportingService';
import { getNotificationService } from '@/application/services/NotificationService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { InspectionDTO } from '@/dtos/entities/InspectionDTO';
import { useToast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { ReportFormatting } from '@/utils/reportFormatting';
import { pdf } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, Download, Loader2, Mail } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { InspectionPDFDocument } from './pdf/InspectionPDFDocument';

interface InspectionReportGeneratorProps {
  inspection: InspectionDTO;
  project?: {
    id: string;
    title: string;
    reference?: string;
    description?: string;
  };
  onClose?: () => void;
}

interface LocalInspectionReportConfig {
  title: string;
  recipientEmail?: string;
  notes?: string;
  includeRecommendations: boolean;
  includePhotos: boolean;
  includeMetrics: boolean;
  includeTimeline: boolean;
  includeQualityScore: boolean;
}

const InspectionReportGenerator: React.FC<InspectionReportGeneratorProps> = ({ 
  inspection, 
  project, 
  onClose 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<InspectionReportData | null>(null);
  const [metrics, setMetrics] = useState<InspectionMetrics | null>(null);
  const inspectionService = getInspectionReportingService();
  const [reportConfig, setReportConfig] = useState<LocalInspectionReportConfig>({
    title: `Rapport d'inspection - ${inspection.title || inspection.id}`,
    recipientEmail: '',
    notes: '',
    includeRecommendations: true,
    includePhotos: false,
    includeMetrics: true,
    includeTimeline: true,
    includeQualityScore: true,
  });

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const [data, projectMetrics] = await Promise.all([
          inspectionService.fetchInspectionReportData(inspection.id),
          inspectionService.calculateInspectionMetrics(project?.id)
        ]);
        setReportData(data);
        setMetrics(projectMetrics);
      } catch (error) {
        console.error('Error fetching inspection report data:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du rapport.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [inspection.id, project?.id, toast]);

  const getInspectionStatusColor = (status: string) => {
    const colors = {
      'passed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'requires_changes': 'bg-orange-100 text-orange-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const generateInspectionReportContent = () => {
    const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: fr });
    
    if (!reportData) return '';
    
    const qualityScore = inspectionService.calculateQualityScore([reportData.inspection]);
    const timeline = reportData.inspection ? inspectionService.generateInspectionTimeline([reportData.inspection]) : [];
    
    return `
      <div id="inspection-report-content" style="font-family: 'Arial', sans-serif; max-width: 170mm; margin: 0 auto; padding: 0; background: white; color: #333; line-height: 1.4;">
        ${ReportFormatting.generateSectionHeader(
          reportConfig.title,
          `Généré le ${currentDate}`,
          'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
        )}

        <!-- Inspection Overview -->
        ${ReportFormatting.generatePaginatedTable(
          [reportData.inspection],
          [
            { label: 'ID Inspection', render: (item: any) => item.id, width: '25%' },
            { label: 'Type', render: (item: any) => item.type || item.inspection_type || 'Non spécifié', width: '25%' },
            { label: 'Date', render: (item: any) => (item.scheduledDate || item.inspection_date) ? format(new Date(item.scheduledDate || item.inspection_date), 'dd/MM/yyyy') : 'Non défini', width: '25%' },
            { label: 'Statut', render: (item: any) => ReportFormatting.generateStatusBadge(item.status || 'En attente'), width: '25%' }
          ],
          { pageSize: 10, includeHeaders: true },
          'Détails de l\'Inspection'
        )}

        ${reportConfig.includeMetrics && metrics ? `
        <!-- Metrics Overview -->
        <section style="margin-bottom: 30px; page-break-inside: avoid;">
          ${ReportFormatting.generateSectionHeader('Métriques de Performance', undefined, 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)')}
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 20px;">
            ${ReportFormatting.generateMetricCard(
              'Total Inspections',
              metrics.totalInspections.toString(),
              '#3b82f6',
              '📊'
            )}
            ${ReportFormatting.generateMetricCard(
              'Inspections Réussies',
              metrics.passedInspections.toString(),
              '#10b981',
              '✅'
            )}
            ${ReportFormatting.generateMetricCard(
              'Taux de Conformité',
              ReportFormatting.formatPercentage(metrics.complianceRate),
              '#059669',
              '📈'
            )}
            ${ReportFormatting.generateMetricCard(
              'Score Moyen',
              ReportFormatting.formatPercentage(metrics.averageScore),
              '#8b5cf6',
              '🎯'
            )}
          </div>
        </section>
        ` : ''}

        ${reportConfig.includeQualityScore ? `
        <!-- Quality Score -->
        <section style="margin-bottom: 30px; page-break-inside: avoid;">
          ${ReportFormatting.generateSectionHeader('Score de Qualité', undefined, 'linear-gradient(135deg, #10b981 0%, #059669 100%)')}
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="display: inline-block; padding: 20px; background: white; border-radius: 50%; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
                <span style="font-size: 32px; font-weight: bold; color: #059669;">${qualityScore.score.toFixed(1)}%</span>
              </div>
              <p style="margin: 10px 0 5px 0; font-size: 18px; font-weight: 600; color: #065f46;">${qualityScore.grade}</p>
              <p style="margin: 0; color: #374151; line-height: 1.5;">${qualityScore.interpretation}</p>
            </div>
          </div>
        </section>
        ` : ''}

        ${reportConfig.includeTimeline && timeline.length > 0 ? `
        <!-- Inspection Timeline -->
        ${ReportFormatting.generatePaginatedTable(
          timeline,
          [
            { label: 'Date', render: (item) => item.date, width: '20%' },
            { label: 'Inspecteur', render: (item) => item.inspector, width: '25%' },
            { label: 'Statut', render: (item) => ReportFormatting.generateStatusBadge(item.status), width: '20%' },
            { label: 'Progression', render: (item) => `${item.progress}%`, width: '15%' },
            { label: 'Notes', render: (item) => item.notes, width: '20%' }
          ],
          { pageSize: 15, includeHeaders: true },
          'Chronologie des Inspections'
        )}
        ` : ''}

        <!-- Inspection Results -->
        <section style="margin-bottom: 30px; page-break-inside: avoid;">
          ${ReportFormatting.generateSectionHeader('Résultats de l\'Inspection', undefined, 'linear-gradient(135deg, #059669 0%, #10b981 100%)')}
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px;">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
              ${String(reportData.inspection.status) === 'passed' || String(reportData.inspection.status) === 'approved' ? 
                '<div style="width: 40px; height: 40px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">✓</div>' :
                '<div style="width: 40px; height: 40px; background: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">!</div>'
              }
              <div>
                <h3 style="margin: 0; color: #374151; font-size: 18px;">
                  ${String(reportData.inspection.status) === 'passed' || String(reportData.inspection.status) === 'approved' ? 'Inspection Réussie' : 
                    String(reportData.inspection.status) === 'failed' || String(reportData.inspection.status) === 'requires_changes' ? 'Inspection Échouée - Actions Requises' :
                    'Inspection en Cours'}
                </h3>
                <p style="margin: 5px 0 0 0; color: #6b7280;">Progression: ${(reportData.inspection as any).progressAtInspection || (reportData.inspection as any).progress_at_inspection || 0}%</p>
              </div>
            </div>
            
            ${(reportData.inspection as any).comments || (reportData.inspection as any).notes ? `
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <h4 style="margin: 0 0 10px 0; color: #1e40af;">Notes de l'inspecteur:</h4>
              <p style="margin: 0; line-height: 1.6; color: #374151;">${(reportData.inspection as any).comments || (reportData.inspection as any).notes}</p>
            </div>
            ` : ''}
          </div>
        </section>

        ${reportConfig.includeRecommendations && reportData.recommendations && reportData.recommendations.length > 0 ? `
        <!-- Recommendations -->
        <section style="margin-bottom: 30px; page-break-inside: avoid;">
          ${ReportFormatting.generateSectionHeader('Recommandations', undefined, 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')}
          <div style="background: #fffbeb; padding: 20px; border-radius: 8px;">
            <ul style="margin: 0; padding-left: 20px; color: #92400e; line-height: 1.6;">
              ${reportData.recommendations.map(rec => `<li style="margin-bottom: 8px;">${rec}</li>`).join('')}
            </ul>
          </div>
        </section>
        ` : ''}

        ${reportConfig.includePhotos && reportData.photos && reportData.photos.length > 0 ? `
        <!-- Photos and Documents -->
        ${ReportFormatting.generatePaginatedTable(
          reportData.photos,
          [
            { label: 'Document', render: (item: any) => item.name || item.title || item.file_name || '', width: '40%' },
            { label: 'Type', render: (item: any) => item.type || item.document_type || 'Photo', width: '20%' },
            { label: 'Date', render: (item: any) => (item.uploadedAt || item.created_at) ? format(new Date(item.uploadedAt || item.created_at), 'dd/MM/yyyy') : 'N/A', width: '20%' },
            { label: 'Taille', render: (item: any) => (item.size || item.file_size) ? `${((item.size || item.file_size) / 1024).toFixed(1)} KB` : 'N/A', width: '20%' }
          ],
          { pageSize: 10, includeHeaders: true },
          'Photos et Documents'
        )}
        ` : ''}

        ${reportConfig.notes ? `
        <!-- Additional Notes -->
        <section style="margin-bottom: 30px; page-break-inside: avoid;">
          ${ReportFormatting.generateSectionHeader('Notes Additionnelles', undefined, 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)')}
          <div style="background: #eef2ff; padding: 20px; border-radius: 8px;">
            <p style="margin: 0; line-height: 1.6; color: #374151;">${reportConfig.notes}</p>
          </div>
        </section>
        ` : ''}

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">Ce rapport d'inspection a été généré automatiquement le ${currentDate}</p>
          <p style="margin: 5px 0 0 0;">Document confidentiel - Usage interne uniquement</p>
        </div>
      </div>
    `;
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      if (!reportData) throw new Error('Données du rapport non disponibles');

      // Create PDF document using @react-pdf/renderer
      const pdfDocument = (
        <InspectionPDFDocument
          inspection={reportData.inspection}
          reportConfig={reportConfig}
          metrics={metrics}
          recommendations={reportData.recommendations}
          photos={reportData.photos}
        />
      );

      // Generate PDF blob
      const blob = await pdf(pdfDocument).toBlob();
      
      const fileName = `rapport-inspection-${inspection.id}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      return { blob, fileName };
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const { blob, fileName } = await generatePDF();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Rapport téléchargé",
        description: "Le rapport d'inspection a été téléchargé avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération du rapport.",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async () => {
    if (!reportConfig.recipientEmail) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { blob, fileName } = await generatePDF();

      // Use NotificationService to send email 
      const notificationService = getNotificationService();
      
      await notificationService.sendEmail({
        to: reportConfig.recipientEmail!,
        subject: `Rapport d'inspection: ${reportConfig.title}`,
        body: `Veuillez trouver ci-joint le rapport d'inspection "${reportConfig.title}" pour l'inspection ${inspection.id}. Le rapport a été généré le ${format(new Date(), 'dd/MM/yyyy')}.`,
        html: `
          <h2>Rapport d'inspection: ${reportConfig.title}</h2>
          <p>Bonjour,</p>
          <p>Veuillez trouver ci-joint le rapport d'inspection pour l'inspection <strong>${inspection.id}</strong>.</p>
          <p><strong>Date d'inspection:</strong> ${(inspection as any).scheduledDate || (inspection as any).inspection_date ? format(new Date((inspection as any).scheduledDate || (inspection as any).inspection_date), 'dd/MM/yyyy') : 'N/A'}</p>
          <p><strong>Type d'inspection:</strong> ${(inspection as any).type || (inspection as any).inspection_type || 'Non spécifié'}</p>
          <p><strong>Statut:</strong> ${inspection.status || 'En attente'}</p>
          <p>Ce rapport a été généré automatiquement par le système.</p>
          <br>
          <p>Cordialement,</p>
          <p>L'équipe d'inspection qualité</p>
        `
      });

      toast({
        title: "Rapport envoyé",
        description: `Le rapport a été envoyé par email à ${reportConfig.recipientEmail}.`,
      });

      setReportConfig(prev => ({ ...prev, recipientEmail: '' }));
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi du rapport par email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Génération de Rapport d'Inspection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="reportTitle">Titre du rapport</Label>
              <Input
                id="reportTitle"
                value={reportConfig.title}
                onChange={(e) => setReportConfig(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="recipientEmail">Email destinataire (optionnel)</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={reportConfig.recipientEmail}
                onChange={(e) => setReportConfig(prev => ({ ...prev, recipientEmail: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Options du rapport</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="includeRecommendations" className="text-sm">
                  Inclure les recommandations
                </Label>
                <Switch
                  id="includeRecommendations"
                  checked={reportConfig.includeRecommendations}
                  onCheckedChange={(checked) => setReportConfig(prev => ({ ...prev, includeRecommendations: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="includePhotos" className="text-sm">
                  Inclure les photos
                </Label>
                <Switch
                  id="includePhotos"
                  checked={reportConfig.includePhotos}
                  onCheckedChange={(checked) => setReportConfig(prev => ({ ...prev, includePhotos: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="includeMetrics" className="text-sm">
                  Inclure les métriques
                </Label>
                <Switch
                  id="includeMetrics"
                  checked={reportConfig.includeMetrics}
                  onCheckedChange={(checked) => setReportConfig(prev => ({ ...prev, includeMetrics: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="includeTimeline" className="text-sm">
                  Inclure la chronologie
                </Label>
                <Switch
                  id="includeTimeline"
                  checked={reportConfig.includeTimeline}
                  onCheckedChange={(checked) => setReportConfig(prev => ({ ...prev, includeTimeline: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="includeQualityScore" className="text-sm">
                  Inclure le score de qualité
                </Label>
                <Switch
                  id="includeQualityScore"
                  checked={reportConfig.includeQualityScore}
                  onCheckedChange={(checked) => setReportConfig(prev => ({ ...prev, includeQualityScore: checked }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes additionnelles</Label>
          <Textarea
            id="notes"
            value={reportConfig.notes}
            onChange={(e) => setReportConfig(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Ajoutez des notes ou commentaires pour ce rapport..."
            rows={3}
          />
        </div>

        <Separator />

        {/* Metrics Summary */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Inspections</p>
              <p className="font-bold text-lg">{metrics.totalInspections}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Réussies</p>
              <p className="font-bold text-lg text-green-600">{metrics.passedInspections}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Taux de Conformité</p>
              <p className="font-bold text-lg text-blue-600">{metrics.complianceRate.toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Score Moyen</p>
              <p className="font-bold text-lg text-purple-600">{metrics.averageScore.toFixed(1)}%</p>
            </div>
          </div>
        )}

        {/* Inspection Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Statut de l'inspection:</span>
          <Badge variant="secondary" className={getInspectionStatusColor(inspection.status as string)}>
            {inspection.status || 'En attente'}
          </Badge>
          {((inspection as any).progressAtInspection || (inspection as any).progress_at_inspection) && (
            <span className="text-sm text-muted-foreground">
              Progression: {(inspection as any).progressAtInspection || (inspection as any).progress_at_inspection}%
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={handleDownload} disabled={loading} className="flex-1">
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Télécharger PDF
          </Button>
          
          <Button 
            onClick={handleSendEmail} 
            disabled={loading || !reportConfig.recipientEmail}
            variant="outline"
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Envoyer par Email
          </Button>
          
          {onClose && (
            <Button onClick={onClose} variant="ghost">
              Fermer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InspectionReportGenerator;