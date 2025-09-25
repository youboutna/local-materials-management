// components/project/TeamOverview.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TeamOverviewProps {
  resources: any[];
  projectId: string;
}

const TeamOverview: React.FC<TeamOverviewProps> = ({ resources, projectId }) => {
  const navigate = useNavigate();
  
  // Group resources by type
  const humanResources = resources.filter(r => r.type === 'human');
  const equipmentResources = resources.filter(r => r.type === 'equipment');
  const materialResources = resources.filter(r => r.type === 'material');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Équipe et ressources (délégation publique)</h3>
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>👥 Employés</span>
            <span>🏢 Consultants</span>
            <span>🚧 Contractants</span>
          </div>
        </div>
      </div>

      {/* Human Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Ressources humaines ({humanResources.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {humanResources.map((resource, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <h4 className="font-medium">{resource.name}</h4>
                <p className="text-sm text-muted-foreground">{resource.position || resource.role}</p>
                <div className="flex justify-between items-center mt-2">
                  <Badge variant="outline">{resource.costPerHour} MRU/h</Badge>
                  <span className="text-xs text-muted-foreground">
                    {resource.availability}% disponible
                  </span>
                </div>
              </div>
            ))}
          </div>
          {humanResources.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Aucune ressource humaine assignée
            </p>
          )}
        </CardContent>
      </Card>

      {/* Equipment Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Équipements ({equipmentResources.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipmentResources.map((resource, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <h4 className="font-medium">{resource.name}</h4>
                <div className="flex justify-between items-center mt-2">
                  <Badge variant="outline">{resource.costPerHour} MRU/h</Badge>
                  <span className="text-xs text-muted-foreground">
                    {resource.availability}% disponible
                  </span>
                </div>
              </div>
            ))}
          </div>
          {equipmentResources.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Aucun équipement assigné
            </p>
          )}
        </CardContent>
      </Card>

      {/* Material Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Matériaux ({materialResources.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materialResources.map((resource, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <h4 className="font-medium">{resource.name}</h4>
                <div className="flex justify-between items-center mt-2">
                  <Badge variant="outline">{resource.costPerHour} MRU/unité</Badge>
                  <span className="text-xs text-muted-foreground">
                    {resource.availability}% disponible
                  </span>
                </div>
              </div>
            ))}
          </div>
          {materialResources.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Aucun matériau assigné
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamOverview;