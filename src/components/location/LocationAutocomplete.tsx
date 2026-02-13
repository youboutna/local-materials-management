/**
 * Location Autocomplete Component
 * Provides intelligent autocomplete for Mauritania regions and cities
 * Following PROMPTS.md Rule #4: No type redefinition, use centralized DTOs
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building, Users, Search } from 'lucide-react';
import { 
  GeographicUnit, 
  Region, 
  City, 
  MAURITANIA_REGIONS, 
  MAURITANIA_CITIES 
} from '@/utils/mauritania';
import { 
  searchRegions, 
  searchCities, 
  getCitiesByWilaya, 
  getWilayaByCode,
  isValidRegionCode,
  isValidCityCode
} from '@/utils/mauritaniaUtils';

// Import DTOs following Rule #4
import { LocationDTO } from '@/dtos/shared';

interface LocationAutocompleteProps {
  value?: string;
  onChange: (location: string, locationData?: LocationDTO) => void;
  placeholder?: string;
  className?: string;
  filter?: 'all' | 'regions' | 'cities';
  excludeCodes?: string[];
  maxResults?: number;
}

interface LocationSuggestion {
  id: string;
  name: string;
  nameAr: string;
  type: 'region' | 'city';
  code: string;
  parentCode?: string;
  economicImportance?: string;
  population?: number;
  coordinates?: { lat: number; lng: number };
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value = '',
  onChange,
  placeholder = "Rechercher une région ou une ville...",
  className = '',
  filter = 'all',
  excludeCodes = [],
  maxResults = 10
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Filter suggestions based on search term and filter type
  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const allSuggestions: LocationSuggestion[] = [];

    // Add region suggestions
    if (filter === 'all' || filter === 'regions') {
      const regions = searchRegions(searchTerm)
        .filter(region => !excludeCodes.includes(region.code))
        .map(region => ({
          id: region.code,
          name: region.name,
          nameAr: region.nameAr,
          type: 'region' as const,
          code: region.code,
          economicImportance: region.economicImportance as 'capital' | 'economic' | 'regional' | 'local' | undefined,
          population: region.population,
          coordinates: { lat: region.lat, lng: region.lng }
        }));
      allSuggestions.push(...regions);
    }

    // Add city suggestions
    if (filter === 'all' || filter === 'cities') {
      const cities = searchCities(searchTerm)
        .filter(city => !excludeCodes.includes(city.code))
        .map(city => ({
          id: city.code,
          name: city.name,
          nameAr: city.nameAr,
          type: 'city' as const,
          code: city.code,
          parentCode: city.parentCode,
          economicImportance: city.economicImportance as 'capital' | 'economic' | 'regional' | 'local' | undefined,
          population: city.population,
          coordinates: { lat: city.lat, lng: city.lng }
        }));
      allSuggestions.push(...cities);
    }

    // Sort by relevance (exact matches first, then by importance)
    const sortedSuggestions = allSuggestions.sort((a, b) => {
      const aExact = a.name.toLowerCase() === searchTerm.toLowerCase();
      const bExact = b.name.toLowerCase() === searchTerm.toLowerCase();
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Sort by economic importance
      const importanceOrder = { capital: 0, economic: 1, regional: 2, local: 3 };
      const aImportance = importanceOrder[a.economicImportance as keyof typeof importanceOrder] || 4;
      const bImportance = importanceOrder[b.economicImportance as keyof typeof importanceOrder] || 4;
      
      return aImportance - bImportance;
    });

    return sortedSuggestions.slice(0, maxResults);
  }, [searchTerm, filter, excludeCodes, maxResults]);

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback((suggestion: LocationSuggestion) => {
    const locationData: LocationDTO = {
      id: suggestion.code,
      code: suggestion.code,
      name: suggestion.name,
      nameAr: suggestion.nameAr,
      type: suggestion.type,
      coordinates: suggestion.coordinates,
      parentCode: suggestion.parentCode,
      economicImportance: suggestion.economicImportance as 'capital' | 'economic' | 'regional' | 'local' | undefined,
      population: suggestion.population,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onChange(suggestion.name, locationData);
    setSearchTerm(suggestion.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, [onChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  }, [isOpen, suggestions, highlightedIndex, handleSelectSuggestion]);

  // Get icon for suggestion type
  const getSuggestionIcon = (suggestion: LocationSuggestion) => {
    switch (suggestion.type) {
      case 'region':
        return <MapPin className="h-4 w-4 text-green-600" />;
      case 'city':
        return suggestion.economicImportance === 'capital' 
          ? <Building className="h-4 w-4 text-blue-600" />
          : <Users className="h-4 w-4 text-gray-600" />;
      default:
        return <MapPin className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get badge for economic importance
  const getImportanceBadge = (suggestion: LocationSuggestion) => {
    if (!suggestion.economicImportance) return null;
    
    const colors = {
      capital: 'bg-purple-100 text-purple-800',
      economic: 'bg-blue-100 text-blue-800',
      regional: 'bg-green-100 text-green-800',
      local: 'bg-gray-100 text-gray-800'
    };

    const labels = {
      capital: 'Capitale',
      economic: 'Économique',
      regional: 'Régionale',
      local: 'Locale'
    };

    return (
      <Badge variant="secondary" className={`text-xs ${colors[suggestion.economicImportance as keyof typeof colors]}`}>
        {labels[suggestion.economicImportance as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <Label htmlFor="location-search" className="text-sm font-medium">
        Localisation
      </Label>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            id="location-search"
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-10"
          />
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && suggestions.length > 0 && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto">
            <CardContent className="p-0">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${
                    index === highlightedIndex ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  {getSuggestionIcon(suggestion)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{suggestion.name}</span>
                      {getImportanceBadge(suggestion)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{suggestion.nameAr}</span>
                      {suggestion.type === 'city' && suggestion.parentCode && (
                        <>
                          <span>•</span>
                          <span>{getWilayaByCode(suggestion.parentCode)?.name}</span>
                        </>
                      )}
                    </div>
                    {suggestion.population && (
                      <div className="text-xs text-gray-400">
                        {suggestion.population.toLocaleString()} hab.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* No results message */}
        {isOpen && searchTerm && suggestions.length === 0 && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1">
            <CardContent className="p-4 text-center text-gray-500">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>Aucune localisation trouvée pour "{searchTerm}"</p>
              <p className="text-sm">Essayez avec un autre terme</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LocationAutocomplete;
