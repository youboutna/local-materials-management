/**
 * PhaseQuantityTakeoffTab
 * Onglet Métré / DQE d'une phase : monte le module existant QuantityTakeoffs
 * (calcul des quantités + référentiel dqe-categories) au niveau projet,
 * tout en affichant le contexte de phase courant.
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
  projectId,
  phaseName,
}) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Métré & DQE
            {phaseName && (
              <Badge variant="outline" className="ml-2">
                Contexte : {phaseName}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Quantités calculées au niveau projet — les postes DQE (Terrassement, Revêtement,
            Génie Civil, etc.) suivent le référentiel{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">dqe-categories.referential.ts</code>.
          </p>
          <QuantityTakeoffs projectId={projectId} />
        </CardContent>
      </Card>
    </div>
  );
};

export default PhaseQuantityTakeoffTab;
