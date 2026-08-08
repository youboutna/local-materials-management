import { useDocumentsTableAdapter } from './documentsTableAdapter';
import { DocumentHubContract } from '../hub/types';

const PROJECT_CATEGORY_LABELS: Record<string, string> = {
  contract: 'Contrat',
  plan: 'Plan',
  specification: 'Spécification',
  report: 'Rapport',
  photo: 'Photo',
  certificate: 'Certificat',
  drawing: 'Schéma',
  other: 'Autre',
};

export function useProjectDocumentAdapterHex(projectId: string): DocumentHubContract {
  return useDocumentsTableAdapter({
    scopeLabel: 'Documents du projet',
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
        label: 'Catégorie',
        options: Object.entries(PROJECT_CATEGORY_LABELS).map(([value, label]) => ({
          value,
          label,
        })),
      },
      {
        key: 'phase',
        label: 'Phase',
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
