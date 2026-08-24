/**
 * PhaseQuantityTakeoffTab
 * Onglet Métré / DQE d'une phase. Les métrés sont calculés automatiquement
 * (ressources + moteur de métré) et affichés comme lignes DQE dans
 * `QuantityTakeoffs` : aucune liste séparée ni action dupliquée ici.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calculator } from 'lucide-react';
import QuantityTakeoffs from '@/components/project/QuantityTakeoffs';

interface PhaseQuantityTakeoffTabProps {
  phaseId: string;
  projectId: string;
  phaseName?: string;
}

const PhaseQuantityTakeoffTab: React.FC<PhaseQuantityTakeoffTabProps> = ({
  phaseId,
  projectId,
  phaseName,
}) => (
  <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
      <Calculator className="h-4 w-4 text-primary" />
      Métré &amp; DQE
      {phaseName && (
        <Badge variant="outline" className="max-w-full truncate">
          Contexte : {phaseName}
        </Badge>
      )}
    </div>
    <QuantityTakeoffs projectId={projectId} phaseId={phaseId} />
  </div>
);

export default PhaseQuantityTakeoffTab;
