/**
 * PhaseQuantityTakeoffTab
 * Onglet Métré / DQE d'une phase : monte le module existant QuantityTakeoffs
 * (calcul des quantités + référentiel dqe-categories) au niveau projet,
 * et propose l'import direct d'un DQE Excel rattaché à la phase.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calculator, Upload } from 'lucide-react';
import QuantityTakeoffs from '@/components/project/QuantityTakeoffs';

import { BoqImportDialog } from '@/components/boq/BoqImportDialog';

interface PhaseQuantityTakeoffTabProps {
  phaseId: string;
  projectId: string;
  phaseName?: string;
}

const PhaseQuantityTakeoffTab: React.FC<PhaseQuantityTakeoffTabProps> = ({
  phaseId,
  projectId,
  phaseName,
}) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3 flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Métré & DQE
            {phaseName && (
              <Badge variant="outline" className="ml-2">
                Contexte : {phaseName}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <BoqImportDialog
              source="quantity_takeoff"
              contextId={projectId}
              phaseId={phaseId}
              title="Importer BOQ vers cette phase (PDF / Excel / CSV)"
              trigger={
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" /> Import BOQ
                </Button>
              }
            />
            <DQEImportDialog projectId={projectId} phaseId={phaseId} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Quantités calculées au niveau projet — les postes DQE (Terrassement, Revêtement,
            Génie Civil, etc.) suivent le référentiel{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">dqe-categories.referential.ts</code>.
            Utilisez « Importer DQE » pour charger un devis Excel et créer les métrés en masse.
          </p>
          <QuantityTakeoffs projectId={projectId} />
        </CardContent>
      </Card>
    </div>
  );
};

export default PhaseQuantityTakeoffTab;
