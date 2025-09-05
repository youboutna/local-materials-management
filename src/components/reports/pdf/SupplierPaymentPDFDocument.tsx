import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFDocument, PDFSection, PDFCard, PDFRow, PDFCol, PDFText, PDFTable, PDFMetricCard } from './PDFDocument';

interface SupplierPaymentPDFDocumentProps {
  supplier: any;
  payments: any[];
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  reportConfig: {
    title: string;
    reportType: 'summary' | 'detailed' | 'outstanding';
    notes?: string;
    includeDetails: boolean;
    includeBankInfo: boolean;
  };
}

export function SupplierPaymentPDFDocument({
  supplier,
  payments,
  dateRange,
  reportConfig
}: SupplierPaymentPDFDocumentProps) {
  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'paid': 'Payé',
      'pending': 'En attente',
      'overdue': 'En retard',
      'cancelled': 'Annulé',
      'processing': 'En traitement'
    };
    return statusMap[status] || status;
  };

  const calculateTotals = () => {
    const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const paidAmount = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const pendingAmount = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const overdueAmount = payments
      .filter(p => p.status === 'overdue')
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    return { totalAmount, paidAmount, pendingAmount, overdueAmount };
  };

  const totals = calculateTotals();

  return (
    <PDFDocument
      title={reportConfig.title}
      subtitle={`Période: ${format(dateRange.startDate, 'dd/MM/yyyy')} - ${format(dateRange.endDate, 'dd/MM/yyyy')}`}
    >
      {/* Supplier Information */}
      <PDFSection title="Informations Fournisseur" borderColor="#10b981">
        <PDFCard>
          <PDFRow>
            <PDFCol>
              <PDFText label="Nom" value={supplier.name || 'Non défini'} />
              <PDFText label="Contact" value={supplier.contact_person || 'Non défini'} />
              <PDFText label="Email" value={supplier.email || 'Non défini'} />
            </PDFCol>
            <PDFCol>
              <PDFText label="Téléphone" value={supplier.phone || 'Non défini'} />
              <PDFText label="Catégorie" value={supplier.category || 'Non défini'} />
              <PDFText label="Statut" value={supplier.is_active ? 'Actif' : 'Inactif'} />
            </PDFCol>
          </PDFRow>
          {supplier.address && (
            <PDFRow>
              <PDFCol>
                <PDFText label="Adresse" value={supplier.address} />
              </PDFCol>
            </PDFRow>
          )}
        </PDFCard>
      </PDFSection>

      {/* Financial Summary */}
      <PDFSection title="Résumé Financier" borderColor="#3b82f6">
        <PDFRow>
          <PDFMetricCard
            title="Total"
            value={`${totals.totalAmount.toLocaleString('fr-FR')} MRU`}
            color="#1d4ed8"
          />
          <PDFMetricCard
            title="Payé"
            value={`${totals.paidAmount.toLocaleString('fr-FR')} MRU`}
            color="#047857"
          />
          <PDFMetricCard
            title="En Attente"
            value={`${totals.pendingAmount.toLocaleString('fr-FR')} MRU`}
            color="#d97706"
          />
          {totals.overdueAmount > 0 && (
            <PDFMetricCard
              title="En Retard"
              value={`${totals.overdueAmount.toLocaleString('fr-FR')} MRU`}
              color="#dc2626"
            />
          )}
        </PDFRow>
      </PDFSection>

      {/* Payment Details */}
      {reportConfig.includeDetails && (
        <PDFSection title="Détail des Paiements" borderColor="#8b5cf6">
          <PDFTable
            headers={['Date', 'Description', 'Montant', 'Statut']}
            data={payments.map((payment, index) => [
              payment.due_date ? format(new Date(payment.due_date), 'dd/MM/yyyy') : 'N/A',
              payment.description || payment.reference_number || `Paiement #${index + 1}`,
              payment.amount ? `${payment.amount.toLocaleString('fr-FR')} MRU` : '0 MRU',
              getStatusText(payment.status)
            ])}
            columnWidths={['20%', '40%', '25%', '15%']}
          />
        </PDFSection>
      )}

      {/* Additional Notes */}
      {reportConfig.notes && (
        <PDFSection title="Notes" borderColor="#f59e0b">
          <PDFCard>
            <PDFText label="" value={reportConfig.notes} />
          </PDFCard>
        </PDFSection>
      )}
    </PDFDocument>
  );
}