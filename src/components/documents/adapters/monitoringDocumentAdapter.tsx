import { translateLabelMap } from '@/lib/i18n/labelMap';
import { useLanguage } from '@/contexts/LanguageContext';
/**
 * Adapter GED pour les documents de surveillance contractuelle
 * (garanties bancaires, polices d'assurance).
 * Purement présentation : réutilise l'adapter générique `documents`.
 */
import { DocumentHubContract } from '../hub/types';
import { useDocumentsTableAdapter } from './documentsTableAdapter';

export type MonitoringDocumentScope = 'bank_guarantee' | 'insurance' | 'payment';

const CATEGORY_OPTIONS: Record<MonitoringDocumentScope, { value: string; label: string }[]> = {
  bank_guarantee: [
    { value: 'contract', label: 'Contrat de caution' },
    { value: 'project_report', label: 'Attestation bancaire' },
    { value: 'other', label: 'Autre document' },
  ],
  insurance: [
    { value: 'contract', label: "Police / Certificat d'assurance" },
    { value: 'project_report', label: 'Avenant' },
    { value: 'other', label: 'Autre document' },
  ],
  payment: [
    { value: 'contract', label: 'Facture' },
    { value: 'project_report', label: 'Bon de commande' },
    { value: 'other', label: 'Attestation / Autre document' },
  ],
};

const SCOPE_LABEL_KEYS: Record<string, string> = {
  bank_guarantee: 'auto.monitoringdocumentadapter.garanties_bancaires',
  insurance: 'auto.monitoringdocumentadapter.polices_d_assurance',
  payment: 'auto.monitoringdocumentadapter.paiements',
};

export function useMonitoringDocumentAdapter(scope: MonitoringDocumentScope): DocumentHubContract {
  const { t } = useLanguage();
  const SCOPE_LABELS = translateLabelMap(SCOPE_LABEL_KEYS, t);
  const scopeLabel = SCOPE_LABELS[scope];

  return useDocumentsTableAdapter({
    scopeLabel,
    queryKey: ['documents', 'monitoring', scope],
    filters: [{ column: 'metadata_scope', value: scope }],
    pathPrefix: `monitoring/${scope}`,
    uploadCategoryOptions: CATEGORY_OPTIONS[scope],
    categoryLabels: Object.fromEntries(
      CATEGORY_OPTIONS[scope].map((o) => [o.value, o.label]),
    ) as Record<string, string>,
    facets: [
      {
        key: 'category',
        label: t('auto.monitoringdocumentadapter.type_de_document'),
        options: CATEGORY_OPTIONS[scope],
      },
    ],
    itemFacetBuilder: (row: any) => ({ category: row.document_type ?? null }),
    insertDefaults: { metadata: { scope } },
    previewMode: 'proxy',
  });
}
