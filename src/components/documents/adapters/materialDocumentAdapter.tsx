import { translateLabelMap } from '@/lib/i18n/labelMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDocumentsTableAdapter } from './documentsTableAdapter';
import { DocumentHubContract } from '../hub/types';

const MATERIAL_CATEGORY_LABEL_KEYS: Record<string, string> = {
  specification: 'auto.materialdocumentadapter.fiche_technique',
  certificate: 'auto.materialdocumentadapter.certificat',
  manual: 'auto.materialdocumentadapter.manuel',
  invoice: 'auto.materialdocumentadapter.facture',
  delivery_note: 'auto.materialdocumentadapter.bon_de_livraison',
  warranty: 'auto.materialdocumentadapter.garantie',
  photo: 'auto.materialdocumentadapter.photo',
  other: 'auto.materialdocumentadapter.autre',
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
  const { t } = useLanguage();
  const MATERIAL_CATEGORY_LABELS = translateLabelMap(MATERIAL_CATEGORY_LABEL_KEYS, t);
  const { materialName, supplierId, supplierName } = context;

  return useDocumentsTableAdapter({
    scopeLabel: materialName ? `Documents — ${materialName}` : t('auto.materialdocumentadapter.documents_du_materiau'),
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
        label: t('auto.materialdocumentadapter.categorie'),
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
