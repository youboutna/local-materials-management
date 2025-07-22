import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface InspectionReportGeneratorProps {
  inspection: any; // Inspection type from your system
  project?: any;   // Associated project if available
  onClose?: () => void;
}

interface InspectionReportConfig {
  title: string;
  recipientEmail?: string;
  notes?: string;
  includeRecommendations: boolean;
  includePhotos: boolean;
}

export function InspectionReportGenerator({ inspection, project, onClose }: InspectionReportGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportConfig, setReportConfig] = useState<InspectionReportConfig>({
    title: `Rapport d'inspection - ${inspection.title || inspection.id}`,
    recipientEmail: '',
    notes: '',
    includeRecommendations: true,
    includePhotos: false,
  });

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
    
    return `
      <div id="inspection-report-content" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white;">
        <!-- Header -->
        <div style="border-bottom: 3px solid #dc2626; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #dc2626; font-size: 28px; margin: 0 0 10px 0;">${reportConfig.title}</h1>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">Généré le ${currentDate}</p>
        </div>

        <!-- Inspection Overview -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #ef4444; padding-left: 15px;">Détails de l'Inspection</h2>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <p style="margin: 5px 0;"><strong>ID Inspection:</strong> ${inspection.id}</p>
                <p style="margin: 5px 0;"><strong>Type:</strong> ${inspection.inspection_type || 'Non spécifié'}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${inspection.inspection_date ? format(new Date(inspection.inspection_date), 'dd/MM/yyyy') : 'Non défini'}</p>
                ${project ? `<p style="margin: 5px 0;"><strong>Projet:</strong> ${project.title}</p>` : ''}
              </div>
              <div>
                <p style="margin: 5px 0;"><strong>Statut:</strong> <span style="padding: 2px 8px; border-radius: 4px; font-size: 12px;" class="${getInspectionStatusColor(inspection.status)}">${inspection.status || 'En attente'}</span></p>
                <p style="margin: 5px 0;"><strong>Inspecteur:</strong> ${inspection.inspector_name || 'Non assigné'}</p>
                <p style="margin: 5px 0;"><strong>Progression:</strong> ${inspection.progress || 0}%</p>
              </div>
            </div>
            ${inspection.description ? `<p style="margin: 15px 0 5px 0;"><strong>Description:</strong></p><p style="margin: 5px 0; line-height: 1.5;">${inspection.description}</p>` : ''}
          </div>
        </section>

        <!-- Inspection Results -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #059669; padding-left: 15px;">Résultats</h2>
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px;">
            <div style="display: grid; gap: 15px;">
              <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: white; border-radius: 6px; border: 1px solid #d1fae5;">
                ${inspection.status === 'passed' || inspection.status === 'approved' ? 
                  '<div style="width: 20px; height: 20px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">✓</div>' :
                  '<div style="width: 20px; height: 20px; background: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">!</div>'
                }
                <span style="font-weight: 500; color: #374151;">
                  ${inspection.status === 'passed' || inspection.status === 'approved' ? 'Inspection réussie' : 
                    inspection.status === 'failed' || inspection.status === 'requires_changes' ? 'Inspection échouée - Actions requises' :
                    'Inspection en cours'}
                </span>
              </div>
              
              ${inspection.notes ? `
              <div style="background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 3px solid #3b82f6;">
                <h4 style="margin: 0 0 10px 0; color: #1e40af;">Notes de l'inspecteur:</h4>
                <p style="margin: 0; line-height: 1.5; color: #374151;">${inspection.notes}</p>
              </div>
              ` : ''}
            </div>
          </div>
        </section>

        ${reportConfig.includeRecommendations && (inspection.status === 'failed' || inspection.status === 'requires_changes') ? `
        <!-- Recommendations -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #f59e0b; padding-left: 15px;">Recommandations</h2>
          <div style="background: #fffbeb; padding: 20px; border-radius: 8px; border: 1px solid #fbbf24;">
            <div style="display: flex; align-items-start; gap: 10px; margin-bottom: 15px;">
              <div style="width: 20px; height: 20px; background: #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; margin-top: 2px;">!</div>
              <div>
                <h4 style="margin: 0 0 10px 0; color: #92400e;">Actions correctives recommandées:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                  <li style="margin-bottom: 8px;">Vérifier la conformité des travaux aux spécifications</li>
                  <li style="margin-bottom: 8px;">Corriger les défauts identifiés</li>
                  <li style="margin-bottom: 8px;">Programmer une nouvelle inspection</li>
                  <li style="margin-bottom: 8px;">Documenter les corrections apportées</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        ` : ''}

        ${reportConfig.notes ? `
        <!-- Additional Notes -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #6366f1; padding-left: 15px;">Notes Additionnelles</h2>
          <div style="background: #eef2ff; padding: 20px; border-radius: 8px; border: 1px solid #a5b4fc;">
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
      const reportHTML = generateInspectionReportContent();
      
      // Create a temporary div
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = reportHTML;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-10000px';
      document.body.appendChild(tempDiv);

      // Generate canvas from HTML
      const canvas = await html2canvas(tempDiv.querySelector('#inspection-report-content') as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      // Clean up
      document.body.removeChild(tempDiv);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `rapport-inspection-${inspection.id}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      return { pdf, fileName };
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const { pdf, fileName } = await generatePDF();
      pdf.save(fileName);
      
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
      const { pdf, fileName } = await generatePDF();
      const pdfBlob = pdf.output('blob');

      // Call edge function to send email (you would need to create this)
      const { error } = await supabase.functions.invoke('send-inspection-report', {
        body: {
          to: reportConfig.recipientEmail,
          inspectionId: inspection.id,
          reportTitle: reportConfig.title,
          pdfBlob: Array.from(new Uint8Array(await pdfBlob.arrayBuffer())),
          fileName,
        },
      });

      if (error) throw error;

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
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeRecommendations"
                  checked={reportConfig.includeRecommendations}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, includeRecommendations: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="includeRecommendations" className="text-sm">
                  Inclure les recommandations
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includePhotos"
                  checked={reportConfig.includePhotos}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, includePhotos: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="includePhotos" className="text-sm">
                  Inclure les photos (si disponibles)
                </Label>
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

        {/* Inspection Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Statut de l'inspection:</span>
          <Badge variant="secondary" className={getInspectionStatusColor(inspection.status)}>
            {inspection.status || 'En attente'}
          </Badge>
          {inspection.progress && (
            <span className="text-sm text-muted-foreground">
              Progression: {inspection.progress}%
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
}