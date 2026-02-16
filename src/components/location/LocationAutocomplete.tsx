/**
 * Location Autocomplete Component
 * Clean implementation using base Autocomplete component
 * Following PROMPTS.md Rule #4: No type redefinition, use centralized DTOs
 */

import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building, Users } from 'lucide-react';
import Autocomplete, { AutocompleteOption } from '@/components/ui/autocomplete';

// Import DTOs following Rule #4
import { LocationDTO } from '@/dtos/shared';
import { LocationDataService } from '@/application/services/LocationDataService';

interface LocationAutocompleteProps {
  value?: string;
  onChange: (location: string, locationData?: LocationDTO) => void;
  placeholder?: string;
  className?: string;
  filter?: 'all' | 'regions' | 'cities';
  excludeCodes?: string[];
  maxResults?: number;
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
  // Convert location data to AutocompleteOption format
  const options: AutocompleteOption[] = useMemo(() => {
    return LocationDataService.getAllAutocompleteOptions(filter, excludeCodes).slice(0, maxResults * 2);
  }, [filter, excludeCodes, maxResults]);

  // Handle option selection
  const handleSelect = (option: AutocompleteOption) => {
    // Extract location data from option
    const [type, code] = option.id.split('-');

    // Get location data using the service
    const locationData = LocationDataService.getLocationDataByCode(code, type as 'region' | 'city');

    onChange(option.label, locationData);
  };

  return (
    <div className={className}>
      <Label htmlFor="location-autocomplete" className="text-sm font-medium">
        Localisation
      </Label>
      <Autocomplete
        value={value}
        onChange={(value) => onChange(value)} // Simple text change
        onSelect={handleSelect} // Selection with location data
        options={options}
        placeholder={placeholder}
        maxSuggestions={maxResults}
        className="mt-1"
      />
    </div>
  );
};

export default LocationAutocomplete;
