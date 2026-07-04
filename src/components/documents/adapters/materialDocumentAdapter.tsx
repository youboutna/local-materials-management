import { useDocumentsTableAdapter } from './documentsTableAdapter';
import { DocumentHubContract } from '../hub/types';

const MATERIAL_CATEGORY_LABELS: Record<string, string> = {
  specification: 'Fiche technique',
  certificate: 'Certificat',
  manual: 'Manuel',
  photo: 'Photo',
  other: 'Autre',
};

export function useMaterialDocumentAdapter(materialId: string): DocumentHubContract {
  return useDocumentsTableAdapter({
    scopeLabel: 'Documents du matériau',
    queryKey: ['documents', 'material', materialId],
    filters: [{ column: 'metadata_material_id', value: materialId }],
    pathPrefix: `materials/${materialId}`,
    categoryLabels: MATERIAL_CATEGORY_LABELS,
    uploadCategoryOptions: Object.entries(MATERIAL_CATEGORY_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
    insertDefaults: { metadata: { material_id: materialId } },
    facets: [
      {
        key: 'category',
        label: 'Catégorie',
        options: Object.entries(MATERIAL_CATEGORY_LABELS).map(([value, label]) => ({
          value,
          label,
        })),
      },
    ],
    itemFacetBuilder: (row) => ({
      category: MATERIAL_CATEGORY_LABELS[row.document_type] ?? row.document_type ?? null,
    }),
    previewMode: 'proxy',
  });
}
