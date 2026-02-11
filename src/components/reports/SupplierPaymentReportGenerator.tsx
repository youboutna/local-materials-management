import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DollarSign, Download, Mail, Loader2, CreditCard, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { pdf } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationService } from '@/application/services/NotificationService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { getSupplierPaymentReportingService, SupplierPaymentReportingService, SupplierPaymentReportData, SupplierPaymentReportConfig as SupplierPaymentReportConfigDTO, ReportGenerationResultDTO } from '@/application/services/SupplierPaymentReportingService';
import { ReportFormatting } from '@/utils/reportFormatting';
import { SupplierPaymentPDFDocument } from './pdf/SupplierPaymentPDFDocument';
import { SupplierDTO, PaymentDTO, SupplierPaymentReportConfig, ReportGenerationResultDTO } from '@/dtos/reports/reportDTOs';

interface SupplierPaymentReportGeneratorProps {
  supplier: SupplierDTO;
  payments: PaymentDTO[];
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  onClose?: () => void;
}

interface PaymentReportConfig {
  title: string;
  reportType: 'summary' | 'detailed' | 'outstanding';
  recipientEmail?: string;
  notes?: string;
  includeDetails: boolean;
  includeBankInfo: boolean;
}

const SupplierPaymentReportGenerator: React.FC<SupplierPaymentReportGeneratorProps> = ({ 
  supplier, 
  payments, 
  dateRange, 
  onClose 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportConfig, setReportConfig] = useState<PaymentReportConfig>({
    title: `Rapport de paiements - ${supplier.name}`,
    reportType: 'summary',
    recipientEmail: supplier.email || '',
    notes: '',
    includeDetails: true,
    includeBankInfo: false,
  });

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      'paid': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'processing': 'bg-blue-100 text-blue-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const calculateTotals = () => {
    const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    // Since PaymentDTO doesn't have status, we'll use a different approach
    // Payments are considered "paid" if they have a transactionId
    const paidAmount = payments
      .filter(p => (p as any).transactionId)
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const pendingAmount = payments
      .filter(p => !(p as any).transactionId)
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const overdueAmount = 0; // Would need date comparison logic

    return { totalAmount, paidAmount, pendingAmount, overdueAmount };
  };

  const generatePaymentReportContent = () => {
    const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: fr });
    const { totalAmount, paidAmount, pendingAmount, overdueAmount } = calculateTotals();
    
    return `
      <div id="payment-report-content" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white;">
        <!-- Header -->
        <div style="border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #059669; font-size: 28px; margin: 0 0 10px 0;">${reportConfig.title}</h1>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">Période: ${format(dateRange.startDate, 'dd/MM/yyyy')} - ${format(dateRange.endDate, 'dd/MM/yyyy')}</p>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">Généré le ${currentDate}</p>
        </div>

        <!-- Supplier Information -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #10b981; padding-left: 15px;">Informations Fournisseur</h2>
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <p style="margin: 5px 0;"><strong>Nom:</strong> ${supplier.name || 'Non défini'}</p>
                <p style="margin: 5px 0;"><strong>Contact:</strong> ${supplier.contactPerson || 'Non défini'}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${supplier.email || 'Non défini'}</p>
              </div>
              <div>
                <p style="margin: 5px 0;"><strong>Téléphone:</strong> ${supplier.phone || 'Non défini'}</p>
                <p style="margin: 5px 0;"><strong>Catégorie:</strong> ${supplier.category || 'Non défini'}</p>
                <p style="margin: 5px 0;"><strong>Statut:</strong> <span style="padding: 2px 8px; border-radius: 4px; font-size: 12px; background: ${supplier.isActive ? '#dcfce7; color: #166534' : '#fee2e2; color: #991b1b'};">${supplier.isActive ? 'Actif' : 'Inactif'}</span></p>
              </div>
            </div>
            ${supplier.address ? `<p style="margin: 15px 0 5px 0;"><strong>Adresse:</strong></p><p style="margin: 5px 0;">${supplier.address}</p>` : ''}
          </div>
        </section>

        <!-- Financial Summary -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 15px;">Résumé Financier</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="color: #1d4ed8; margin: 0; font-size: 14px;">Total</h3>
              <p style="color: #1e40af; font-size: 20px; font-weight: bold; margin: 5px 0;">${totalAmount.toLocaleString('fr-FR')} MRU</p>
            </div>
            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="color: #065f46; margin: 0; font-size: 14px;">Payé</h3>
              <p style="color: #047857; font-size: 20px; font-weight: bold; margin: 5px 0;">${paidAmount.toLocaleString('fr-FR')} MRU</p>
            </div>
            <div style="background: #fffbeb; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="color: #92400e; margin: 0; font-size: 14px;">En Attente</h3>
              <p style="color: #d97706; font-size: 20px; font-weight: bold; margin: 5px 0;">${pendingAmount.toLocaleString('fr-FR')} MRU</p>
            </div>
            ${overdueAmount > 0 ? `
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="color: #991b1b; margin: 0; font-size: 14px;">En Retard</h3>
              <p style="color: #dc2626; font-size: 20px; font-weight: bold; margin: 5px 0;">${overdueAmount.toLocaleString('fr-FR')} MRU</p>
            </div>
            ` : ''}
          </div>
        </section>

        ${reportConfig.includeDetails ? `
        <!-- Payment Details -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #8b5cf6; padding-left: 15px;">Détail des Paiements</h2>
          <div style="background: #f9fafb; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; font-size: 14px; border-bottom: 1px solid #e5e7eb;">Date</th>
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; font-size: 14px; border-bottom: 1px solid #e5e7eb;">Description</th>
                  <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151; font-size: 14px; border-bottom: 1px solid #e5e7eb;">Montant</th>
                  <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #374151; font-size: 14px; border-bottom: 1px solid #e5e7eb;">Statut</th>
                </tr>
              </thead>
              <tbody>
                ${payments.map((payment, index) => `
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 12px 8px; font-size: 14px; color: #374151;">${payment.paymentDate ? format(new Date(payment.paymentDate), 'dd/MM/yyyy') : 'N/A'}</td>
                  <td style="padding: 12px 8px; font-size: 14px; color: #374151;">${payment.transactionId || `Paiement #${index + 1}`}</td>
                  <td style="padding: 12px 8px; font-size: 14px; color: #374151; text-align: right; font-weight: 500;">${payment.amount ? payment.amount.toLocaleString('fr-FR') : '0'} MRU</td>
                  <td style="padding: 12px 8px; text-align: center;">
                    <span style="padding: 2px 8px; border-radius: 4px; font-size: 12px;" class="${getPaymentStatusColor((payment as any).status || 'pending')}">${(payment as any).status || 'pending'}</span>
                  </td>
                </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </section>
        ` : ''}

        ${reportConfig.notes ? `
        <!-- Additional Notes -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #f59e0b; padding-left: 15px;">Notes</h2>
          <div style="background: #fffbeb; padding: 20px; border-radius: 8px; border: 1px solid #fbbf24;">
            <p style="margin: 0; line-height: 1.6; color: #374151;">${reportConfig.notes}</p>
          </div>
        </section>
        ` : ''}

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">Ce rapport de paiements a été généré automatiquement le ${currentDate}</p>
          <p style="margin: 5px 0 0 0;">Document confidentiel - Usage interne uniquement</p>
        </div>
      </div>
    `;
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      // Create PDF document using @react-pdf/renderer
      const pdfDocument = (
        <SupplierPaymentPDFDocument
          supplier={supplier}
          payments={payments}
          dateRange={dateRange}
          reportConfig={reportConfig}
        />
      );

      // Generate PDF blob
      const blob = await pdf(pdfDocument).toBlob();
      
      const fileName = `rapport-paiements-${supplier.name?.replace(/[^a-zA-Z0-9]/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
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
        description: "Le rapport de paiements a été téléchargé avec succès.",
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
      const notificationService = new NotificationService(RepositoryFactory.getNotificationRepository());
      
      await notificationService.sendEmail({
        to: reportConfig.recipientEmail!,
        subject: `Rapport de paiements: ${reportConfig.title}`,
        body: `Veuillez trouver ci-joint le rapport de paiements "${reportConfig.title}" pour le fournisseur ${supplier.name}. Le rapport couvre la période du ${format(dateRange.startDate, 'dd/MM/yyyy')} au ${format(dateRange.endDate, 'dd/MM/yyyy')}.`,
        html: `
          <h2>Rapport de paiements: ${reportConfig.title}</h2>
          <p>Bonjour,</p>
          <p>Veuillez trouver ci-joint le rapport de paiements pour le fournisseur <strong>${supplier.name}</strong>.</p>
          <p><strong>Période:</strong> ${format(dateRange.startDate, 'dd/MM/yyyy')} au ${format(dateRange.endDate, 'dd/MM/yyyy')}</p>
          <p><strong>Total des paiements:</strong> ${calculateTotals().totalAmount.toLocaleString('fr-FR')} MRU</p>
          <p><strong>Montants payés:</strong> ${calculateTotals().paidAmount.toLocaleString('fr-FR')} MRU</p>
          <p><strong>Montants en attente:</strong> ${calculateTotals().pendingAmount.toLocaleString('fr-FR')} MRU</p>
          <p>Ce rapport a été généré automatiquement par le système.</p>
          <br>
          <p>Cordialement,</p>
          <p>L'équipe de gestion des paiements</p>
        `,
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
          <DollarSign className="h-5 w-5" />
          Rapport de Paiements Fournisseur - {supplier.name}
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
              <Label htmlFor="reportType">Type de rapport</Label>
              <Select
                value={reportConfig.reportType}
                onValueChange={(value: 'summary' | 'detailed' | 'outstanding') => 
                  setReportConfig(prev => ({ ...prev, reportType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Résumé</SelectItem>
                  <SelectItem value="detailed">Détaillé</SelectItem>
                  <SelectItem value="outstanding">Impayés</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="recipientEmail">Email destinataire</Label>
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
                  id="includeDetails"
                  checked={reportConfig.includeDetails}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, includeDetails: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="includeDetails" className="text-sm">
                  Inclure les détails des paiements
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeBankInfo"
                  checked={reportConfig.includeBankInfo}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, includeBankInfo: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="includeBankInfo" className="text-sm">
                  Inclure les informations bancaires
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

        {/* Payment Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="font-bold text-lg">{calculateTotals().totalAmount.toLocaleString('fr-FR')} MRU</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Payé</p>
            <p className="font-bold text-lg text-green-600">{calculateTotals().paidAmount.toLocaleString('fr-FR')} MRU</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">En attente</p>
            <p className="font-bold text-lg text-yellow-600">{calculateTotals().pendingAmount.toLocaleString('fr-FR')} MRU</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Retard</p>
            <p className="font-bold text-lg text-red-600">{calculateTotals().overdueAmount.toLocaleString('fr-FR')} MRU</p>
          </div>
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

export default SupplierPaymentReportGenerator;