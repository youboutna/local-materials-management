import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFDocument, PDFSection, PDFCard, PDFRow, PDFCol, PDFText, PDFTable } from './PDFDocument';

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

interface EstimateItem {
  id?: string;
  material_id?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  description: string | null;
  item_type: string | null;
}

interface TenderEstimate {
  id?: string;
  tender_id: string;
  project_id?: string | null;
  estimate_type: string;
  total_materials_cost: number | null;
  total_labor_cost: number | null;
  total_equipment_cost: number | null;
  subtotal: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  total_with_tax: number | null;
  overhead_percentage: number | null;
  overhead_amount: number | null;
  profit_margin_percentage: number | null;
  profit_margin_amount: number | null;
  final_total: number | null;
  currency: string | null;
  status: string;
  created_at?: string;
}

interface DevisPDFDocumentProps {
  estimate: TenderEstimate;
  estimateItems: EstimateItem[];
  tender: any;
  config: {
    title: string;
    includeCompanyHeader: boolean;
    includeItemDetails: boolean;
    includePriceBreakdown: boolean;
    includeTermsConditions: boolean;
    includeSignature: boolean;
    termsConditions: string;
    notes?: string;
    signatoryName?: string;
    signatoryTitle?: string;
    validityPeriod: number;
  };
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
  config,
  company = {
    name: 'Votre Entreprise',
    address: '123 Rue Exemple, Nouakchott, Mauritanie',
    phone: '+222 XX XX XX XX',
    email: 'contact@votreentreprise.mr'
  }
}: DevisPDFDocumentProps) {
  const validUntilDate = format(
    new Date(Date.now() + config.validityPeriod * 24 * 60 * 60 * 1000), 
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
      title={config.title}
      subtitle={`N° de référence: ${estimate.id || 'DRAFT'} | Valide jusqu'au: ${validUntilDate}`}
      company={config.includeCompanyHeader ? company : undefined}
    >
      {/* Tender Information */}
      <PDFSection title="Informations Appel d'Offres" borderColor="#2563eb">
        <PDFCard>
          <PDFRow>
            <PDFCol>
              <PDFText label="Titre" value={tender?.title || 'Non défini'} />
              <PDFText label="Référence" value={tender?.reference || 'Non défini'} />
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
      {config.includeItemDetails && estimateItems.length > 0 && (
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
      {config.includePriceBreakdown && (
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
      {config.includeTermsConditions && (
        <PDFSection title="Conditions Générales" borderColor="#f59e0b">
          <View style={styles.termsSection}>
            <Text style={styles.termsText}>{config.termsConditions}</Text>
          </View>
        </PDFSection>
      )}

      {/* Additional Notes */}
      {config.notes && (
        <PDFSection title="Notes Complémentaires" borderColor="#ef4444">
          <PDFCard>
            <Text style={{ fontSize: 11, lineHeight: 1.4 }}>{config.notes}</Text>
          </PDFCard>
        </PDFSection>
      )}

      {/* Signature Section */}
      {config.includeSignature && config.signatoryName && (
        <PDFSection title="Validation" borderColor="#6b7280">
          <View style={styles.signatureSection}>
            <View style={styles.signatureRow}>
              <View>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>Nom du signataire:</Text>
                <Text style={{ fontSize: 14, fontWeight: 'bold', marginTop: 5 }}>{config.signatoryName}</Text>
                {config.signatoryTitle && (
                  <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{config.signatoryTitle}</Text>
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