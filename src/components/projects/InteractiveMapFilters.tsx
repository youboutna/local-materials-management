import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Filter, MapPin, DollarSign, Target } from 'lucide-react';
import { ProjectData } from '@/dtos/entities/ProjectDTO';
import { MAURITANIA_REGIONS, GeographicUnit } from '@/utils/mauritania';
import { isLocationInRegion, findRegionByLocation } from '@/utils/mauritaniaUtils';
import { getProjectCoordinates } from '@/utils/projectLocationBuckets';

interface InteractiveMapFiltersProps {
  projects: ProjectData[];
  onFiltersChange: (filteredProjects: ProjectData[]) => void;
}

const InteractiveMapFilters: React.FC<InteractiveMapFiltersProps> = ({
  projects,
  onFiltersChange
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 100000000]);
  const [gpsLatRange, setGpsLatRange] = useState<[number, number]>([10, 30]);
  const [gpsLngRange, setGpsLngRange] = useState<[number, number]>([-25, 0]);

  // Get unique statuses from projects
  const availableStatuses = [...new Set(projects.map(p => p.status))];
  
  // Get budget range from projects
  const budgets = projects.map(p => p.budget);
  const minBudget = Math.min(...budgets);
  const maxBudget = Math.max(...budgets);

  const applyFilters = useCallback(() => {
    const filtered = projects.filter(project => {
      // Region filter
      if (selectedRegion !== 'all' && project.location) {
        const region = MAURITANIA_REGIONS.find(r => r.code === selectedRegion);
        if (region) {
          return isLocationInRegion(project.location, region);
        }
      }

      // Status filter
      if (selectedStatus !== 'all' && project.status !== selectedStatus) {
        return false;
      }

      // Budget filter
      if (project.budget < budgetRange[0] || project.budget > budgetRange[1]) {
        return false;
      }

      // GPS coordinates filter
      const coords = getProjectCoordinates(project);
      if (coords) {
        if (coords.latitude < gpsLatRange[0] || 
            coords.latitude > gpsLatRange[1] ||
            coords.longitude < gpsLngRange[0] || 
            coords.longitude > gpsLngRange[1]) {
          return false;
        }
      }

      return true;
    });
    onFiltersChange(filtered);
  }, [selectedRegion, selectedStatus, budgetRange, gpsLatRange, gpsLngRange, projects]);

  const resetFilters = () => {
    setSelectedRegion('all');
    setSelectedStatus('all');
    setBudgetRange([minBudget, maxBudget]);
    setGpsLatRange([10, 30]);
    setGpsLngRange([-25, 0]);
    onFiltersChange(projects);
  };

  React.useEffect(() => {
    applyFilters();
  }, [applyFilters, selectedRegion, selectedStatus, budgetRange, gpsLatRange, gpsLngRange, projects, onFiltersChange]);

  return (
    <Card className="bg-gradient-to-br from-card via-card/90 to-muted/20 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          Filtres Carte Interactive
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Region Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Région
            </Label>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les régions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les régions</SelectItem>
                {MAURITANIA_REGIONS.map((region) => (
                  <SelectItem key={region.code} value={region.code}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Budget Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
                 <DollarSign className="h-4 w-4 text-success" />
              Budget (MRU)
            </Label>
            <div className="px-2">
              <Slider
                value={budgetRange}
                onValueChange={(value) => setBudgetRange(value as [number, number])}
                min={minBudget}
                max={maxBudget}
                step={1000000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{(budgetRange[0] / 1000000).toFixed(1)}M</span>
                <span>{(budgetRange[1] / 1000000).toFixed(1)}M</span>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button variant="outline" onClick={resetFilters} className="w-full">
              Réinitialiser
            </Button>
          </div>
        </div>

        {/* GPS Coordinates Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Latitude ({gpsLatRange[0].toFixed(2)}° à {gpsLatRange[1].toFixed(2)}°)
            </Label>
            <div className="px-2">
              <Slider
                value={gpsLatRange}
                onValueChange={(value) => setGpsLatRange(value as [number, number])}
                min={10}
                max={30}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Longitude ({gpsLngRange[0].toFixed(2)}° à {gpsLngRange[1].toFixed(2)}°)
            </Label>
            <div className="px-2">
              <Slider
                value={gpsLngRange}
                onValueChange={(value) => setGpsLngRange(value as [number, number])}
                min={-25}
                max={0}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveMapFilters;