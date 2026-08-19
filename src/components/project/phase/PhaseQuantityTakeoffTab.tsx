/**
 * PhaseQuantityTakeoffTab
 * Onglet Métré / DQE d'une phase. Les métrés sont calculés automatiquement
 * (matériaux + moteur de métré unifié) et toutes les actions d'écriture
 * (import BOQ, génération DQE, saisie de lignes) sont portées par le module
 * DQE monté dans `QuantityTakeoffs` — aucune action dupliquée à ce niveau.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  <div className="space-y-4">
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Calculator className="h-4 w-4 text-primary" />
          Métré &amp; DQE
          {phaseName && (
            <Badge variant="outline" className="max-w-full truncate">
              Contexte : {phaseName}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Les quantités sont calculées automatiquement depuis les ressources et le moteur de
          métré (types d'ouvrage, déduction des ouvertures, recommandations). L'ajout de lignes
          passe par le module DQE, avec workflow de validation puis dispatching vers les
          phases, ressources et tâches.
        </p>
        <QuantityTakeoffs projectId={projectId} phaseId={phaseId} />
      </CardContent>
    </Card>
  </div>
);

export default PhaseQuantityTakeoffTab;
