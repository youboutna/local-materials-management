import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Mail, Loader2, PenTool, CheckCircle, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { TenderReportingService, TenderReportData } from '@/services/tenderReportingService';
import { ReportFormatting } from '@/utils/reportFormatting';

interface TenderReportGeneratorProps {
  tender: any; // Tender type from your system
  onClose?: () => void;
}

interface TenderReportConfig {
  title: string;
  includeSections: {
    overview: boolean;
    workflow: boolean;
    suppliers: boolean;
    documents: boolean;
    evaluation: boolean;
    timeline: boolean;
    signatures: boolean;
  };
  reportType: 'workflow' | 'evaluation' | 'final';
  recipientEmail?: string;
  notes?: string;
  requireSignature: boolean;
  signatoryName?: string;
  signatoryTitle?: string;
}

export function TenderReportGenerator({ tender, onClose }: TenderReportGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [reportConfig, setReportConfig] = useState<TenderReportConfig>({
    title: `Rapport d'appel d'offres - ${tender.title || tender.reference}`,
    includeSections: {
      overview: true,
      workflow: true,
      suppliers: true,
      documents: false,
      evaluation: true,
      timeline: true,
      signatures: false,
    },
    reportType: 'workflow',
    recipientEmail: '',
    notes: '',
    requireSignature: false,
    signatoryName: '',
    signatoryTitle: '',
  });

  const getStatusColor = (status: string) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'published': 'bg-blue-100 text-blue-800',
      'open': 'bg-green-100 text-green-800',
      'evaluation': 'bg-yellow-100 text-yellow-800',
      'awarded': 'bg-purple-100 text-purple-800',
      'closed': 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const generateTenderReportContent = () => {
    const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: fr });
    
    return `
      <div id="tender-report-content" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white;">
        <!-- Header -->
        <div style="border-bottom: 3px solid #7c3aed; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #7c3aed; font-size: 28px; margin: 0 0 10px 0;">${reportConfig.title}</h1>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">Généré le ${currentDate}</p>
        </div>

        ${reportConfig.includeSections.overview ? `
        <!-- Tender Overview -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #8b5cf6; padding-left: 15px;">Aperçu de l'Appel d'Offres</h2>
          <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <p style="margin: 5px 0;"><strong>Référence:</strong> ${tender.reference || 'Non défini'}</p>
                <p style="margin: 5px 0;"><strong>Titre:</strong> ${tender.title || 'Non défini'}</p>
                <p style="margin: 5px 0;"><strong>Statut:</strong> <span style="padding: 2px 8px; border-radius: 4px; font-size: 12px;" class="${getStatusColor(tender.status)}">${tender.status || 'Non défini'}</span></p>
              </div>
              <div>
                <p style="margin: 5px 0;"><strong>Budget Min:</strong> ${tender.budget_min ? `${tender.budget_min.toLocaleString('fr-FR')} MRU` : 'Non défini'}</p>
                <p style="margin: 5px 0;"><strong>Budget Max:</strong> ${tender.budget_max ? `${tender.budget_max.toLocaleString('fr-FR')} MRU` : 'Non défini'}</p>
                <p style="margin: 5px 0;"><strong>Date limite:</strong> ${tender.deadline_date ? format(new Date(tender.deadline_date), 'dd/MM/yyyy') : 'Non défini'}</p>
              </div>
            </div>
            ${tender.description ? `<p style="margin: 15px 0 5px 0;"><strong>Description:</strong></p><p style="margin: 5px 0; line-height: 1.5;">${tender.description}</p>` : ''}
          </div>
        </section>
        ` : ''}

        ${reportConfig.includeSections.workflow ? `
        <!-- Workflow Status -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #10b981; padding-left: 15px;">Statut du Workflow</h2>
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 12px; height: 12px; background: #10b981; border-radius: 50%;"></div>
                <span style="font-weight: 500;">Publication</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 12px; height: 12px; background: #3b82f6; border-radius: 50%;"></div>
                <span style="font-weight: 500;">Soumission</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 12px; height: 12px; background: #f59e0b; border-radius: 50%;"></div>
                <span style="font-weight: 500;">Évaluation</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 12px; height: 12px; background: #8b5cf6; border-radius: 50%;"></div>
                <span style="font-weight: 500;">Attribution</span>
              </div>
            </div>
            <div style="text-align: center; margin-top: 20px;">
              <p style="margin: 0; font-size: 16px; color: #374151;">Statut actuel: <strong style="color: #7c3aed;">${tender.status || 'Non défini'}</strong></p>
            </div>
          </div>
        </section>
        ` : ''}

        ${reportConfig.includeSections.timeline ? `
        <!-- Timeline -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #f59e0b; padding-left: 15px;">Calendrier</h2>
          <div style="background: #fffbeb; padding: 20px; border-radius: 8px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
              ${tender.publication_date ? `
              <div style="text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #92400e; font-weight: 500;">PUBLICATION</p>
                <p style="margin: 5px 0; font-weight: bold; color: #374151;">${format(new Date(tender.publication_date), 'dd MMM yyyy', { locale: fr })}</p>
              </div>
              ` : ''}
              ${tender.deadline_date ? `
              <div style="text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #92400e; font-weight: 500;">DATE LIMITE</p>
                <p style="margin: 5px 0; font-weight: bold; color: #374151;">${format(new Date(tender.deadline_date), 'dd MMM yyyy', { locale: fr })}</p>
              </div>
              ` : ''}
              ${tender.attribution_date ? `
              <div style="text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #92400e; font-weight: 500;">ATTRIBUTION</p>
                <p style="margin: 5px 0; font-weight: bold; color: #374151;">${format(new Date(tender.attribution_date), 'dd MMM yyyy', { locale: fr })}</p>
              </div>
              ` : ''}
            </div>
          </div>
        </section>
        ` : ''}

        ${reportConfig.includeSections.evaluation ? `
        <!-- Evaluation Criteria -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 15px;">Critères d'Évaluation</h2>
          <div style="background: #eff6ff; padding: 20px; border-radius: 8px;">
            ${tender.evaluation_criteria ? `
              <div style="display: grid; gap: 10px;">
                ${tender.evaluation_criteria.split('\n').map((criterion: string) => `
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 6px; height: 6px; background: #3b82f6; border-radius: 50%;"></div>
                    <span>${criterion}</span>
                  </div>
                `).join('')}
              </div>
            ` : '<p style="margin: 0; color: #6b7280;">Aucun critère d\'évaluation défini.</p>'}
          </div>
        </section>
        ` : ''}

        ${reportConfig.notes ? `
        <!-- Additional Notes -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #ef4444; padding-left: 15px;">Notes</h2>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #fca5a5;">
            <p style="margin: 0; line-height: 1.6;">${reportConfig.notes}</p>
          </div>
        </section>
        ` : ''}

        ${reportConfig.requireSignature && reportConfig.signatoryName ? `
        <!-- Signature Section -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #6b7280; padding-left: 15px;">Signature</h2>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #d1d5db;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
              <div>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">Nom du signataire:</p>
                <p style="margin: 5px 0; font-weight: bold; font-size: 16px;">${reportConfig.signatoryName}</p>
                ${reportConfig.signatoryTitle ? `<p style="margin: 5px 0; color: #6b7280;">${reportConfig.signatoryTitle}</p>` : ''}
              </div>
              <div style="border: 1px dashed #d1d5db; padding: 15px; text-align: center; min-height: 80px; display: flex; align-items: center; justify-content: center;">
                ${signature ? `<img src="${signature}" style="max-width: 150px; max-height: 60px;" alt="Signature" />` : '<p style="margin: 0; color: #9ca3af;">Signature requis</p>'}
              </div>
            </div>
            <div style="margin-top: 15px; text-align: right;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Date: ${currentDate}</p>
            </div>
          </div>
        </section>
        ` : ''}

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">Ce rapport d'appel d'offres a été généré automatiquement le ${currentDate}</p>
        </div>
      </div>
    `;
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      const reportHTML = generateTenderReportContent();
      
      // Create a temporary div
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = reportHTML;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-10000px';
      document.body.appendChild(tempDiv);

      // Generate canvas from HTML
      const canvas = await html2canvas(tempDiv.querySelector('#tender-report-content') as HTMLElement, {
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

      const fileName = `rapport-tender-${(tender.reference || tender.title || 'tender').replace(/[^a-zA-Z0-9]/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
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
        description: "Le rapport d'appel d'offres a été téléchargé avec succès.",
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

      // Call edge function to send email with PDF attachment
      const { error } = await supabase.functions.invoke('send-tender-report', {
        body: {
          to: reportConfig.recipientEmail,
          tenderTitle: tender.title || tender.reference,
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
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Génération de Rapport d'Appel d'Offres
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Configuration */}
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
              <Label htmlFor="reportType">Type de rapport</Label>
              <Select
                value={reportConfig.reportType}
                onValueChange={(value: 'workflow' | 'evaluation' | 'final') => 
                  setReportConfig(prev => ({ ...prev, reportType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workflow">Workflow</SelectItem>
                  <SelectItem value="evaluation">Évaluation</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select>
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
            <Label>Sections à inclure</Label>
            <div className="space-y-2">
              {Object.entries(reportConfig.includeSections).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={key}
                    checked={value}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      includeSections: {
                        ...prev.includeSections,
                        [key]: e.target.checked
                      }
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor={key} className="text-sm">
                    {key === 'overview' && 'Aperçu général'}
                    {key === 'workflow' && 'Workflow'}
                    {key === 'suppliers' && 'Fournisseurs'}
                    {key === 'documents' && 'Documents'}
                    {key === 'evaluation' && 'Évaluation'}
                    {key === 'timeline' && 'Calendrier'}
                    {key === 'signatures' && 'Signatures'}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Signature Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requireSignature"
              checked={reportConfig.requireSignature}
              onChange={(e) => setReportConfig(prev => ({ ...prev, requireSignature: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="requireSignature" className="flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Signature numérique requise
            </Label>
          </div>

          {reportConfig.requireSignature && (
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="signatoryName">Nom du signataire</Label>
                <Input
                  id="signatoryName"
                  value={reportConfig.signatoryName}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, signatoryName: e.target.value }))}
                  placeholder="Nom complet"
                />
              </div>
              <div>
                <Label htmlFor="signatoryTitle">Titre/Fonction</Label>
                <Input
                  id="signatoryTitle"
                  value={reportConfig.signatoryTitle}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, signatoryTitle: e.target.value }))}
                  placeholder="Directeur, Chef de projet..."
                />
              </div>
            </div>
          )}
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

        {/* Tender Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Statut actuel:</span>
          <Badge variant="secondary" className={getStatusColor(tender.status)}>
            {tender.status || 'Non défini'}
          </Badge>
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