import { useLanguage } from '@/contexts/LanguageContext';
/**
 * Onglet « Documents » des pages de surveillance (garanties bancaires / assurances).
 * Présentation uniquement : réutilise le DocumentHub standard + visionneuse intégrée.
 */
import { DocumentHub } from '../hub/DocumentHub';
import {
  MonitoringDocumentScope,
  useMonitoringDocumentAdapter,
} from '../adapters/monitoringDocumentAdapter';

interface Props {
  scope: MonitoringDocumentScope;
  heading?: string;
}

export function MonitoringDocumentsPanel({ scope, heading }: Props) {
  const { t } = useLanguage();
  const contract = useMonitoringDocumentAdapter(scope);

  return (
    <DocumentHub
      contract={contract}
      heading={
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-foreground">
            {heading ??
              (scope === 'bank_guarantee'
                ? t('auto.monitoringdocumentspanel.documents_associes_aux_garanties_bancaires')
                : scope === 'insurance'
                  ? "Documents associés aux polices d'assurance"
                  : t('auto.monitoringdocumentspanel.documents_associes_aux_paiements'))}
          </h2>
          <p className="text-sm text-muted-foreground">
            Attestations, contrats de caution, certificats et avenants — consultables via la
            visionneuse intégrée.
          </p>
        </div>
      }
    />
  );
}

export default MonitoringDocumentsPanel;
