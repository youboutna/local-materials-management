import { useLanguage } from '@/contexts/LanguageContext';
import { useDocumentsTableAdapter } from './documentsTableAdapter';
import { DocumentHubContract } from '../hub/types';

const SUPPLIER_CATEGORY_LABELS: Record<string, string> = {
  contract: 'Contrat',
  certificate: 'Attestation',
  invoice: 'Facture',
  supporting_document: 'Pièce justificative',
  other: 'Autre',
};

export function useSupplierDocumentAdapter(supplierId: string): DocumentHubContract {
  const { t } = useLanguage();
  return useDocumentsTableAdapter({
    scopeLabel: t('auto.supplierdocumentadapter.documents_du_fournisseur'),
    queryKey: ['documents', 'supplier', supplierId],
    filters: [{ column: 'supplier_id', value: supplierId }],
    pathPrefix: `suppliers/${supplierId}`,
    categoryLabels: SUPPLIER_CATEGORY_LABELS,
    uploadCategoryOptions: Object.entries(SUPPLIER_CATEGORY_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
    facets: [
      {
        key: 'category',
        label: t('auto.supplierdocumentadapter.categorie'),
        options: Object.entries(SUPPLIER_CATEGORY_LABELS).map(([value, label]) => ({
          value,
          label,
        })),
      },
    ],
    itemFacetBuilder: (row) => ({
      category: SUPPLIER_CATEGORY_LABELS[row.document_type] ?? row.document_type ?? null,
    }),
    previewMode: 'proxy',
  });
}
