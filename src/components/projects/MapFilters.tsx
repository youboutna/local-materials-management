import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { MapLocation } from '@/domain/entities/Location';
import { ProjectStatus } from '@/dtos/entities/ProjectDTO';
import { MAURITANIA_REGIONS, MAURITANIA_CITIES, GeographicUnit, Region, City } from '@/utils/mauritania';
import { 
  isLocationInRegion, 
  findRegionByLocation, 
  getCitiesByWilaya, 
  getWilayaByCode,
  getWilayaCapital,
  searchRegions,
  searchCities
} from '@/utils/mauritaniaUtils';
import { MapPin, Filter, Building, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MapFiltersProps {
  locations: MapLocation[];
  onFilterChange: (filteredLocations: MapLocation[]) => void;
}



const MapFilters = ({ locations, onFilterChange }: MapFiltersProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  // Get unique statuses from locations
  const availableStatuses = React.useMemo(() => {
    const statuses = new Set<string>();
    locations.forEach(location => {
      if (location.status) {
        statuses.add(location.status);
      }
    });
    return Array.from(statuses);
  }, [locations]);

  // Get budget range from projects
  const budgets = locations.map(p => p.budget ?? 0);
  const minBudget = Math.min(...budgets);
  const maxBudget = Math.max(...budgets);

  // Enhanced location matching using Mauritania utilities
  const matchesLocation = useCallback((itemLocation: string, selectedRegionCode: string): boolean => {
    if (!itemLocation || selectedRegionCode === 'all') return true;
    
    const selectedRegion = getWilayaByCode(selectedRegionCode);
    if (!selectedRegion) return false;
    
    // 1. Direct region matching using utility function
    if (isLocationInRegion(itemLocation, selectedRegion)) {
      return true;
    }
    
    // 2. Check if item location matches any city in the selected region
    const citiesInRegion = getCitiesByWilaya(selectedRegionCode);
    const cityMatch = citiesInRegion.some(city => {
      const cityNameMatch = itemLocation.toLowerCase().includes(city.name.toLowerCase()) ||
                           city.name.toLowerCase().includes(itemLocation.toLowerCase()) ||
                           itemLocation.toLowerCase().includes(city.nameAr.toLowerCase()) ||
                           city.nameAr.toLowerCase().includes(itemLocation.toLowerCase());
      
      // Check search terms if available
      if (city.searchTerms) {
        const searchMatch = city.searchTerms.some(term => 
          itemLocation.toLowerCase().includes(term.toLowerCase()) ||
          term.toLowerCase().includes(itemLocation.toLowerCase())
        );
        return cityNameMatch || searchMatch;
      }
      
      return cityNameMatch;
    });
    
    if (cityMatch) return true;
    
    // 3. Fallback: search for any region that matches the item location
    const matchingRegions = searchRegions(itemLocation);
    return matchingRegions.some(region => region.code === selectedRegionCode);
  }, []);
  
  // Get region statistics for enhanced UI
  const regionStats = useMemo(() => {
    return MAURITANIA_REGIONS.map(region => {
      const cities = getCitiesByWilaya(region.code);
      const capital = getWilayaCapital(region.code);
      return {
        ...region,
        cityCount: cities.length,
        hasCapital: !!capital,
        capitalName: capital?.name || 'N/A'
      };
    });
  }, []);
  
  // Get available regions based on current locations
  const availableRegions = useMemo(() => {
    const regionCodes = new Set<string>();
    locations.forEach(location => {
      if (location.region) {
        const matchedRegion = findRegionByLocation(location.region);
        if (matchedRegion) {
          regionCodes.add(matchedRegion.code);
        }
      }
    });
    return MAURITANIA_REGIONS.filter(region => regionCodes.has(region.code));
  }, [locations]);

  const filteredLocations = useMemo(() => {
    let filtered = locations;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    if (regionFilter !== 'all') {
      filtered = filtered.filter(item => matchesLocation(item.region || '', regionFilter));
    }
    return filtered;
  }, [locations, statusFilter, regionFilter, matchesLocation]);

  // Apply filters and update the parent component
  useEffect(() => {
    onFilterChange(filteredLocations);
  }, [filteredLocations, onFilterChange]);

  return (
    <Card className="mb-6 shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium">Filtres de la carte</h3>
          <Badge variant="secondary" className="ml-auto">
            {locations.length} projet{locations.length > 1 ? 's' : ''}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="status-filter" className="text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Statut du projet
            </Label>
            <Select 
              value={statusFilter} 
              onValueChange={setStatusFilter}
            >
              <SelectTrigger id="status-filter" className="w-full">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    Tous les statuts
                  </div>
                </SelectItem>
                {availableStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        status === 'en cours' ? 'bg-blue-500' :
                        status === 'terminé' ? 'bg-green-500' :
                        status === 'en attente' ? 'bg-yellow-500' :
                        status === 'en inspection' ? 'bg-purple-500' :
                        status === 'suspendu' ? 'bg-orange-500' :
                        status === 'annulé' ? 'bg-red-500' : 'bg-gray-500'
                      }`}></div>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {statusFilter !== 'all' && (
              <p className="text-xs text-muted-foreground">
                Filtré par: {statusFilter}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="region-filter" className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              Région/Wilaya
            </Label>
            <Select 
              value={regionFilter} 
              onValueChange={(value) => {
                console.log('MapFilters - Region filter changed to:', value);
                setRegionFilter(value);
              }}
            >
              <SelectTrigger id="region-filter" className="w-full">
                <SelectValue placeholder="Filtrer par région" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    Toutes les régions
                  </div>
                </SelectItem>
                {availableRegions.map(region => {
                  const stats = regionStats.find(s => s.code === region.code);
                  return (
                    <SelectItem key={region.code} value={region.code}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-green-600" />
                          <span className="font-medium">{region.name}</span>
                          {region.economicImportance === 'capital' && (
                            <Badge variant="secondary" className="text-xs px-1">Capitale</Badge>
                          )}
                          {region.economicImportance === 'economic' && (
                            <Badge variant="secondary" className="text-xs px-1">Économique</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pl-5">
                          <span>{region.nameAr}</span>
                          {stats && (
                            <>
                              <span>•</span>
                              <span>{stats.cityCount} villes</span>
                              {stats.hasCapital && (
                                <>
                                  <span>•</span>
                                  <span>Cap: {stats.capitalName}</span>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {regionFilter !== 'all' && (
              <p className="text-xs text-muted-foreground">
                Filtré par: {MAURITANIA_REGIONS.find(r => r.code === regionFilter)?.name}
                {(() => {
                  const stats = regionStats.find(s => s.code === regionFilter);
                  return stats ? ` (${stats.cityCount} villes)` : '';
                })()}
              </p>
            )}
          </div>

          {/* Results Summary */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              Résultats
            </Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">
                {(() => {
                  let count = locations.length;
                  
                  if (statusFilter !== 'all') {
                    count = locations.filter(item => item.status === statusFilter).length;
                  }
                  
                  if (regionFilter !== 'all') {
                    let filtered = locations;
                    if (statusFilter !== 'all') {
                      filtered = filtered.filter(item => item.status === statusFilter);
                    }
                    count = filtered.filter(item => matchesLocation(item.region || '', regionFilter)).length;
                  }
                  
                  return count;
                })()}
              </div>
              <div className="text-xs text-muted-foreground">
                projet{(() => {
                  let count = locations.length;
                  
                  if (statusFilter !== 'all') {
                    count = locations.filter(item => item.status === statusFilter).length;
                  }
                  
                  if (regionFilter !== 'all') {
                    let filtered = locations;
                    if (statusFilter !== 'all') {
                      filtered = filtered.filter(item => item.status === statusFilter);
                    }
                    count = filtered.filter(item => matchesLocation(item.region || '', regionFilter)).length;
                  }
                  
                  return count > 1 ? 's' : '';
                })()} affiché{(() => {
                  let count = locations.length;
                  
                  if (statusFilter !== 'all') {
                    count = locations.filter(item => item.status === statusFilter).length;
                  }
                  
                  if (regionFilter !== 'all') {
                    let filtered = locations;
                    if (statusFilter !== 'all') {
                      filtered = filtered.filter(item => item.status === statusFilter);
                    }
                    count = filtered.filter(item => matchesLocation(item.region || '', regionFilter)).length;
                  }
                  
                  return count > 1 ? 's' : '';
                })()}
              </div>
              
              {/* Enhanced Debug Info */}
              <div className="mt-2 text-xs text-gray-500 border-t pt-2">
                <div>Total disponible: {locations.length}</div>
                {regionFilter !== 'all' && (() => {
                  const region = getWilayaByCode(regionFilter);
                  const stats = regionStats.find(s => s.code === regionFilter);
                  return region ? (
                    <div>
                      <div>Région: {region.name}</div>
                      <div className="flex gap-2">
                        <span>{stats?.cityCount || 0} villes</span>
                        {stats?.hasCapital && <span>• Cap: {stats.capitalName}</span>}
                      </div>
                    </div>
                  ) : null;
                })()}
                {statusFilter !== 'all' && <div>Statut: {statusFilter}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(statusFilter !== 'all' || regionFilter !== 'all') && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Filtres actifs:</span>
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Statut: {statusFilter}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    title="Supprimer ce filtre"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {regionFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Région: {MAURITANIA_REGIONS.find(r => r.code === regionFilter)?.name}
                  <button
                    onClick={() => setRegionFilter('all')}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    title="Supprimer ce filtre"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MapFilters;
