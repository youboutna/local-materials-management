import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import UserSelector from '@/components/selectors/UserSelector';
import EmployeeSelector from '@/components/selectors/EmployeeSelector';

interface StakeholdersStepProps {
  formData: any;
  onUpdate: (data: any) => void;
  isEditing?: boolean;
}

const StakeholdersStep: React.FC<StakeholdersStepProps> = ({
  formData,
  onUpdate,
  isEditing = false
}) => {
  const handleStakeholderChange = (stakeholders: any[]) => {
    onUpdate({ stakeholders });
  };

  const handleProjectManagerChange = (projectManager: string) => {
    onUpdate({ project_responsable_id: projectManager });
  };

  const handleClientChange = (client: string) => {
    onUpdate({ client: client });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-green-500" />
          Parties Prenantes du Projet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Chef de projet */}
          <div>
            <label className="block text-sm font-medium mb-2">Chef de projet *</label>
            <EmployeeSelector
              value={formData.project_responsable_id || ''}
              onChange={handleProjectManagerChange}
              placeholder="Sélectionner le chef de projet"
            />
          </div>

          {/* Client */}
          <div>
            <label className="block text-sm font-medium mb-2">Client</label>
            <UserSelector
              value={formData.client || ''}
              onChange={handleClientChange}
              placeholder="Sélectionner le client"
            />
          </div>

          {/* Autres parties prenantes */}
          <div>
            <label className="block text-sm font-medium mb-2">Autres parties prenantes</label>
            <div className="space-y-3">
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium mb-2">Équipe projet</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Sélectionnez les membres de l'équipe qui participeront au projet
                </p>
                {/* Component for selecting multiple stakeholders could be added here */}
                <div className="text-sm text-blue-600">
                  {formData.stakeholders?.length || 0} partie(s) prenante(s) sélectionnée(s)
                </div>
              </div>
            </div>
          </div>

          {/* Rôles et responsabilités */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Rôles et Responsabilités</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Superviseur technique</label>
                <EmployeeSelector
                  value={formData.technical_supervisor || ''}
                  onChange={(value) => onUpdate({ technical_supervisor: value })}
                  placeholder="Sélectionner le superviseur"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Responsable qualité</label>
                <EmployeeSelector
                  value={formData.quality_manager || ''}
                  onChange={(value) => onUpdate({ quality_manager: value })}
                  placeholder="Sélectionner le responsable qualité"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StakeholdersStep;