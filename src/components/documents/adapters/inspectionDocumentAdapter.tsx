import { translateLabelMap } from '@/lib/i18n/labelMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDocumentsTableAdapter } from './documentsTableAdapter';
import { DocumentHubContract } from '../hub/types';
import { DOCUMENT_TYPE_LABELS, type DocumentTypeCode } from '@/config/referentials/documents/document-types.referential';

// Inspection-specific document types (subset of centralized referential)
const INSPECTION_DOCUMENT_TYPES: DocumentTypeCode[] = [
  'pv',
  'report',
  'photo',
  'checklist',
  'other'
];

const INSPECTION_CATEGORY_LABEL_KEYS: Record<string, string> = {
  pv: 'auto.inspectiondocumentadapter.pv',
  report: 'auto.inspectiondocumentadapter.rapport',
  photo: 'auto.inspectiondocumentadapter.photo',
  checklist: 'auto.inspectiondocumentadapter.checklist',
  other: 'auto.inspectiondocumentadapter.autre',
};

export function useInspectionDocumentAdapter(inspectionId: string): DocumentHubContract {
  const { t } = useLanguage();
  const INSPECTION_CATEGORY_LABELS = translateLabelMap(INSPECTION_CATEGORY_LABEL_KEYS, t);
  
  // Use centralized document type labels as fallback
  const categoryLabels: Record<DocumentTypeCode, string> = {};
  INSPECTION_DOCUMENT_TYPES.forEach(type => {
    categoryLabels[type] = INSPECTION_CATEGORY_LABELS[type] ?? DOCUMENT_TYPE_LABELS[type];
  });

  const uploadCategoryOptions = INSPECTION_DOCUMENT_TYPES.map(type => ({
    value: type,
    label: categoryLabels[type]
  }));

  return useDocumentsTableAdapter({
    scopeLabel: "Documents de l'inspection",
    queryKey: ['documents', 'inspection', inspectionId],
    filters: [{ column: 'inspection_id', value: inspectionId }],
    pathPrefix: `inspections/${inspectionId}`,
    categoryLabels,
    uploadCategoryOptions,
    facets: [
      {
        key: 'category',
        label: t('auto.inspectiondocumentadapter.categorie'),
        options: uploadCategoryOptions,
      },
    ],
    itemFacetBuilder: (row) => ({
      category: categoryLabels[row.document_type as DocumentTypeCode] ?? row.document_type ?? null,
    }),
    previewMode: 'proxy',
  });
}
