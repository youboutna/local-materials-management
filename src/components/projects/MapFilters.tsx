
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
import { MapPin, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MapFiltersProps {
  locations: MapLocation[];
  onFilterChange: (filteredLocations: MapLocation[]) => void;
}

// Enhanced mapping of cities/locations to their respective regions
const CITY_TO_REGION_MAP: Record<string, string[]> = {
  'ADR': ['adrar', 'atar', 'chinguetti', 'ouadane'], // Adrar
  'ASA': ['kifa', 'guerou', 'barkeol'], // Assaba  
  'BRK': ['aleg', 'magta lahjar', 'matka lahjar', 'boghé', 'boghe'], // Brakna
  'DKN': ['nouadhibou', 'dakhlet nouadhibou'], // Dakhlet Nouadhibou
  'GOG': ['kaédi', 'kaedi', 'maghama', 'monguel'], // Gorgol
  'GDM': ['sélibaby', 'selibaby', 'ghabou', 'ould yengé', 'ould yenge'], // Guidimaka
  'HEC': ['néma', 'nema', 'bassiknou', 'amourj'], // Hodh Ech Chargui
  'HEG': ['aioun', 'ayoun', 'ayoun el atrous', 'tintane', 'kobani'], // Hodh El Gharbi
  'INC': ['akjoujt', 'benichab'], // Inchiri
  'NKC': ['nouakchott', 'nkc'], // Nouakchott
  'NDB': ['nouadhibou', 'ndb'], // Nouadhibou (alternative)
  'TGT': ['tidjikja', 'moudjéria', 'moudjerria', 'rachid'], // Tagant
  'TZM': ['zouerate', 'fderick', 'fderik'], // Tiris Zemmour
  'TRR': ['rosso', 'boutilimit', 'rkiz'] // Trarza
};

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

  // Enhanced region matching function
  const matchesRegion = (itemRegion: string, selectedRegionCode: string): boolean => {
    if (!itemRegion) return false;
    
    const itemRegionLower = itemRegion.toLowerCase().trim();
    const selectedRegion = MAURITANIA_REGIONS.find(r => r.code === selectedRegionCode);
    
    if (!selectedRegion) return false;
    
    const regionName = selectedRegion.name.toLowerCase().trim();
    const regionNameAr = selectedRegion.nameAr.toLowerCase().trim();
    
    console.log(`Matching "${itemRegionLower}" against region "${regionName}" (${selectedRegionCode})`);
    
    // 1. Direct exact matches
    if (itemRegionLower === regionName || itemRegionLower === regionNameAr) {
      console.log('✓ Exact match found');
      return true;
    }
    
    // 2. Check if the item location is a known city in this region
    const citiesInRegion = CITY_TO_REGION_MAP[selectedRegionCode] || [];
    const cityMatch = citiesInRegion.some(city => {
      const match = itemRegionLower.includes(city.toLowerCase()) || 
                   city.toLowerCase().includes(itemRegionLower) ||
                   itemRegionLower === city.toLowerCase();
      if (match) console.log(`✓ City match found: "${city}"`);
      return match;
    });
    
    if (cityMatch) {
      return true;
    }
    
    // 3. Partial name matching (contains)
    const partialMatch = itemRegionLower.includes(regionName) || 
                        itemRegionLower.includes(regionNameAr) ||
                        regionName.includes(itemRegionLower) ||
                        regionNameAr.includes(itemRegionLower);
    
    if (partialMatch) {
      console.log('✓ Partial match found');
      return true;
    }
    
    // 4. Clean matches (remove common administrative words)
    const cleanItemRegion = itemRegionLower.replace(/wilaya|région|province|governorate|commune/gi, '').trim();
    const cleanRegionName = regionName.replace(/wilaya|région|province|governorate/gi, '').trim();
    
    if (cleanItemRegion === cleanRegionName) {
      console.log('✓ Clean match found');
      return true;
    }
    
    // 5. Word-by-word matching
    const regionWords = regionName.split(' ').filter(word => word.length > 2);
    const itemWords = itemRegionLower.split(' ').filter(word => word.length > 2);
    
    const wordMatch = regionWords.some(word => 
      itemWords.some(itemWord => 
        itemWord.includes(word) || word.includes(itemWord)
      )
    );
    
    if (wordMatch) {
      console.log('✓ Word match found');
    } else {
      console.log('✗ No match found');
    }
    
    return wordMatch;
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...locations];
    
    console.log('MapFilters - Starting with locations:', filtered.length);
    console.log('MapFilters - Filter settings:', { statusFilter, regionFilter });
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
      console.log('MapFilters - After status filter:', filtered.length);
    }
    
    if (regionFilter !== 'all') {
      const selectedRegion = MAURITANIA_REGIONS.find(r => r.code === regionFilter);
      if (selectedRegion) {
        console.log('MapFilters - Selected region:', selectedRegion);
        console.log('MapFilters - Cities in this region:', CITY_TO_REGION_MAP[regionFilter] || []);
        
        const beforeRegionFilter = filtered.length;
        filtered = filtered.filter(item => {
          const matches = matchesRegion(item.region || '', regionFilter);
          return matches;
        });
        
        console.log(`MapFilters - Region filter: ${beforeRegionFilter} → ${filtered.length} locations`);
      }
    }
    
    console.log('MapFilters - Final filtered locations:', filtered.length);
    onFilterChange(filtered);
  }, [statusFilter, regionFilter, locations, onFilterChange]);

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
                {MAURITANIA_REGIONS.map(region => (
                  <SelectItem key={region.code} value={region.code}>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-green-600" />
                        <span className="font-medium">{region.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground pl-5">
                        {region.nameAr}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {regionFilter !== 'all' && (
              <p className="text-xs text-muted-foreground">
                Filtré par: {MAURITANIA_REGIONS.find(r => r.code === regionFilter)?.name}
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
                {locations.length}
              </div>
              <div className="text-xs text-muted-foreground">
                projet{locations.length > 1 ? 's' : ''} affiché{locations.length > 1 ? 's' : ''}
              </div>
              
              {/* Debug info */}
              <div className="mt-2 text-xs text-gray-500 border-t pt-2">
                <div>Total disponible: {locations.length}</div>
                {regionFilter !== 'all' && (
                  <div>
                    Région: {MAURITANIA_REGIONS.find(r => r.code === regionFilter)?.name}
                  </div>
                )}
                {statusFilter !== 'all' && (
                  <div>Statut: {statusFilter}</div>
                )}
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
