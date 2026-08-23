import { translateLabelMap } from '@/lib/i18n/labelMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDocumentsTableAdapter } from './documentsTableAdapter';
import { DocumentHubContract } from '../hub/types';

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
  return useDocumentsTableAdapter({
    scopeLabel: "Documents de l'inspection",
    queryKey: ['documents', 'inspection', inspectionId],
    filters: [{ column: 'inspection_id', value: inspectionId }],
    pathPrefix: `inspections/${inspectionId}`,
    categoryLabels: INSPECTION_CATEGORY_LABELS,
    uploadCategoryOptions: Object.entries(INSPECTION_CATEGORY_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
    facets: [
      {
        key: 'category',
        label: t('auto.inspectiondocumentadapter.categorie'),
        options: Object.entries(INSPECTION_CATEGORY_LABELS).map(([value, label]) => ({
          value,
          label,
        })),
      },
    ],
    itemFacetBuilder: (row) => ({
      category: INSPECTION_CATEGORY_LABELS[row.document_type] ?? row.document_type ?? null,
    }),
    previewMode: 'proxy',
  });
}
