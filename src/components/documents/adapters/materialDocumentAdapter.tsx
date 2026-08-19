import { useDocumentsTableAdapter } from './documentsTableAdapter';
import { DocumentHubContract } from '../hub/types';

const MATERIAL_CATEGORY_LABELS: Record<string, string> = {
  specification: 'Fiche technique',
  certificate: 'Certificat',
  manual: 'Manuel',
  invoice: 'Facture',
  delivery_note: 'Bon de livraison',
  warranty: 'Garantie',
  photo: 'Photo',
  other: 'Autre',
};

/** Contexte matériau propagé aux documents (auto-complétion à l'upload). */
export interface MaterialDocumentContext {
  materialName?: string;
  supplierId?: string;
  supplierName?: string;
}

export function useMaterialDocumentAdapter(
  materialId: string,
  context: MaterialDocumentContext = {},
): DocumentHubContract {
  const { materialName, supplierId, supplierName } = context;

  return useDocumentsTableAdapter({
    scopeLabel: materialName ? `Documents — ${materialName}` : 'Documents du matériau',
    queryKey: ['documents', 'material', materialId, supplierId ?? 'no-supplier'],
    filters: [{ column: 'metadata_material_id', value: materialId }],
    pathPrefix: `materials/${materialId}`,
    categoryLabels: MATERIAL_CATEGORY_LABELS,
    uploadCategoryOptions: Object.entries(MATERIAL_CATEGORY_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
    insertDefaults: {
      metadata: {
        material_id: materialId,
        material_name: materialName ?? null,
        supplier_id: supplierId ?? null,
        supplier_name: supplierName ?? null,
      },
    },
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
