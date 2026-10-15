import { translateLabelMap } from '@/lib/i18n/labelMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDocumentsTableAdapter } from './documentsTableAdapter';
import { DocumentHubContract } from '../hub/types';
import { DOCUMENT_TYPE_LABELS, type DocumentTypeCode } from '@/config/referentials/documents/document-types.referential';

// Material-specific document types (subset of centralized referential)
const MATERIAL_DOCUMENT_TYPES: DocumentTypeCode[] = [
  'specification',
  'certificate',
  'manual',
  'invoice',
  'delivery_note',
  'warranty',
  'photo',
  'other'
];

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
  const { t } = useLanguage();
  const { materialName, supplierId, supplierName } = context;

  // Use centralized document type labels for materials
  const materialCategoryLabels: Record<DocumentTypeCode, string> = {};
  MATERIAL_DOCUMENT_TYPES.forEach(type => {
    materialCategoryLabels[type] = DOCUMENT_TYPE_LABELS[type];
  });

  const uploadCategoryOptions = MATERIAL_DOCUMENT_TYPES.map(type => ({
    value: type,
    label: DOCUMENT_TYPE_LABELS[type]
  }));

  return useDocumentsTableAdapter({
    scopeLabel: materialName ? `Documents — ${materialName}` : t('auto.materialdocumentadapter.documents_du_materiau'),
    queryKey: ['documents', 'material', materialId, supplierId ?? 'no-supplier'],
    filters: [{ column: 'metadata_material_id', value: materialId }],
    pathPrefix: `materials/${materialId}`,
    categoryLabels: materialCategoryLabels,
    uploadCategoryOptions,
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
        label: t('auto.materialdocumentadapter.categorie'),
        options: uploadCategoryOptions,
      },
    ],
    itemFacetBuilder: (row) => ({
      category: materialCategoryLabels[row.document_type as DocumentTypeCode] ?? row.document_type ?? null,
    }),
    previewMode: 'proxy',
  });
}
