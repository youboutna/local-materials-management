import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFDocument, PDFSection, PDFCard, PDFRow, PDFCol, PDFText, PDFTable } from './PDFDocument';
import { EstimateItem, EstimateData, ExportConfig } from '@/dtos/transforms/shared';

const styles = StyleSheet.create({
  grandTotal: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  grandTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
  },
  termsSection: {
    backgroundColor: '#fffbeb',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  termsText: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#374151',
  },
  signatureSection: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    padding: 15,
    textAlign: 'center',
    minHeight: 80,
    width: '45%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

interface DevisPDFDocumentProps {
  estimate: EstimateData;
  estimateItems: EstimateItem[];
  tender: any;
  config?: Partial<ExportConfig>;
  company?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
}

export function DevisPDFDocument({
  estimate,
  estimateItems,
  tender,
  config = {},
  company = {
    name: 'Votre Entreprise',
    address: '123 Rue Exemple, Nouakchott, Mauritanie',
    phone: '+222 XX XX XX XX',
    email: 'contact@votreentreprise.mr'
  }
}: DevisPDFDocumentProps) {
  const defaultConfig: ExportConfig = {
    title: `Devis Quantitatif Estimatif - ${tender?.title || tender?.projectReference || 'Appel d\'Offres'}`,
    includeCompanyHeader: true,
    includeItemDetails: true,
    includePriceBreakdown: true,
    includeTermsConditions: true,
    includeSignature: false,
    termsConditions: `CONDITIONS GÉNÉRALES:
1. Validité de l'offre: 30 jours à compter de la date d'émission
2. Délai de livraison: À définir selon cahier des charges
3. Modalités de paiement: Selon contrat
4. Prix fermes et définitifs, hors révision exceptionnelle
5. Conformité aux normes et réglementations en vigueur`,
    recipientEmail: '',
    notes: '',
    signatoryName: '',
    signatoryTitle: 'Directeur Technique',
    validityPeriod: 30
  };

  const finalConfig = { ...defaultConfig, ...config };

  const validUntilDate = format(
    new Date(Date.now() + finalConfig.validityPeriod * 24 * 60 * 60 * 1000), 
    'dd MMMM yyyy', 
    { locale: fr }
  );

  const calculateTotals = () => {
    const materialsCost = estimateItems
      .filter(item => item.item_type === 'material')
      .reduce((sum, item) => sum + (item.total_price || 0), 0);
    
    const laborCost = estimateItems
      .filter(item => item.item_type === 'labor')
      .reduce((sum, item) => sum + (item.total_price || 0), 0);
    
    const equipmentCost = estimateItems
      .filter(item => item.item_type === 'equipment')
      .reduce((sum, item) => sum + (item.total_price || 0), 0);

    const otherCost = estimateItems
      .filter(item => item.item_type === 'other')
      .reduce((sum, item) => sum + (item.total_price || 0), 0);

    const subtotal = materialsCost + laborCost + equipmentCost + otherCost;
    const taxAmount = subtotal * (estimate.tax_rate || 0) / 100;
    const totalWithTax = subtotal + taxAmount;
    const overheadAmount = totalWithTax * (estimate.overhead_percentage || 0) / 100;
    const profitAmount = (totalWithTax + overheadAmount) * (estimate.profit_margin_percentage || 0) / 100;
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

  const totals = calculateTotals();

  return (
    <PDFDocument
      title={finalConfig.title}
      subtitle={`N° de référence: ${estimate.id || 'DRAFT'} | Valide jusqu'au: ${validUntilDate}`}
      company={finalConfig.includeCompanyHeader ? company : undefined}
    >
      {/* Tender Information */}
      <PDFSection title="Informations Appel d'Offres" borderColor="#2563eb">
        <PDFCard>
          <PDFRow>
            <PDFCol>
              <PDFText label="Titre" value={tender?.title || 'Non défini'} />
              <PDFText label="Référence" value={tender?.projectReference || 'Non défini'} />
            </PDFCol>
            <PDFCol>
              <PDFText label="Type d'estimation" value={estimate.estimate_type || 'Standard'} />
              <PDFText label="Devise" value={estimate.currency || 'MRU'} />
            </PDFCol>
          </PDFRow>
          {tender?.description && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Description:</Text>
              <Text style={{ fontSize: 11, lineHeight: 1.4 }}>{tender.description}</Text>
            </View>
          )}
        </PDFCard>
      </PDFSection>

      {/* Detailed Items */}
      {finalConfig.includeItemDetails && estimateItems.length > 0 && (
        <PDFSection title="Détail des Postes" borderColor="#10b981">
          <PDFTable
            headers={['Description', 'Type', 'Qté', `P.U. (${estimate.currency})`, `Total (${estimate.currency})`]}
            data={estimateItems.map(item => [
              item.description || '',
              item.item_type || 'autre',
              (item.quantity || 0).toString(),
              (item.unit_price || 0).toLocaleString('fr-FR'),
              (item.total_price || 0).toLocaleString('fr-FR')
            ])}
            columnWidths={['40%', '15%', '10%', '17.5%', '17.5%']}
          />
        </PDFSection>
      )}

      {/* Price Breakdown */}
      {finalConfig.includePriceBreakdown && (
        <PDFSection title="Récapitulatif Financier" borderColor="#3b82f6">
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText label="Matériaux" value={`${totals.materialsCost.toLocaleString('fr-FR')} ${estimate.currency}`} />
                <PDFText label="Main-d'œuvre" value={`${totals.laborCost.toLocaleString('fr-FR')} ${estimate.currency}`} />
                <PDFText label="Équipement" value={`${totals.equipmentCost.toLocaleString('fr-FR')} ${estimate.currency}`} />
                {totals.otherCost > 0 && (
                  <PDFText label="Autres" value={`${totals.otherCost.toLocaleString('fr-FR')} ${estimate.currency}`} />
                )}
              </PDFCol>
              <PDFCol>
                <PDFText label={`TVA (${estimate.tax_rate}%)`} value={`${totals.taxAmount.toLocaleString('fr-FR')} ${estimate.currency}`} />
                <PDFText label={`Frais généraux (${estimate.overhead_percentage}%)`} value={`${totals.overheadAmount.toLocaleString('fr-FR')} ${estimate.currency}`} />
                <PDFText label={`Marge bénéficiaire (${estimate.profit_margin_percentage}%)`} value={`${totals.profitAmount.toLocaleString('fr-FR')} ${estimate.currency}`} />
              </PDFCol>
            </PDFRow>
            
            <View style={styles.grandTotal}>
              <Text style={styles.grandTotalText}>
                TOTAL GÉNÉRAL TTC: {totals.finalTotal.toLocaleString('fr-FR')} {estimate.currency}
              </Text>
            </View>
          </PDFCard>
        </PDFSection>
      )}

      {/* Terms and Conditions */}
      {finalConfig.includeTermsConditions && (
        <PDFSection title="Conditions Générales" borderColor="#f59e0b">
          <View style={styles.termsSection}>
            <Text style={styles.termsText}>{finalConfig.termsConditions}</Text>
          </View>
        </PDFSection>
      )}

      {/* Additional Notes */}
      {finalConfig.notes && (
        <PDFSection title="Notes Complémentaires" borderColor="#ef4444">
          <PDFCard>
            <Text style={{ fontSize: 11, lineHeight: 1.4 }}>{finalConfig.notes}</Text>
          </PDFCard>
        </PDFSection>
      )}

      {/* Signature Section */}
      {finalConfig.includeSignature && finalConfig.signatoryName && (
        <PDFSection title="Validation" borderColor="#6b7280">
          <View style={styles.signatureSection}>
            <View style={styles.signatureRow}>
              <View>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>Nom du signataire:</Text>
                <Text style={{ fontSize: 14, fontWeight: 'bold', marginTop: 5 }}>{finalConfig.signatoryName}</Text>
                {finalConfig.signatoryTitle && (
                  <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{finalConfig.signatoryTitle}</Text>
                )}
              </View>
              <View style={styles.signatureBox}>
                <Text style={{ fontSize: 10, color: '#9ca3af' }}>Signature requise</Text>
              </View>
            </View>
            <View style={{ marginTop: 15, alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 10, color: '#6b7280' }}>
                Date: {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
              </Text>
            </View>
          </View>
        </PDFSection>
      )}
    </PDFDocument>
  );
}