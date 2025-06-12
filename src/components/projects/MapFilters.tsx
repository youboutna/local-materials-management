
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { MapLocation } from '@/components/ProjectMap';
import { ProjectStatus } from '@/types/project';
import { MAURITANIA_REGIONS } from '@/types/mauritania';
import { MapPin } from 'lucide-react';

interface MapFiltersProps {
  locations: MapLocation[];
  onFilterChange: (filteredLocations: MapLocation[]) => void;
}

const MapFilters = ({ locations, onFilterChange }: MapFiltersProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  // Apply filters
  useEffect(() => {
    let filtered = [...locations];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    if (regionFilter !== 'all') {
      const selectedRegion = MAURITANIA_REGIONS.find(r => r.code === regionFilter);
      if (selectedRegion) {
        filtered = filtered.filter(item => 
          item.region?.toLowerCase().includes(selectedRegion.name.toLowerCase()) ||
          item.region?.toLowerCase().includes(selectedRegion.nameAr.toLowerCase())
        );
      }
    }
    
    onFilterChange(filtered);
  }, [statusFilter, regionFilter, locations, onFilterChange]);

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="status-filter" className="mb-2 block">Statut</Label>
            <Select 
              value={statusFilter} 
              onValueChange={setStatusFilter}
            >
              <SelectTrigger id="status-filter" className="w-full">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="en cours">En cours</SelectItem>
                <SelectItem value="terminé">Terminé</SelectItem>
                <SelectItem value="en attente">En attente</SelectItem>
                <SelectItem value="en inspection">En inspection</SelectItem>
                <SelectItem value="suspendu">Suspendu</SelectItem>
                <SelectItem value="annulé">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="region-filter" className="mb-2 block flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Région/Wilaya
            </Label>
            <Select 
              value={regionFilter} 
              onValueChange={setRegionFilter}
            >
              <SelectTrigger id="region-filter" className="w-full">
                <SelectValue placeholder="Filtrer par région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les régions</SelectItem>
                {MAURITANIA_REGIONS.map(region => (
                  <SelectItem key={region.code} value={region.code}>
                    {region.name} ({region.nameAr})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapFilters;
