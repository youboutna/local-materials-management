import { formatNumber2 } from '@/utils/reportNumbers';
import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFDocument, PDFSection, PDFCard, PDFRow, PDFCol, PDFText, PDFTable, PDFMetricCard } from './PDFDocument';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
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
      <PDFSection title={t('auto.supplierpaymentpdfdocument.informations_fournisseur')} borderColor="#10b981">
        <PDFCard>
          <PDFRow>
            <PDFCol>
              <PDFText label={t('auto.supplierpaymentpdfdocument.nom')} value={supplier.name || 'Non défini'} />
              <PDFText label={t('auto.supplierpaymentpdfdocument.contact')} value={supplier.contactPerson || 'Non défini'} />
              <PDFText label={t('auto.supplierpaymentpdfdocument.email')} value={supplier.email || 'Non défini'} />
            </PDFCol>
            <PDFCol>
              <PDFText label={t('auto.supplierpaymentpdfdocument.telephone')} value={supplier.phone || 'Non défini'} />
              <PDFText label={t('auto.supplierpaymentpdfdocument.categorie')} value={supplier.category || 'Non défini'} />
              <PDFText label={t('auto.supplierpaymentpdfdocument.statut')} value={supplier.isActive ? 'Actif' : 'Inactif'} />
            </PDFCol>
          </PDFRow>
          {supplier.address && (
            <PDFRow>
              <PDFCol>
                <PDFText label={t('auto.supplierpaymentpdfdocument.adresse')} value={supplier.address} />
              </PDFCol>
            </PDFRow>
          )}
        </PDFCard>
      </PDFSection>

      {/* Financial Summary */}
      <PDFSection title={t('auto.supplierpaymentpdfdocument.resume_financier')} borderColor="#3b82f6">
        <PDFRow>
          <PDFMetricCard
            title={t('auto.supplierpaymentpdfdocument.total')}
            value={`${formatNumber2(totals.totalAmount)} MRU`}
            color="#1d4ed8"
          />
          <PDFMetricCard
            title={t('auto.supplierpaymentpdfdocument.paye')}
            value={`${formatNumber2(totals.paidAmount)} MRU`}
            color="#047857"
          />
          <PDFMetricCard
            title={t('auto.supplierpaymentpdfdocument.en_attente')}
            value={`${formatNumber2(totals.pendingAmount)} MRU`}
            color="#d97706"
          />
          {totals.overdueAmount > 0 && (
            <PDFMetricCard
              title={t('auto.supplierpaymentpdfdocument.en_retard')}
              value={`${formatNumber2(totals.overdueAmount)} MRU`}
              color="#dc2626"
            />
          )}
        </PDFRow>
      </PDFSection>

      {/* Payment Details */}
      {reportConfig.includeDetails && (
        <PDFSection title={t('auto.supplierpaymentpdfdocument.detail_des_paiements')} borderColor="#8b5cf6">
          <PDFTable
            headers={['Date', 'Description', 'Montant', 'Statut']}
            data={payments.map((payment, index) => [
              payment.paymentDate ? format(new Date(payment.paymentDate), 'dd/MM/yyyy') : 'N/A',
              payment.transactionId || `Paiement #${index + 1}`,
              payment.amount ? `${formatNumber2(payment.amount)} MRU` : '0 MRU',
              getStatusText(payment.status)
            ])}
            columnWidths={['20%', '40%', '25%', '15%']}
          />
        </PDFSection>
      )}

      {/* Additional Notes */}
      {reportConfig.notes && (
        <PDFSection title={t('auto.supplierpaymentpdfdocument.notes')} borderColor="#f59e0b">
          <PDFCard>
            <PDFText label="" value={reportConfig.notes} />
          </PDFCard>
        </PDFSection>
      )}
    </PDFDocument>
  );
}