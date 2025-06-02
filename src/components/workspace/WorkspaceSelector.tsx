
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Building } from 'lucide-react';
import { Location, OperationalStatus } from '@/types/mauritania';

interface Workspace {
  id: string;
  name: string;
  location: Location;
  status: OperationalStatus;
  contact?: {
    manager: string;
    phone: string;
  };
  facilities?: string[];
}

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
  selectedWorkspaceId?: string;
  onWorkspaceChange: (workspaceId: string) => void;
  showDetails?: boolean;
}

const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  workspaces,
  selectedWorkspaceId,
  onWorkspaceChange,
  showDetails = false
}) => {
  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Espace de travail
        </label>
        <Select value={selectedWorkspaceId} onValueChange={onWorkspaceChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un espace de travail" />
          </SelectTrigger>
          <SelectContent>
            {workspaces.map(workspace => (
              <SelectItem key={workspace.id} value={workspace.id}>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>{workspace.name}</span>
                  <span className="text-gray-500">- {workspace.location}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    workspace.status === OperationalStatus.active 
                      ? 'bg-green-100 text-green-800' 
                      : workspace.status === OperationalStatus.inactive
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {workspace.status}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showDetails && selectedWorkspace && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="h-5 w-5" />
              {selectedWorkspace.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{selectedWorkspace.location}</span>
            </div>

            {selectedWorkspace.contact && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Contact:</p>
                <p className="text-sm text-gray-600">{selectedWorkspace.contact.manager}</p>
                <p className="text-sm text-gray-600">{selectedWorkspace.contact.phone}</p>
              </div>
            )}

            {selectedWorkspace.facilities && selectedWorkspace.facilities.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Installations:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedWorkspace.facilities.map((facility, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {facility}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedWorkspace.status === OperationalStatus.active 
                  ? 'bg-green-100 text-green-800' 
                  : selectedWorkspace.status === OperationalStatus.inactive
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {selectedWorkspace.status === OperationalStatus.active ? 'Actif' :
                 selectedWorkspace.status === OperationalStatus.inactive ? 'Inactif' : 'Fermé'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkspaceSelector;
