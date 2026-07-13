/**
 * BoqWorkspace — composant de composition mutualisé pour 3 contextes :
 *  - Projet DQE prévisionnel      (source='dqe',            mode='planning')
 *  - Portail fournisseur / Devis  (source='tender_estimate',mode='bid')
 *  - Portail fournisseur / Factures (source='supplier_bid', mode='invoice')
 *
 * N'est PAS un nouvel onglet — remplace 3 blocs identiques déjà rendus dans les
 * onglets existants. Aucune logique métier propre ; délègue à BoqLineTable +
 * BoqImportDialog (+ useBoqDocument).
 */
import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { BoqLineTable } from './BoqLineTable';
import { BoqImportDialog } from './BoqImportDialog';
import { useBoqDocument } from '@/hooks/hexagonal/useBoqDocument';
import type { BoqSource } from '@/domain/boq/BoqLine';
import type { ReferentialType } from '@/config/referentials';

export type BoqWorkspaceMode = 'planning' | 'bid' | 'invoice';

interface Props {
  source: BoqSource;
  contextId: string;
  projectId?: string;
  mode: BoqWorkspaceMode;
  referentialCode?: ReferentialType;
  showModes?: { rapide?: boolean; avance?: boolean; import?: boolean };
  emptyLabel?: string;
  importLabel?: string;
}

const DEFAULT_LABELS: Record<BoqWorkspaceMode, { import: string; empty: string }> = {
  planning: { import: 'Importer un DQE', empty: 'Aucune ligne DQE. Importez un fichier pour démarrer.' },
  bid:      { import: 'Importer un chiffrage', empty: 'Aucune ligne de devis. Importez un fichier ou saisissez.' },
  invoice:  { import: 'Analyser une facture', empty: 'Aucune facture analysée. Importez un PDF/Excel/CSV.' },
};

export function BoqWorkspace({
  source, contextId, projectId, mode,
  referentialCode,
  showModes = { import: true },
  emptyLabel, importLabel,
}: Props) {
  const doc = useBoqDocument({ source, contextId, projectId });
  const labels = DEFAULT_LABELS[mode];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {doc.lines.length} ligne(s) — Total HT&nbsp;
          {doc.lines.reduce((s, l) => s + (Number(l.totalHt) || 0), 0).toLocaleString('fr-FR')} MRU
        </div>
        {showModes.import && (
          <BoqImportDialog
            source={source}
            contextId={contextId}
            projectId={projectId}
            defaultReferentialCode={referentialCode}
            title={importLabel ?? labels.import}
            trigger={
              <button className="inline-flex items-center gap-2 text-sm border rounded-md px-3 py-1.5 hover:bg-accent">
                <FileSpreadsheet className="h-4 w-4" /> {importLabel ?? labels.import}
              </button>
            }
            onImported={() => doc.refetch()}
          />
        )}
      </div>

      {doc.isLoading ? (
        <div className="text-sm text-muted-foreground">Chargement…</div>
      ) : (
        <BoqLineTable
          lines={doc.lines}
          emptyLabel={emptyLabel ?? labels.empty}
        />
      )}
    </div>
  );
}
