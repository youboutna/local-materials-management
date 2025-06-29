
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
  'NKC': ['nouakchott', 'nkc', 'capital', 'capitale'],
  'NDB': ['nouadhibou', 'ndb', 'port', 'economic capital'],
  'ADR': ['adrar', 'atar', 'chinguetti', 'ouadane', 'choum'],
  'ASA': ['assaba', 'kifa', 'kiffa', 'guerou', 'barkeol', 'boumdeid', 'kankossa'], 
  'BRK': ['brakna', 'aleg', 'magta lahjar', 'matka lahjar', 'boghé', 'boghe', 'mbagne'],
  'DKN': ['dakhlet nouadhibou', 'nouadhibou', 'port autonome'],
  'GOG': ['gorgol', 'kaédi', 'kaedi', 'maghama', 'monguel', 'lexeiba'],
  'GDM': ['guidimaka', 'sélibaby', 'selibaby', 'ghabou', 'ould yengé', 'ould yenge'],
  'HEC': ['hodh ech chargui', 'néma', 'nema', 'bassiknou', 'amourj', 'djiguenni'],
  'HEG': ['hodh el gharbi', 'aioun', 'ayoun', 'ayoun el atrous', 'tintane', 'kobani'],
  'INC': ['inchiri', 'akjoujt', 'benichab'],
  'TGT': ['tagant', 'tidjikja', 'moudjéria', 'moudjerria', 'rachid'],
  'TZM': ['tiris zemmour', 'zouerate', 'fderick', 'fderik', 'bir moghrein'],
  'TRR': ['trarza', 'rosso', 'boutilimit', 'rkiz', 'mederdra', 'keur macene']
};

const MapFilters = ({ locations, onFilterChange }: MapFiltersProps) => {
  const [originalLocations] = useState<MapLocation[]>(locations);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  // Get unique statuses from locations
  const availableStatuses = React.useMemo(() => {
    const statuses = new Set<string>();
    originalLocations.forEach(location => {
      if (location.status) {
        statuses.add(location.status);
      }
    });
    return Array.from(statuses);
  }, [originalLocations]);

  // Enhanced region matching function with better normalization
  const matchesRegion = (itemRegion: string, selectedRegionCode: string): boolean => {
    if (!itemRegion) return false;
    
    const normalizeText = (text: string) => {
      return text
        .toLowerCase()
        .trim()
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[\s\-_]/g, ' ')
        .replace(/\s+/g, ' ');
    };
    
    const itemRegionNormalized = normalizeText(itemRegion);
    const selectedRegion = MAURITANIA_REGIONS.find(r => r.code === selectedRegionCode);
    
    if (!selectedRegion) return false;
    
    const regionName = normalizeText(selectedRegion.name);
    const regionNameAr = normalizeText(selectedRegion.nameAr);
    
    console.log(`Matching "${itemRegionNormalized}" against region "${regionName}" (${selectedRegionCode})`);
    
    // 1. Direct exact matches
    if (itemRegionNormalized === regionName || itemRegionNormalized === regionNameAr) {
      console.log('✓ Exact match found');
      return true;
    }
    
    // 2. Check if the item location is a known city in this region
    const citiesInRegion = CITY_TO_REGION_MAP[selectedRegionCode] || [];
    const cityMatch = citiesInRegion.some(city => {
      const normalizedCity = normalizeText(city);
      const match = itemRegionNormalized.includes(normalizedCity) || 
                   normalizedCity.includes(itemRegionNormalized) ||
                   itemRegionNormalized === normalizedCity;
      if (match) console.log(`✓ City match found: "${city}" -> "${normalizedCity}"`);
      return match;
    });
    
    if (cityMatch) {
      return true;
    }
    
    // 3. Partial name matching (contains)
    const partialMatch = itemRegionNormalized.includes(regionName) || 
                        itemRegionNormalized.includes(regionNameAr) ||
                        regionName.includes(itemRegionNormalized) ||
                        regionNameAr.includes(itemRegionNormalized);
    
    if (partialMatch) {
      console.log('✓ Partial match found');
      return true;
    }
    
    // 4. Clean matches (remove common administrative words)
    const cleanItemRegion = itemRegionNormalized.replace(/wilaya|region|province|governorate|commune/gi, '').trim();
    const cleanRegionName = regionName.replace(/wilaya|region|province|governorate/gi, '').trim();
    
    if (cleanItemRegion === cleanRegionName) {
      console.log('✓ Clean match found');
      return true;
    }
    
    // 5. Word-by-word matching
    const regionWords = regionName.split(' ').filter(word => word.length > 2);
    const itemWords = itemRegionNormalized.split(' ').filter(word => word.length > 2);
    
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

  // Apply filters and update the parent component
  useEffect(() => {
    let filtered = [...originalLocations];
    
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
          console.log(`MapFilters - Item "${item.name}" in "${item.region}" matches: ${matches}`);
          return matches;
        });
        
        console.log(`MapFilters - Region filter: ${beforeRegionFilter} → ${filtered.length} locations`);
      }
    }
    
    console.log('MapFilters - Final filtered locations:', filtered.length);
    onFilterChange(filtered);
  }, [statusFilter, regionFilter, originalLocations, onFilterChange]);

  return (
    <Card className="mb-6 shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium">Filtres de la carte</h3>
          <Badge variant="secondary" className="ml-auto">
            {originalLocations.length} projet{originalLocations.length > 1 ? 's' : ''}
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
                {(() => {
                  let count = originalLocations.length;
                  
                  if (statusFilter !== 'all') {
                    count = originalLocations.filter(item => item.status === statusFilter).length;
                  }
                  
                  if (regionFilter !== 'all') {
                    let filtered = originalLocations;
                    if (statusFilter !== 'all') {
                      filtered = filtered.filter(item => item.status === statusFilter);
                    }
                    count = filtered.filter(item => matchesRegion(item.region || '', regionFilter)).length;
                  }
                  
                  return count;
                })()}
              </div>
              <div className="text-xs text-muted-foreground">
                projet{(() => {
                  let count = originalLocations.length;
                  
                  if (statusFilter !== 'all') {
                    count = originalLocations.filter(item => item.status === statusFilter).length;
                  }
                  
                  if (regionFilter !== 'all') {
                    let filtered = originalLocations;
                    if (statusFilter !== 'all') {
                      filtered = filtered.filter(item => item.status === statusFilter);
                    }
                    count = filtered.filter(item => matchesRegion(item.region || '', regionFilter)).length;
                  }
                  
                  return count > 1 ? 's' : '';
                })()} affiché{(() => {
                  let count = originalLocations.length;
                  
                  if (statusFilter !== 'all') {
                    count = originalLocations.filter(item => item.status === statusFilter).length;
                  }
                  
                  if (regionFilter !== 'all') {
                    let filtered = originalLocations;
                    if (statusFilter !== 'all') {
                      filtered = filtered.filter(item => item.status === statusFilter);
                    }
                    count = filtered.filter(item => matchesRegion(item.region || '', regionFilter)).length;
                  }
                  
                  return count > 1 ? 's' : '';
                })()}
              </div>
              
              {/* Debug info */}
              <div className="mt-2 text-xs text-gray-500 border-t pt-2">
                <div>Total disponible: {originalLocations.length}</div>
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
