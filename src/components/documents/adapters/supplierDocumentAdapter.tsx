import { translateLabelMap } from '@/lib/i18n/labelMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDocumentsTableAdapter } from './documentsTableAdapter';
import { DocumentHubContract } from '../hub/types';
import { DOCUMENT_TYPE_LABELS, type DocumentTypeCode } from '@/config/referentials/documents/document-types.referential';

// Supplier-specific document types (subset of centralized referential)
const SUPPLIER_DOCUMENT_TYPES: DocumentTypeCode[] = [
  'contract',
  'certificate',
  'invoice',
  'supporting_document',
  'other'
];

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
  
  // Use centralized document type labels as fallback
  const categoryLabels: Record<DocumentTypeCode, string> = {};
  SUPPLIER_DOCUMENT_TYPES.forEach(type => {
    categoryLabels[type] = SUPPLIER_CATEGORY_LABELS[type] ?? DOCUMENT_TYPE_LABELS[type];
  });

  const uploadCategoryOptions = SUPPLIER_DOCUMENT_TYPES.map(type => ({
    value: type,
    label: categoryLabels[type]
  }));

  return useDocumentsTableAdapter({
    scopeLabel: t('auto.supplierdocumentadapter.documents_du_fournisseur'),
    queryKey: ['documents', 'supplier', supplierId],
    filters: [{ column: 'supplier_id', value: supplierId }],
    pathPrefix: `suppliers/${supplierId}`,
    categoryLabels,
    uploadCategoryOptions,
    facets: [
      {
        key: 'category',
        label: t('auto.supplierdocumentadapter.categorie'),
        options: uploadCategoryOptions,
      },
    ],
    itemFacetBuilder: (row) => ({
      category: categoryLabels[row.document_type as DocumentTypeCode] ?? row.document_type ?? null,
    }),
    previewMode: 'proxy',
  });
}
