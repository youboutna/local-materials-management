import React, { useState } from 'react';
import { Check, ChevronsUpDown, Building, MapPin, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MAURITANIA_REGIONS } from '@/utils/mauritania';
import { getAllGeographicUnits, getRegionsWithCapitals, getRegionsWithPorts, getRegionsWithUniversities } from '@/utils/mauritaniaUtils';
import { GeographicUnit } from '@/utils/mauritania';
import { toast } from '@/hooks/use-toast';
import UnifiedLocationSelector from '../location/UnifiedLocationSelector';
import { WorkspaceDTO } from '@/dtos/entities/WorkspaceDTO';
import { OperationalStatus } from '@/domain/entities/Workspace';


interface WorkspaceSelectorProps {
  workspaces: WorkspaceDTO[];
  selectedWorkspaceId?: string;
  onWorkspaceChange: (workspaceId: string) => void;
  onLocationChange?: (workspace: WorkspaceDTO) => void;
  onLocationSearch?: (locationData: {
    address?: string;
    latitude?: number;
    longitude?: number;
    regionCode?: string;
    cityCode?: string;
  }) => void;
  showDetails?: boolean;
  showLocationSearch?: boolean;
}

const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  workspaces,
  selectedWorkspaceId,
  onWorkspaceChange,
  onLocationChange,
  onLocationSearch,
  showDetails = false,
  showLocationSearch = false
}) => {
  const [open, setOpen] = useState(false);
  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);
  

  const regions = getRegionsWithCapitals();
  
  const handleRegionSelect = (regionCode: string) => {
    const region = getRegionsWithCapitals().find(r => r.code === regionCode);
    if (!region) return undefined;
    
    console.log(`Selected region: ${region.name} (${region.code})`);
    toast({
      title: "Région sélectionnée",
      description: `Vous avez sélectionné la région: ${region.name}`,
      variant: "default"
    });
  };

  const handleWorkspaceChange = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    onWorkspaceChange(workspaceId);
    
    // Notify parent about workspace change for map focusing and form updates
    if (workspace && onLocationChange) {
      onLocationChange(workspace);
    }
    setOpen(false);
  };

  const getStatusIcon = (status?: string | OperationalStatus) => {
    const statusValue = status as OperationalStatus;
    switch (statusValue) {
      case OperationalStatus.active:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case OperationalStatus.inactive:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case OperationalStatus.closed:
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status?: string | OperationalStatus) => {
    const statusValue = status as OperationalStatus;
    switch (statusValue) {
      case OperationalStatus.active:
        return 'Actif';
      case OperationalStatus.inactive:
        return 'Inactif';
      case OperationalStatus.closed:
        return 'Fermé';
      default:
        return 'Inconnu';
    }
  };

  const getStatusColor = (status?: string | OperationalStatus) => {
    const statusValue = status as OperationalStatus;
    switch (statusValue) {
      case OperationalStatus.active:
        return 'bg-green-100 text-green-800 border-green-200';
      case OperationalStatus.inactive:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OperationalStatus.closed:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Log workspace data for debugging
  React.useEffect(() => {
    console.log('Available workspaces:', workspaces);
    console.log('Selected workspace ID:', selectedWorkspaceId);
  }, [workspaces, selectedWorkspaceId]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Espace de travail
        </label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between min-h-[60px] text-left"
            >
              {selectedWorkspace ? (
                <div className="flex items-start gap-3 w-full">
                  <Building className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{selectedWorkspace.name}</span>
                      {getStatusIcon(selectedWorkspace.status)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{typeof selectedWorkspace.location === 'string' ? selectedWorkspace.location : selectedWorkspace.location.name}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <Building className="h-4 w-4" />
                  <span>Sélectionner un espace de travail</span>
                </div>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
            <Command>
              <CommandInput placeholder="Rechercher un espace de travail..." />
              <CommandEmpty>
                {workspaces.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun espace de travail disponible</p>
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <p>Aucun espace de travail trouvé</p>
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {workspaces.map((workspace) => (
                  <CommandItem
                    key={workspace.id}
                    value={`${workspace.name} ${workspace.location}`}
                    onSelect={() => handleWorkspaceChange(workspace.id)}
                    className="min-h-[60px] py-3"
                  >
                    <div className="flex items-start gap-3 w-full">
                      <Building className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">{workspace.name}</span>
                          {getStatusIcon(workspace.status)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{typeof workspace.location === 'string' ? workspace.location : workspace.location.name}</span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(workspace.status)}`}>
                          {getStatusLabel(workspace.status)}
                        </span>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedWorkspaceId === workspace.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        
        {workspaces.length === 0 && (
          <p className="text-sm text-red-600 mt-2">
            Aucun espace de travail configuré. Veuillez contacter l'administrateur.
          </p>
        )}
      </div>

      {showLocationSearch && (
        <div className="mt-4">
          <LocationAutocomplete
            value=""
            onChange={(address, locationData) => {
              if (onLocationSearch && locationData) {
                onLocationSearch({
                  address,
                  latitude: locationData.coordinates?.lat,
                  longitude: locationData.coordinates?.lng,
                  regionCode: locationData.type === 'region' ? locationData.code : locationData.parentCode,
                  cityCode: locationData.type === 'city' ? locationData.code : undefined
                });
              }
            }}
            placeholder="Rechercher une localisation pour les espaces de travail..."
            filter="all"
            className="w-full"
          />
        </div>
      )}

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
              <span>{typeof selectedWorkspace.location === 'string' ? selectedWorkspace.location : selectedWorkspace.location.name}</span>
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
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedWorkspace.status)}`}>
                {getStatusIcon(selectedWorkspace.status)}
                <span className="ml-1">{getStatusLabel(selectedWorkspace.status)}</span>
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkspaceSelector;
