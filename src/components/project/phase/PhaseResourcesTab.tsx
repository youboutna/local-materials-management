/**
 * PhaseResourcesTab
 * Onglet ressources d'une phase : matériaux + main d'œuvre.
 * Branche les composants existants PhaseMaterials et PhaseEmployees
 * (aucun nouveau service — voir mem://architecture/utility-service-orchestration).
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users } from 'lucide-react';
import PhaseMaterials from '@/components/project/PhaseMaterials';
import PhaseEmployees from '@/components/project/PhaseEmployees';

interface PhaseResourcesTabProps {
  phaseId: string;
  projectId: string;
}

const PhaseResourcesTab: React.FC<PhaseResourcesTabProps> = ({ phaseId, projectId }) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Matériaux
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PhaseMaterials phaseId={phaseId} projectId={projectId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Main d'œuvre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PhaseEmployees phaseId={phaseId} />
        </CardContent>
      </Card>
    </div>
  );
};

export default PhaseResourcesTab;
