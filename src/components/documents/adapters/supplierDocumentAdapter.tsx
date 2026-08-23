import { translateLabelMap } from '@/lib/i18n/labelMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDocumentsTableAdapter } from './documentsTableAdapter';
import { DocumentHubContract } from '../hub/types';

const SUPPLIER_CATEGORY_LABEL_KEYS: Record<string, string> = {
  contract: 'auto.supplierdocumentadapter.contrat',
  certificate: 'auto.supplierdocumentadapter.attestation',
  invoice: 'auto.supplierdocumentadapter.facture',
  supporting_document: 'auto.supplierdocumentadapter.piece_justificative',
  other: 'auto.supplierdocumentadapter.autre',
};

export function useSupplierDocumentAdapter(supplierId: string): DocumentHubContract {
  const { t } = useLanguage();
  const SUPPLIER_CATEGORY_LABELS = translateLabelMap(SUPPLIER_CATEGORY_LABEL_KEYS, t);
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
