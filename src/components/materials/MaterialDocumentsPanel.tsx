/**
 * MaterialDocumentsPanel — GED unifiée (DocumentHub) pour un matériau.
 * Le contexte (matériau + fournisseur saisi à l'étape précédente) est propagé
 * aux métadonnées des documents pour l'auto-complétion.
 */
import React from 'react';
import { DocumentHub } from '@/components/documents/hub';
import { useMaterialDocumentAdapter } from '@/components/documents/adapters/materialDocumentAdapter';
import { Badge } from '@/components/ui/badge';
import { T } from '@/components/i18n/T';

interface MaterialDocumentsPanelProps {
  materialId: string;
  materialName?: string;
  supplierId?: string;
  supplierName?: string;
  className?: string;
}

export const MaterialDocumentsPanel: React.FC<MaterialDocumentsPanelProps> = ({
  materialId,
  materialName,
  supplierId,
  supplierName,
  className,
}) => {
  const contract = useMaterialDocumentAdapter(materialId, {
    materialName,
    supplierId,
    supplierName,
  });

  return (
    <div className="space-y-3">
      {(materialName || supplierName) && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span><T k="auto.materialdocumentspanel.contexte_applique_aux_nouveaux_documents" fallback="Contexte appliqué aux nouveaux documents :" /></span>
          {materialName && <Badge variant="secondary">{materialName}</Badge>}
          {supplierName && <Badge variant="outline">Fournisseur : {supplierName}</Badge>}
        </div>
      )}
      <DocumentHub contract={contract} className={className ?? 'min-h-[520px]'} />
    </div>
  );
};

export default MaterialDocumentsPanel;
