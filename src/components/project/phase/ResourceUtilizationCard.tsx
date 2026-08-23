/**
 * ResourceUtilizationCard Component
 * Displays resource utilization metrics for a phase
 * Max 150 lines following SRP
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Package, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ProjectDataCalculations } from "@/utils/projectDataCalculations";
import { ProjectCalculationService } from "@/application/services/ProjectCalculationService";
import { T } from '@/components/i18n/T';

interface ResourceUtilizationCardProps {
  phaseId: string;
  projectId: string;
}

const ResourceUtilizationCard: React.FC<ResourceUtilizationCardProps> = ({ phaseId, projectId }) => {
  const { data: resources, isLoading } = useQuery({
    queryKey: ['phase-resources', projectId, phaseId],
    queryFn: () => ProjectCalculationService.calculatePhaseResourceUtilization(projectId, phaseId),
    enabled: !!projectId && !!phaseId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium"><T k="auto.resourceutilizationcard.utilisation_ressources" fallback="Utilisation ressources" /></CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!resources) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium"><T k="auto.resourceutilizationcard.utilisation_ressources" fallback="Utilisation ressources" /></CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            <T k="auto.resourceutilizationcard.aucune_donnee_de_ressources_disponible" fallback="Aucune donnée de ressources disponible" />
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium"><T k="auto.resourceutilizationcard.utilisation_ressources" fallback="Utilisation ressources" /></CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium"><T k="auto.resourceutilizationcard.equipe" fallback="Équipe" /></span>
            </div>
            <p className="text-2xl font-bold">{resources.totalEmployees}</p>
            <p className="text-xs text-muted-foreground">personnes assignées</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium"><T k="auto.resourceutilizationcard.materiaux" fallback="Matériaux" /></span>
            </div>
            <p className="text-2xl font-bold">{resources.totalMaterials}</p>
            <p className="text-xs text-muted-foreground">unités utilisées</p>
          </div>
        </div>
        
        {(resources.efficiency < 50 || resources.totalEmployees === 0) && (
          <Alert className="py-2 border-warning/30 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-xs text-warning">
              <T k="auto.resourceutilizationcard.ressources_limitees_detectees" fallback="Ressources limitées détectées" />
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ResourceUtilizationCard;
