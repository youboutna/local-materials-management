/**
 * Mauritania Geographic Utility Functions
 * Helper functions for working with Mauritania regions and cities
 */

import { Region, City, MAURITANIA_REGIONS, MAURITANIA_CITIES } from '@/utils/mauritania';

// Re-export types for convenience
export type { Region, City };

// =================== REGION LOOKUP FUNCTIONS ===================

/**
 * Find a wilaya by its code
 * @param code - The wilaya code (e.g., "NKC", "ADR")
 * @returns The wilaya object or undefined if not found
 */
export function getWilayaByCode(code: string): Region | undefined {
  return MAURITANIA_REGIONS.find(region => region.code === code);
}

/**
 * Get all cities within a specific wilaya
 * @param wilayaCode - The wilaya code (e.g., "NKC", "ADR")
 * @returns Array of cities in the specified wilaya
 */
export function getCitiesByWilaya(wilayaCode: string): City[] {
  return MAURITANIA_CITIES.filter(city => city.parentCode === wilayaCode);
}

/**
 * Find a city by its code
 * @param code - The city code (e.g., "NKC", "ATR")
 * @returns The city object or undefined if not found
 */
export function getCityByCode(code: string): City | undefined {
  return MAURITANIA_CITIES.find(city => city.code === code);
}

/**
 * Get the capital city of a wilaya
 * @param wilayaCode - The wilaya code
 * @returns The capital city or undefined if not found
 */
export function getWilayaCapital(wilayaCode: string): City | undefined {
  const wilaya = getWilayaByCode(wilayaCode);
  if (!wilaya) return undefined;
  
  return MAURITANIA_CITIES.find(city => 
    city.code === wilaya.capital && 
    city.parentCode === wilayaCode
  );
}

/**
 * Get all major cities (capital, economic, or population > 50K)
 * @returns Array of major cities
 */
export function getMajorCities(): City[] {
  return MAURITANIA_CITIES.filter(city => 
    city.economicImportance === 'capital' || 
    city.economicImportance === 'economic' ||
    (city.population && city.population > 50000)
  );
}

/**
 * Get all geographic units (both wilayas and cities)
 * @returns Array of all regions and cities
 */
export function getAllGeographicUnits(): (Region | City)[] {
  return [...MAURITANIA_REGIONS, ...MAURITANIA_CITIES];
}

// =================== REGION MATCHING FUNCTIONS ===================

/**
 * Check if a location string matches a region name or Arabic name
 * @param location - The location string to check
 * @param region - The region object to match against
 * @returns True if the location matches the region
 */
export function isLocationInRegion(location: string, region: Region): boolean {
  return location.toLowerCase().includes(region.name.toLowerCase()) ||
         location.toLowerCase().includes(region.nameAr.toLowerCase());
}

/**
 * Find which region a location belongs to
 * @param location - The location string to check
 * @returns The matching region or undefined
 */
export function findRegionByLocation(location: string): Region | undefined {
  return MAURITANIA_REGIONS.find(region => 
    isLocationInRegion(location, region)
  );
}

/**
 * Get regions with their capitals for display purposes
 * @returns Array of regions with capital information
 */
export function getRegionsWithCapitals(): Array<Region & { capital: City | null }> {
  return MAURITANIA_REGIONS.map(region => {
    const capital = getWilayaCapital(region.code);
    return { ...region, capital: capital || null };
  });
}

// =================== CITY COORDINATE FUNCTIONS ===================

/**
 * Get coordinates for a city by code
 * @param cityCode - The city code
 * @returns Coordinates object or null if not found
 */
export function getCityCoordinates(cityCode: string): { lat: number; lng: number } | null {
  const city = getCityByCode(cityCode);
  if (!city) return null;
  
  return { lat: city.lat, lng: city.lng };
}

/**
 * Get all cities coordinates for mapping
 * @returns Array of city coordinates with metadata
 */
export function getAllCityCoordinates(): Array<{ code: string; name: string; nameAr: string; lat: number; lng: number; isCapital: boolean; economicImportance: string }> {
  return MAURITANIA_CITIES.map(city => ({
    code: city.code,
    name: city.name,
    nameAr: city.nameAr,
    lat: city.lat,
    lng: city.lng,
    isCapital: city.isCapital,
    economicImportance: city.economicImportance || 'regional'
  }));
}

// =================== POPULATION FUNCTIONS ===================

/**
 * Get total population of all regions
 * @returns Total population count
 */
export function getTotalPopulation(): number {
  return MAURITANIA_REGIONS.reduce((total, region) => total + (region.population || 0), 0);
}

/**
 * Get total population of all cities
 * @returns Total population count
 */
export function getTotalCityPopulation(): number {
  return MAURITANIA_CITIES.reduce((total, city) => total + (city.population || 0), 0);
}

/**
 * Get population statistics by economic importance
 * @returns Object with population counts by importance level
 */
export function getPopulationByImportance(): Record<string, number> {
  const regions = MAURITANIA_REGIONS;
  const cities = MAURITANIA_CITIES;
  
  const stats: Record<string, number> = {
    capital: 0,
    economic: 0,
    regional: 0,
    local: 0
  };
  
  // Count regions by importance
  regions.forEach(region => {
    if (region.economicImportance) {
      stats[region.economicImportance]++;
    }
  });
  
  // Count cities by importance
  cities.forEach(city => {
    if (city.economicImportance) {
      stats[city.economicImportance]++;
    }
  });
  
  return stats;
}

// =================== INFRASTRUCTURE FUNCTIONS ===================

/**
 * Get all regions with airports
 * @returns Array of regions that have airports
 */
export function getRegionsWithAirports(): Region[] {
  return MAURITANIA_REGIONS.filter(region => {
    const capital = getWilayaCapital(region.code);
    return capital?.hasAirport || false;
  });
}

/**
 * Get all regions with ports
 * @returns Array of regions that have ports
 */
export function getRegionsWithPorts(): Region[] {
  return MAURITANIA_REGIONS.filter(region => {
    const capital = getWilayaCapital(region.code);
    return capital?.hasPort || false;
  });
}

/**
 * Get all regions with universities
 * @returns Array of regions that have universities
 */
export function getRegionsWithUniversities(): Region[] {
  return MAURITANIA_REGIONS.filter(region => {
    const capital = getWilayaCapital(region.code);
    return capital?.hasUniversity || false;
  });
}

// =================== SEARCH FUNCTIONS ===================

/**
 * Search regions by name (French or Arabic)
 * @param query - Search query string
 * @returns Array of matching regions
 */
export function searchRegions(query: string): Region[] {
  const lowerQuery = query.toLowerCase();
  return MAURITANIA_REGIONS.filter(region =>
    region.name.toLowerCase().includes(lowerQuery) ||
    region.nameAr.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search cities by name (French or Arabic)
 * @param query - Search query string
 * @returns Array of matching cities
 */
export function searchCities(query: string): City[] {
  const lowerQuery = query.toLowerCase();
  return MAURITANIA_CITIES.filter(city =>
    city.name.toLowerCase().includes(lowerQuery) ||
    city.nameAr.toLowerCase().includes(lowerQuery)
  );
}

// =================== VALIDATION FUNCTIONS ===================

/**
 * Validate if a region code exists
 * @param code - Region code to validate
 * @returns True if the region code exists
 */
export function isValidRegionCode(code: string): boolean {
  return MAURITANIA_REGIONS.some(region => region.code === code);
}

/**
 * Validate if a city code exists
 * @param code - City code to validate
 * @returns True if the city code exists
 */
export function isValidCityCode(code: string): boolean {
  return MAURITANIA_CITIES.some(city => city.code === code);
}

/**
 * Validate if a city belongs to a region
 * @param cityCode - City code to validate
 * @param wilayaCode - Expected wilaya code
 * @returns True if the city belongs to the specified wilaya
 */
export function isValidCityRegion(cityCode: string, wilayaCode: string): boolean {
  const city = getCityByCode(cityCode);
  return city?.parentCode === wilayaCode;
}
