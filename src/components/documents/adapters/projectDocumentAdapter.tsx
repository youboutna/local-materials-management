import { translateLabelMap } from '@/lib/i18n/labelMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDocumentsTableAdapter } from './documentsTableAdapter';
import { DocumentHubContract } from '../hub/types';

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
  return useDocumentsTableAdapter({
    scopeLabel: t('auto.projectdocumentadapter.documents_du_projet'),
    queryKey: ['documents', 'project', projectId],
    filters: [{ column: 'project_id', value: projectId }],
    pathPrefix: `projects/${projectId}`,
    categoryLabels: PROJECT_CATEGORY_LABELS,
    uploadCategoryOptions: Object.entries(PROJECT_CATEGORY_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
    facets: [
      {
        key: 'category',
        label: t('auto.projectdocumentadapter.categorie'),
        options: Object.entries(PROJECT_CATEGORY_LABELS).map(([value, label]) => ({
          value,
          label,
        })),
      },
      {
        key: 'phase',
        label: t('auto.projectdocumentadapter.phase'),
        options: [],
      },
    ],
    itemFacetBuilder: (row) => ({
      category: PROJECT_CATEGORY_LABELS[row.document_type] ?? row.document_type ?? null,
      phase: row.phase_id ? 'Rattaché à une phase' : 'Projet global',
    }),
    previewMode: 'proxy',
  });
}
