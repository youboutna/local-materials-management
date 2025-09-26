import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck } from 'lucide-react';
import EmployeeSelector from '@/components/selectors/EmployeeSelector';
import SimpleSupplierSelector from '@/components/selectors/SimpleSupplierSelector';

interface TeamContractorsStepProps {
  formData: any;
  onUpdate: (data: any) => void;
  isEditing?: boolean;
}

const TeamContractorsStep: React.FC<TeamContractorsStepProps> = ({
  formData,
  onUpdate,
  isEditing = false
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-orange-500" />
          Équipe & Contractants
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Contractant principal */}
          <div>
            <label className="block text-sm font-medium mb-2">Contractant principal *</label>
            <SimpleSupplierSelector
              value={formData.main_contractor || ''}
              onChange={(value) => onUpdate({ main_contractor: value })}
              placeholder="Sélectionner le contractant principal"
            />
          </div>

          {/* Ingénieur conseil */}
          <div>
            <label className="block text-sm font-medium mb-2">Ingénieur conseil</label>
            <input 
              type="text" 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Nom de l'ingénieur conseil"
              value={formData.engineering_consultant || ''}
              onChange={(e) => onUpdate({ engineering_consultant: e.target.value })}
            />
          </div>

          {/* Sous-traitants */}
          <div>
            <label className="block text-sm font-medium mb-2">Sous-traitants</label>
            <div className="space-y-3">
              <SimpleSupplierSelector
                value={formData.subcontractor_1 || ''}
                onChange={(value) => onUpdate({ subcontractor_1: value })}
                placeholder="Sous-traitant 1"
              />
              <SimpleSupplierSelector
                value={formData.subcontractor_2 || ''}
                onChange={(value) => onUpdate({ subcontractor_2: value })}
                placeholder="Sous-traitant 2"
              />
            </div>
          </div>

          {/* Équipe interne */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Équipe Interne</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Responsable technique</label>
                <EmployeeSelector
                  value={formData.technical_manager || ''}
                  onChange={(value) => onUpdate({ technical_manager: value })}
                  placeholder="Sélectionner le responsable technique"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Superviseur de chantier</label>
                <EmployeeSelector
                  value={formData.site_supervisor || ''}
                  onChange={(value) => onUpdate({ site_supervisor: value })}
                  placeholder="Sélectionner le superviseur"
                />
              </div>
            </div>
          </div>

          {/* Taille de l'équipe */}
          <div>
            <label className="block text-sm font-medium mb-2">Taille de l'équipe estimée</label>
            <input 
              type="number" 
              min="1"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Nombre de personnes"
              value={formData.team_size || ''}
              onChange={(e) => onUpdate({ team_size: parseInt(e.target.value) })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamContractorsStep;