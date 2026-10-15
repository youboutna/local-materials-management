import { translateLabelMap } from '@/lib/i18n/labelMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDocumentsTableAdapter } from './documentsTableAdapter';
import { DocumentHubContract } from '../hub/types';
import { DOCUMENT_TYPE_LABELS, type DocumentTypeCode } from '@/config/referentials/documents/document-types.referential';

// Project-specific document types (subset of centralized referential)
const PROJECT_DOCUMENT_TYPES: DocumentTypeCode[] = [
  'contract',
  'plan',
  'specification',
  'report',
  'photo',
  'certificate',
  'drawing',
  'other'
];

const PROJECT_CATEGORY_LABEL_KEYS: Record<string, string> = {
  contract: 'auto.projectdocumentadapter.contrat',
  plan: 'auto.projectdocumentadapter.plan',
  specification: 'auto.projectdocumentadapter.specification',
  report: 'auto.projectdocumentadapter.rapport',
  photo: 'auto.projectdocumentadapter.photo',
  certificate: 'auto.projectdocumentadapter.certificat',
  drawing: 'auto.projectdocumentadapter.schema',
  other: 'auto.projectdocumentadapter.autre',
};

export function useProjectDocumentAdapter(projectId: string): DocumentHubContract {
  const { t } = useLanguage();
  const PROJECT_CATEGORY_LABELS = translateLabelMap(PROJECT_CATEGORY_LABEL_KEYS, t);
  
  // Use centralized document type labels as fallback
  const categoryLabels: Record<DocumentTypeCode, string> = {};
  PROJECT_DOCUMENT_TYPES.forEach(type => {
    categoryLabels[type] = PROJECT_CATEGORY_LABELS[type] ?? DOCUMENT_TYPE_LABELS[type];
  });

  const uploadCategoryOptions = PROJECT_DOCUMENT_TYPES.map(type => ({
    value: type,
    label: categoryLabels[type]
  }));

  return useDocumentsTableAdapter({
    scopeLabel: t('auto.projectdocumentadapter.documents_du_projet'),
    queryKey: ['documents', 'project', projectId],
    filters: [{ column: 'project_id', value: projectId }],
    pathPrefix: `projects/${projectId}`,
    categoryLabels,
    uploadCategoryOptions,
    facets: [
      {
        key: 'category',
        label: t('auto.projectdocumentadapter.categorie'),
        options: uploadCategoryOptions,
      },
      {
        key: 'phase',
        label: t('auto.projectdocumentadapter.phase'),
        options: [],
      },
    ],
    itemFacetBuilder: (row) => ({
      category: categoryLabels[row.document_type as DocumentTypeCode] ?? row.document_type ?? null,
      phase: row.phase_id ? 'Rattaché à une phase' : 'Projet global',
    }),
    previewMode: 'proxy',
  });
}
