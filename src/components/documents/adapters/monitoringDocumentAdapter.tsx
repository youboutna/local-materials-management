/**
 * Adapter GED pour les documents de surveillance contractuelle
 * (garanties bancaires, polices d'assurance).
 * Purement présentation : réutilise l'adapter générique `documents`.
 */
import { DocumentHubContract } from '../hub/types';
import { useDocumentsTableAdapter } from './documentsTableAdapter';

export type MonitoringDocumentScope = 'bank_guarantee' | 'insurance';

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
};

export function useMonitoringDocumentAdapter(scope: MonitoringDocumentScope): DocumentHubContract {
  const scopeLabel = scope === 'bank_guarantee' ? 'Garanties bancaires' : "Polices d'assurance";

  return useDocumentsTableAdapter({
    scopeLabel,
    queryKey: ['documents', 'monitoring', scope],
    filters: [{ column: 'metadata_scope', value: scope }],
    pathPrefix: `monitoring/${scope}`,
    uploadCategoryOptions: CATEGORY_OPTIONS[scope],
    categoryLabels: {
      contract: scope === 'bank_guarantee' ? 'Contrat de caution' : 'Police / Certificat',
      project_report: scope === 'bank_guarantee' ? 'Attestation bancaire' : 'Avenant',
      other: 'Autre document',
    },
    facets: [
      {
        key: 'category',
        label: 'Type de document',
        options: CATEGORY_OPTIONS[scope],
      },
    ],
    itemFacetBuilder: (row: any) => ({ category: row.document_type ?? null }),
    insertDefaults: { metadata: { scope } },
    previewMode: 'proxy',
  });
}
