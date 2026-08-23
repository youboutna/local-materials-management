import { CommunicationService } from '@/application/services/CommunicationService';
import { blobToBase64 } from '@/utils/fileEncoding';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { TenderDTO } from '@/dtos/entities/TenderDTO';
import { TenderEstimateDTO, TenderEstimateItemDTO } from '@/dtos/entities/TenderEstimateDTO';
import { EstimateData, EstimateItem, ExportConfig } from '@/dtos/transforms/shared';
import { useToast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { pdf } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, FileDown, Loader2, Mail, Upload } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { DevisPDFDocument } from './pdf/DevisPDFDocument';
import { formatNumber2 } from '@/utils/reportNumbers';
import { T } from '@/components/i18n/T';

// Mapping functions for type compatibility
const mapTenderEstimateToEstimateData = (tenderEstimate: TenderEstimateDTO): EstimateData => {
  const estimate = tenderEstimate as unknown as Record<string, unknown>;
  return {
    id: tenderEstimate.id,
    tender_id: estimate.tender_id as string,
    estimate_type: estimate.estimate_type as string || 'quantitative',
    total_materials_cost: (estimate.total_materials_cost as number | null | undefined) || 0,
    total_labor_cost: (estimate.total_labor_cost as number | null | undefined) || 0,
    total_equipment_cost: (estimate.total_equipment_cost as number | null | undefined) || 0,
    subtotal: (estimate.subtotal as number | null | undefined) || 0,
    tax_rate: (estimate.tax_rate as number | null | undefined) || 0,
    tax_amount: (estimate.tax_amount as number | null | undefined) || 0,
    total_with_tax: (estimate.total_with_tax as number | null | undefined) || 0,
    overhead_percentage: (estimate.overhead_percentage as number | null | undefined) || 0,
    overhead_amount: (estimate.overhead_amount as number | null | undefined) || 0,
    profit_margin_percentage: (estimate.profit_margin_percentage as number | null | undefined) || 0,
    profit_margin_amount: (estimate.profit_margin_amount as number | null | undefined) || 0,
    final_total: (estimate.final_total as number | null | undefined) || 0,
    currency: tenderEstimate.currency || 'MRU',
    status: tenderEstimate.status,
    created_at: (estimate.created_at as string)
  };
};

const mapTenderEstimateItemToEstimateItem = (item: TenderEstimateItemDTO): EstimateItem => {
  const itemRecord = item as unknown as Record<string, unknown>;
  return {
    id: item.id,
    material_id: (itemRecord.material_id as string | undefined) || '',
    quantity: item.quantity,
    unit_price: (itemRecord.unit_price as number),
    total_price: (itemRecord.total_price as number),
    description: item.description,
    item_type: (itemRecord.item_type as string | undefined) || 'material'
  };
};

interface QuantitativeEstimateExporterProps {
  estimate: TenderEstimateDTO;
  estimateItems: TenderEstimateItemDTO[];
  tender: TenderDTO;
  company?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
}

export function QuantitativeEstimateExporter({ 
  estimate, 
  estimateItems, 
  tender, 
  company = {
    name: 'Votre Entreprise',
    address: '123 Rue Exemple, Nouakchott, Mauritanie',
    phone: '+222 XX XX XX XX',
    email: 'contact@votreentreprise.mr'
  }
}: QuantitativeEstimateExporterProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [isSignatureSigned, setIsSignatureSigned] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    title: `Devis Quantitatif Estimatif - ${tender?.title || tender?.projectReference || 'Appel d\'Offres'}`,
    includeCompanyHeader: true,
    includeItemDetails: true,
    includePriceBreakdown: true,
    includeTermsConditions: true,
    includeSignature: false,
    termsConditions: `CONDITIONS GÉNÉRALES:
1. Validité de l'offre: ${30} jours à compter de la date d'émission
2. Délai de livraison: À définir selon cahier des charges
3. Modalités de paiement: Selon contrat
4. Prix fermes et définitifs, hors révision exceptionnelle
5. Conformité aux normes et réglementations en vigueur`,
    recipientEmail: '',
    notes: '',
    signatoryName: '',
    signatoryTitle: 'Directeur Technique',
    validityPeriod: 30
  });

  // Signature drawing functionality
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL());
      setIsSignatureSigned(true);
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignature('');
        setIsSignatureSigned(false);
      }
    }
  };

  const uploadSignature = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSignature(result);
        setIsSignatureSigned(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateTotals = () => {
    const materialsCost = estimateItems
      .filter(item => item.itemType === 'material')
      .reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    
    const laborCost = estimateItems
      .filter(item => item.itemType === 'labor')
      .reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    
    const equipmentCost = estimateItems
      .filter(item => item.itemType === 'equipment')
      .reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    const otherCost = estimateItems
      .filter(item => item.itemType === 'other')
      .reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    const subtotal = materialsCost + laborCost + equipmentCost + otherCost;
    const taxAmount = subtotal * (estimate.taxRate || 0) / 100;
    const totalWithTax = subtotal + taxAmount;
    const overheadAmount = totalWithTax * (estimate.overheadPercentage || 0) / 100;
    const profitAmount = (totalWithTax + overheadAmount) * (estimate.profitMarginPercentage || 0) / 100;
    const finalTotal = totalWithTax + overheadAmount + profitAmount;

    return {
      materialsCost,
      laborCost,
      equipmentCost,
      otherCost,
      subtotal,
      taxAmount,
      totalWithTax,
      overheadAmount,
      profitAmount,
      finalTotal
    };
  };

  const generateEstimateContent = () => {
    const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: fr });
    const validUntilDate = format(new Date(Date.now() + exportConfig.validityPeriod * 24 * 60 * 60 * 1000), 'dd MMMM yyyy', { locale: fr });
    const totals = calculateTotals();
    
    return `
      <div id="estimate-content" style="font-family: 'Arial', sans-serif; max-width: 170mm; margin: 0 auto; padding: 0; background: white; color: #333; line-height: 1.4;">
        ${exportConfig.includeCompanyHeader ? `
        <!-- Company Header -->
        <section class="page-break-section" style="border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <h1 style="color: #2563eb; font-size: 24px; margin: 0 0 10px 0; font-weight: bold;">${company.name}</h1>
              <p style="margin: 2px 0; font-size: 14px; color: #666;">${company.address}</p>
              <p style="margin: 2px 0; font-size: 14px; color: #666;">Tél: ${company.phone}</p>
              <p style="margin: 2px 0; font-size: 14px; color: #666;">Email: ${company.email}</p>
            </div>
            ${company.logo ? `<img src="${company.logo}" style="max-height: 80px; max-width: 150px;" alt="Logo" />` : ''}
          </div>
        </section>
        ` : ''}

        <!-- Document Title -->
        <section class="page-break-section" style="text-align: center; margin-bottom: 30px; page-break-inside: avoid;">
          <h2 style="color: #2563eb; font-size: 22px; margin: 0 0 10px 0; font-weight: bold;">${exportConfig.title}</h2>
          <p style="color: #666; margin: 0; font-size: 14px;">N° de référence: ${estimate.id || 'DRAFT'}</p>
          <p style="color: #666; margin: 0; font-size: 14px;">Date d'émission: ${currentDate}</p>
          <p style="color: #666; margin: 0; font-size: 14px;">Valide jusqu'au: ${validUntilDate}</p>
        </section>

        <!-- Tender Information -->
        <section class="page-break-section" style="margin-bottom: 25px; page-break-inside: avoid;">
          <h3 style="color: #374151; font-size: 18px; margin-bottom: 15px; border-left: 4px solid #2563eb; padding-left: 15px;"><T k="auto.quantitativeestimateexporter.informations_appel_d_offres" fallback="Informations Appel d'Offres" /></h3>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p style="margin: 5px 0;"><strong><T k="auto.quantitativeestimateexporter.titre" fallback="Titre:" /></strong> ${tender?.title || 'Non défini'}</p>
            <p style="margin: 5px 0;"><strong><T k="auto.quantitativeestimateexporter.reference" fallback="Référence:" /></strong> ${tender?.projectReference || 'Non défini'}</p>
            ${tender?.description ? `<p style="margin: 5px 0;"><strong><T k="auto.quantitativeestimateexporter.description" fallback="Description:" /></strong> ${tender.description}</p>` : ''}
          </div>
        </section>

        ${exportConfig.includeItemDetails && estimateItems.length > 0 ? `
        <!-- Detailed Items -->
        <section class="page-break-section" style="margin-bottom: 25px;">
          <h3 style="color: #374151; font-size: 18px; margin-bottom: 15px; border-left: 4px solid #2563eb; padding-left: 15px;"><T k="auto.quantitativeestimateexporter.detail_des_postes" fallback="Détail des Postes" /></h3>
          <div style="page-break-inside: avoid;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; page-break-inside: auto;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; font-weight: bold;"><T k="auto.quantitativeestimateexporter.description" fallback="Description" /></th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; font-weight: bold;"><T k="auto.quantitativeestimateexporter.type" fallback="Type" /></th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; font-weight: bold;"><T k="auto.quantitativeestimateexporter.qte" fallback="Qté" /></th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 12px; font-weight: bold;">P.U. (${estimate.currency})</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 12px; font-weight: bold;">Total (${estimate.currency})</th>
                </tr>
              </thead>
              <tbody>
                ${estimateItems.map((item, index) => `
                  <tr style="page-break-inside: avoid; ${index % 2 === 0 ? 'background: #fafafa;' : ''}">
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 11px; vertical-align: top;">${item.description || ''}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 11px; vertical-align: top;">
                      <span style="background: ${item.itemType === 'material' ? '#e3f2fd' : item.itemType === 'labor' ? '#f3e5f5' : item.itemType === 'equipment' ? '#e8f5e8' : '#fff3e0'}; 
                                   color: ${item.itemType === 'material' ? '#1976d2' : item.itemType === 'labor' ? '#7b1fa2' : item.itemType === 'equipment' ? '#388e3c' : '#f57c00'}; 
                                   padding: 2px 6px; border-radius: 4px; font-size: 10px;">${item.itemType || 'autre'}</span>
                    </td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 11px; vertical-align: top;">${item.quantity || 0}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 11px; vertical-align: top;">${formatNumber2((item.unitPrice || 0))}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 11px; font-weight: bold; vertical-align: top;">${formatNumber2((item.totalPrice || 0))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </section>
        ` : ''}

        ${exportConfig.includePriceBreakdown ? `
        <!-- Price Breakdown -->
        <section class="page-break-section" style="margin-bottom: 25px; page-break-inside: avoid;">
          <h3 style="color: #374151; font-size: 18px; margin-bottom: 15px; border-left: 4px solid #2563eb; padding-left: 15px;"><T k="auto.quantitativeestimateexporter.recapitulatif_financier" fallback="Récapitulatif Financier" /></h3>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; border-bottom: 1px solid #ddd;"><strong><T k="auto.quantitativeestimateexporter.materiaux" fallback="Matériaux:" /></strong></td>
                <td style="padding: 5px 0; text-align: right; border-bottom: 1px solid #ddd;">${formatNumber2(totals.materialsCost)} ${estimate.currency}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; border-bottom: 1px solid #ddd;"><strong>Main-d'œuvre:</strong></td>
                <td style="padding: 5px 0; text-align: right; border-bottom: 1px solid #ddd;">${formatNumber2(totals.laborCost)} ${estimate.currency}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; border-bottom: 1px solid #ddd;"><strong><T k="auto.quantitativeestimateexporter.equipement" fallback="Équipement:" /></strong></td>
                <td style="padding: 5px 0; text-align: right; border-bottom: 1px solid #ddd;">${formatNumber2(totals.equipmentCost)} ${estimate.currency}</td>
              </tr>
              ${totals.otherCost > 0 ? `
              <tr>
                <td style="padding: 5px 0; border-bottom: 1px solid #ddd;"><strong><T k="auto.quantitativeestimateexporter.autres" fallback="Autres:" /></strong></td>
                <td style="padding: 5px 0; text-align: right; border-bottom: 1px solid #ddd;">${formatNumber2(totals.otherCost)} ${estimate.currency}</td>
              </tr>
              ` : ''}
              <tr style="background: #f8f9fa;">
                <td style="padding: 8px 0; font-weight: bold;"><strong><T k="auto.quantitativeestimateexporter.sous_total_ht" fallback="Sous-total HT:" /></strong></td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatNumber2(totals.subtotal)} ${estimate.currency}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; border-bottom: 1px solid #ddd;">TVA (${estimate.taxRate}%):</td>
                <td style="padding: 5px 0; text-align: right; border-bottom: 1px solid #ddd;">${formatNumber2(totals.taxAmount)} ${estimate.currency}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; border-bottom: 1px solid #ddd;">Frais généraux (${estimate.overheadPercentage}%):</td>
                <td style="padding: 5px 0; text-align: right; border-bottom: 1px solid #ddd;">${formatNumber2(totals.overheadAmount)} ${estimate.currency}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; border-bottom: 2px solid #333;">Marge bénéficiaire (${estimate.profitMarginPercentage}%):</td>
                <td style="padding: 5px 0; text-align: right; border-bottom: 2px solid #333;">${formatNumber2(totals.profitAmount)} ${estimate.currency}</td>
              </tr>
              <tr style="background: #dbeafe;">
                <td style="padding: 12px 0; font-weight: bold; font-size: 16px; color: #2563eb;"><strong><T k="auto.quantitativeestimateexporter.total_general_ttc" fallback="TOTAL GÉNÉRAL TTC:" /></strong></td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 16px; color: #2563eb;">${formatNumber2(totals.finalTotal)} ${estimate.currency}</td>
              </tr>
            </table>
          </div>
        </section>
        ` : ''}

        ${exportConfig.includeTermsConditions ? `
        <!-- Terms and Conditions -->
        <section class="page-break-section" style="margin-bottom: 25px; page-break-inside: avoid;">
          <h3 style="color: #374151; font-size: 18px; margin-bottom: 15px; border-left: 4px solid #2563eb; padding-left: 15px;"><T k="auto.quantitativeestimateexporter.conditions_generales" fallback="Conditions Générales" /></h3>
          <div style="background: #fffbeb; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <pre style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; margin: 0; white-space: pre-wrap;">${exportConfig.termsConditions}</pre>
          </div>
        </section>
        ` : ''}

        ${exportConfig.notes ? `
        <!-- Additional Notes -->
        <section class="page-break-section" style="margin-bottom: 25px; page-break-inside: avoid;">
          <h3 style="color: #374151; font-size: 18px; margin-bottom: 15px; border-left: 4px solid #2563eb; padding-left: 15px;"><T k="auto.quantitativeestimateexporter.notes_complementaires" fallback="Notes Complémentaires" /></h3>
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
            <p style="margin: 0; line-height: 1.6; font-size: 12px;">${exportConfig.notes}</p>
          </div>
        </section>
        ` : ''}

        ${exportConfig.includeSignature ? `
        <!-- Signature Section -->
        <section class="page-break-section" style="margin-bottom: 25px; page-break-inside: avoid;">
          <h3 style="color: #374151; font-size: 18px; margin-bottom: 15px; border-left: 4px solid #2563eb; padding-left: 15px;"><T k="auto.quantitativeestimateexporter.validation" fallback="Validation" /></h3>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
              <div>
                <p style="margin: 0; font-size: 14px; color: #666;"><T k="auto.quantitativeestimateexporter.etabli_par" fallback="Établi par:" /></p>
                <p style="margin: 5px 0; font-weight: bold; font-size: 16px;">${exportConfig.signatoryName || 'Nom du signataire'}</p>
                <p style="margin: 5px 0; color: #666; font-size: 14px;">${exportConfig.signatoryTitle || ''}</p>
                <p style="margin: 15px 0 5px 0; font-size: 12px; color: #666;">Date: ${currentDate}</p>
              </div>
              <div style="border: 2px dashed #ccc; padding: 15px; text-align: center; min-height: 100px; display: flex; align-items: center; justify-content: center; background: white;">
                ${signature ? `<img src="${signature}" style="max-width: 200px; max-height: 80px;" alt="Signature électronique" />` : '<p style="margin: 0; color: #999; font-style: italic;"><T k="auto.quantitativeestimateexporter.signature_electronique" fallback="Signature électronique" /></p>'}
              </div>
            </div>
          </div>
        </section>
        ` : ''}

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 30px; text-align: center; color: #666; font-size: 11px;">
          <p style="margin: 0;">Ce devis quantitatif estimatif a été généré le ${currentDate}</p>
          <p style="margin: 5px 0;"><T k="auto.quantitativeestimateexporter.document_confidentiel_ne_pas_reproduire_sans_aut" fallback="Document confidentiel - Ne pas reproduire sans autorisation" /></p>
        </div>
      </div>
    `;
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      // Create PDF document using @react-pdf/renderer
      const pdfDocument = (
        <DevisPDFDocument
          estimate={mapTenderEstimateToEstimateData(estimate)}
          estimateItems={estimateItems.map(mapTenderEstimateItemToEstimateItem)}
          tender={tender}
          config={exportConfig}
          company={company}
        />
      );

      // Generate PDF blob
      const blob = await pdf(pdfDocument).toBlob();
      const fileName = `devis-quantitatif-${(tender?.projectReference || tender?.title || 'estimate').replace(/[^a-zA-Z0-9]/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
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
        title: "Devis téléchargé",
        description: "Le devis quantitatif estimatif a été téléchargé avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération du devis.",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async () => {
    if (!exportConfig.recipientEmail) {
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

      const emailResult = await CommunicationService.sendEmail({
        to: exportConfig.recipientEmail!,
        subject: `Devis Quantitatif: ${exportConfig.title}`,
        message: `Veuillez trouver ci-joint le devis quantitatif estimatif "${exportConfig.title}" pour l'appel d'offres "${tender?.projectReference || tender?.title}". Le devis a été généré le ${format(new Date(), 'dd/MM/yyyy')} et est valide jusqu'au ${format(new Date(Date.now() + exportConfig.validityPeriod * 24 * 60 * 60 * 1000), 'dd/MM/yyyy')}.`,
        html: `
          <h2>Devis Quantitatif: ${exportConfig.title}</h2>
          <p><T k="auto.quantitativeestimateexporter.bonjour" fallback="Bonjour," /></p>
          <p><T k="auto.quantitativeestimateexporter.veuillez_trouver_ci_joint_le_devis_quantitatif_e" fallback="Veuillez trouver ci-joint le devis quantitatif estimatif pour l'appel d'offres" /> <strong>${tender?.projectReference || tender?.title}</strong>.</p>
          <p><strong><T k="auto.quantitativeestimateexporter.reference" fallback="Référence:" /></strong> ${tender?.projectReference || 'N/A'}</p>
          <p><strong><T k="auto.quantitativeestimateexporter.date_de_generation" fallback="Date de génération:" /></strong> ${format(new Date(), 'dd/MM/yyyy')}</p>
          <p><strong><T k="auto.quantitativeestimateexporter.validite" fallback="Validité:" /></strong> ${exportConfig.validityPeriod} jours (jusqu'au ${format(new Date(Date.now() + exportConfig.validityPeriod * 24 * 60 * 60 * 1000), 'dd/MM/yyyy')})</p>
          <p><strong><T k="auto.quantitativeestimateexporter.montant_total" fallback="Montant total:" /></strong> ${formatNumber2(calculateTotals().finalTotal)} MRU</p>
          <p><T k="auto.quantitativeestimateexporter.ce_devis_a_ete_genere_automatiquement_par_le_sys" fallback="Ce devis a été généré automatiquement par le système." /></p>
          <br>
          <p><T k="auto.quantitativeestimateexporter.cordialement" fallback="Cordialement," /></p>
          <p><T k="auto.quantitativeestimateexporter.l_equipe_de_gestion_des_appels_d_offres" fallback="L'équipe de gestion des appels d'offres" /></p>
        `,
        actionType: 'quantitative-estimate',
        attachments: [
          { filename: fileName, content: await blobToBase64(blob), contentType: 'application/pdf', encoding: 'base64' },
        ],
      });

      if (!emailResult.success) {
        throw new Error("L'envoi de l'email a échoué");
      }

      toast({
        title: "Devis envoyé",
        description: `Le devis a été envoyé par email à ${exportConfig.recipientEmail}.`,
      });

      setExportConfig(prev => ({ ...prev, recipientEmail: '' }));
      setIsOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi du devis par email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          <T k="auto.quantitativeestimateexporter.exporter_pdf" fallback="Exporter PDF" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            <T k="auto.quantitativeestimateexporter.export_devis_quantitatif_estimatif" fallback="Export Devis Quantitatif Estimatif" />
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Configuration */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title"><T k="auto.quantitativeestimateexporter.titre_du_devis" fallback="Titre du devis" /></Label>
                <Input
                  id="title"
                  value={exportConfig.title}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="validityPeriod"><T k="auto.quantitativeestimateexporter.periode_de_validite_jours" fallback="Période de validité (jours)" /></Label>
                <Input
                  id="validityPeriod"
                  type="number"
                  value={exportConfig.validityPeriod}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, validityPeriod: parseInt(e.target.value) || 30 }))}
                />
              </div>

              <div>
                <Label htmlFor="recipientEmail"><T k="auto.quantitativeestimateexporter.email_destinataire_optionnel" fallback="Email destinataire (optionnel)" /></Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  value={exportConfig.recipientEmail}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, recipientEmail: e.target.value }))}
                  placeholder="client@example.com"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label><T k="auto.quantitativeestimateexporter.sections_a_inclure" fallback="Sections à inclure" /></Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeCompanyHeader" className="text-sm"><T k="auto.quantitativeestimateexporter.en_tete_entreprise" fallback="En-tête entreprise" /></Label>
                  <Switch
                    id="includeCompanyHeader"
                    checked={exportConfig.includeCompanyHeader}
                    onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, includeCompanyHeader: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeItemDetails" className="text-sm"><T k="auto.quantitativeestimateexporter.detail_des_postes" fallback="Détail des postes" /></Label>
                  <Switch
                    id="includeItemDetails"
                    checked={exportConfig.includeItemDetails}
                    onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, includeItemDetails: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="includePriceBreakdown" className="text-sm"><T k="auto.quantitativeestimateexporter.recapitulatif_financier" fallback="Récapitulatif financier" /></Label>
                  <Switch
                    id="includePriceBreakdown"
                    checked={exportConfig.includePriceBreakdown}
                    onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, includePriceBreakdown: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeTermsConditions" className="text-sm"><T k="auto.quantitativeestimateexporter.conditions_generales" fallback="Conditions générales" /></Label>
                  <Switch
                    id="includeTermsConditions"
                    checked={exportConfig.includeTermsConditions}
                    onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, includeTermsConditions: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeSignature" className="text-sm"><T k="auto.quantitativeestimateexporter.signature_electronique" fallback="Signature électronique" /></Label>
                  <Switch
                    id="includeSignature"
                    checked={exportConfig.includeSignature}
                    onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, includeSignature: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Terms and Conditions */}
          {exportConfig.includeTermsConditions && (
            <div>
              <Label htmlFor="termsConditions"><T k="auto.quantitativeestimateexporter.conditions_generales" fallback="Conditions générales" /></Label>
              <Textarea
                id="termsConditions"
                value={exportConfig.termsConditions}
                onChange={(e) => setExportConfig(prev => ({ ...prev, termsConditions: e.target.value }))}
                rows={6}
                className="font-mono text-sm"
              />
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <Label htmlFor="notes"><T k="auto.quantitativeestimateexporter.notes_complementaires_optionnel" fallback="Notes complémentaires (optionnel)" /></Label>
            <Textarea
              id="notes"
              value={exportConfig.notes}
              onChange={(e) => setExportConfig(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Informations complémentaires, conditions particulières..."
            />
          </div>

          {/* Signature Section */}
          {exportConfig.includeSignature && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="signatoryName"><T k="auto.quantitativeestimateexporter.nom_du_signataire" fallback="Nom du signataire" /></Label>
                  <Input
                    id="signatoryName"
                    value={exportConfig.signatoryName}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, signatoryName: e.target.value }))}
                    placeholder="Nom et prénom"
                  />
                </div>
                <div>
                  <Label htmlFor="signatoryTitle">Titre/Fonction</Label>
                  <Input
                    id="signatoryTitle"
                    value={exportConfig.signatoryTitle}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, signatoryTitle: e.target.value }))}
                    placeholder="Directeur technique, Chef de projet..."
                  />
                </div>
              </div>

              <div>
                <Label><T k="auto.quantitativeestimateexporter.signature_electronique" fallback="Signature électronique" /></Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                  <div className="flex gap-4 mb-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearSignature}
                    >
                      <T k="auto.quantitativeestimateexporter.effacer" fallback="Effacer" />
                    </Button>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={uploadSignature}
                        className="hidden"
                        id="signature-upload"
                      />
                      <Label htmlFor="signature-upload" className="cursor-pointer">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            <T k="auto.quantitativeestimateexporter.importer" fallback="Importer" />
                          </span>
                        </Button>
                      </Label>
                    </div>
                    {isSignatureSigned && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <T k="auto.quantitativeestimateexporter.signee" fallback="Signée" />
                      </Badge>
                    )}
                  </div>
                  <canvas
                    ref={signatureCanvasRef}
                    width={400}
                    height={150}
                    className="border border-border rounded bg-background cursor-crosshair w-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    style={{ touchAction: 'none' }}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    <T k="auto.quantitativeestimateexporter.dessinez_votre_signature_avec_la_souris_ou_impor" fallback="Dessinez votre signature avec la souris ou importez une image" />
                  </p>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              <T k="auto.quantitativeestimateexporter.annuler" fallback="Annuler" />
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              Télécharger PDF
            </Button>
            {exportConfig.recipientEmail && (
              <Button
                onClick={handleSendEmail}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Envoyer par Email
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuantitativeEstimateExporter;