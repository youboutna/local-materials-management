/**
 * Location Data Service
 * Provides autocomplete data through proper architectural layers
 * Following PROMPTS.md Rule #1: Arrow Flow Architecture
 * UI → Service → Domain ← Infrastructure
 */

import { MAURITANIA_REGIONS, MAURITANIA_CITIES } from '@/utils/mauritania';
import { getWilayaByCode } from '@/utils/mauritaniaUtils';
import { AutocompleteOption } from '@/components/ui/autocomplete';
import { LocationDTO } from '@/dtos/shared';

/**
 * Location Data Service
 * Provides synchronous access to location data for autocomplete and UI components
 * This service acts as a bridge between the domain data and UI components
 */
export class LocationDataService {
  /**
   * Get all autocomplete options for locations
   */
  static getAllAutocompleteOptions(filter?: 'all' | 'regions' | 'cities', excludeCodes: string[] = []): AutocompleteOption[] {
    const allOptions: AutocompleteOption[] = [];

    // Add region options
    if (!filter || filter === 'all' || filter === 'regions') {
      MAURITANIA_REGIONS
        .filter(region => !excludeCodes.includes(region.code))
        .forEach(region => {
          allOptions.push({
            id: `region-${region.code}`,
            label: region.name,
            category: 'Région',
            subtitle: region.nameAr
          });
        });
    }

    // Add city options
    if (!filter || filter === 'all' || filter === 'cities') {
      MAURITANIA_CITIES
        .filter(city => !excludeCodes.includes(city.code))
        .forEach(city => {
          const region = getWilayaByCode(city.parentCode);
          allOptions.push({
            id: `city-${city.code}`,
            label: city.name,
            category: city.isCapital ? 'Capitale' : 'Ville',
            subtitle: `${city.nameAr}${region ? ` • ${region.name}` : ''}`
          });
        });
    }

    return allOptions;
  }

  /**
   * Get location data by code and type
   */
  static getLocationDataByCode(code: string, type: 'region' | 'city'): LocationDTO | undefined {
    if (type === 'region') {
      const region = MAURITANIA_REGIONS.find(r => r.code === code);
      if (region) {
        return {
          id: region.code,
          code: region.code,
          name: region.name,
          nameAr: region.nameAr,
          type: 'region',
          coordinates: { lat: region.lat, lng: region.lng },
          economicImportance: region.economicImportance,
          population: region.population,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    } else if (type === 'city') {
      const city = MAURITANIA_CITIES.find(c => c.code === code);
      if (city) {
        return {
          id: city.code,
          code: city.code,
          name: city.name,
          nameAr: city.nameAr,
          type: 'city',
          coordinates: { lat: city.lat, lng: city.lng },
          parentCode: city.parentCode,
          economicImportance: city.economicImportance,
          population: city.population,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    }

    return undefined;
  }

  /**
   * Get filtered autocomplete options based on search term
   */
  static searchAutocompleteOptions(
    searchTerm: string,
    filter?: 'all' | 'regions' | 'cities',
    excludeCodes: string[] = [],
    maxResults: number = 10
  ): AutocompleteOption[] {
    if (!searchTerm.trim()) return [];

    const allOptions = this.getAllAutocompleteOptions(filter, excludeCodes);
    const query = searchTerm.toLowerCase().trim();

    return allOptions
      .filter(option =>
        option.label.toLowerCase().includes(query) ||
        option.subtitle?.toLowerCase().includes(query)
      )
      .slice(0, maxResults);
  }
}
