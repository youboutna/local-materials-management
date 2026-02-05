
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ProjectDTO } from "@/dtos/entities/ProjectDTO";
import { MAURITANIA_REGIONS } from "@/types/mauritania";
import { MapPin, Building2, TrendingUp, Users } from "lucide-react";

interface RegionalDashboardProps {
  projects: ProjectDTO[];
  materials?: any[];
  workspaces?: any[];
}

const RegionalDashboard = ({ projects, materials = [], workspaces = [] }: RegionalDashboardProps) => {
  // Calculate regional statistics
  const regionalStats = useMemo(() => {
    return MAURITANIA_REGIONS.map(region => {
      // Filter projects for this region
      const regionProjects = projects.filter(project => 
        project.location?.toLowerCase().includes(region.name.toLowerCase()) ||
        project.location?.toLowerCase().includes(region.nameAr.toLowerCase())
      );

      // Filter materials for this region
      const regionMaterials = materials.filter(material => 
        material.origin_location?.toLowerCase().includes(region.name.toLowerCase()) ||
        material.origin_location?.toLowerCase().includes(region.nameAr.toLowerCase())
      );

      // Filter workspaces for this region
      const regionWorkspaces = workspaces.filter(workspace => 
        workspace.location?.toLowerCase().includes(region.name.toLowerCase()) ||
        workspace.location?.toLowerCase().includes(region.nameAr.toLowerCase())
      );

      // Calculate metrics
      const totalBudget = regionProjects.reduce((sum, project) => sum + project.budget, 0);
      const avgProgress = regionProjects.length > 0 
        ? regionProjects.reduce((sum, project) => sum + project.progress, 0) / regionProjects.length
        : 0;
      
      const activeProjects = regionProjects.filter(p => p.status === 'en cours').length;
      const completedProjects = regionProjects.filter(p => p.status === 'terminé').length;

      return {
        region,
        projectCount: regionProjects.length,
        materialCount: regionMaterials.length,
        workspaceCount: regionWorkspaces.length,
        totalBudget,
        avgProgress: Math.round(avgProgress),
        activeProjects,
        completedProjects,
        projects: regionProjects
      };
    }).filter(stat => stat.projectCount > 0 || stat.materialCount > 0 || stat.workspaceCount > 0);
  }, [projects, materials, workspaces]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <MapPin className="h-6 w-6 text-terracotta-500" />
        <h2 className="text-2xl font-bold text-adrar-900">Tableau de Bord Régional</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {regionalStats.map(stat => (
          <Card key={stat.region.code} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-adrar-800">
                  {stat.region.name}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {stat.region.nameAr}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Building2 className="h-4 w-4 text-terracotta-500" />
                    <span className="text-2xl font-bold text-adrar-800">
                      {stat.projectCount}
                    </span>
                  </div>
                  <p className="text-xs text-adrar-600">Projets</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="h-4 w-4 text-terracotta-500" />
                    <span className="text-2xl font-bold text-adrar-800">
                      {stat.workspaceCount}
                    </span>
                  </div>
                  <p className="text-xs text-adrar-600">Espaces</p>
                </div>
              </div>

              {/* Progress Bar */}
              {stat.projectCount > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-adrar-600">Progression moyenne</span>
                    <span className="font-medium text-adrar-800">{stat.avgProgress}%</span>
                  </div>
                  <Progress value={stat.avgProgress} className="h-2" />
                </div>
              )}

              {/* Project Status */}
              {stat.projectCount > 0 && (
                <div className="flex justify-between text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">{stat.activeProjects}</div>
                    <div className="text-xs text-adrar-600">En cours</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-600">{stat.completedProjects}</div>
                    <div className="text-xs text-adrar-600">Terminés</div>
                  </div>
                </div>
              )}

              {/* Budget Information */}
              {stat.totalBudget > 0 && (
                <div className="pt-2 border-t border-sandstone-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-terracotta-500" />
                    <div>
                      <div className="font-semibold text-adrar-800">
                        {stat.totalBudget.toLocaleString('fr-FR')} MRU
                      </div>
                      <div className="text-xs text-adrar-600">Budget total</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Materials Count */}
              {stat.materialCount > 0 && (
                <div className="text-center pt-2 border-t border-sandstone-200">
                  <div className="font-semibold text-adrar-800">{stat.materialCount}</div>
                  <div className="text-xs text-adrar-600">Matériaux disponibles</div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {regionalStats.length === 0 && (
        <Card className="p-8 text-center">
          <MapPin className="h-12 w-12 text-adrar-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-adrar-800 mb-2">
            Aucune donnée régionale disponible
          </h3>
          <p className="text-adrar-600">
            Ajoutez des projets, matériaux ou espaces de travail pour voir les statistiques régionales.
          </p>
        </Card>
      )}
    </div>
  );
};

export default RegionalDashboard;
