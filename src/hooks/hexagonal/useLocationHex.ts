/**
 * Location Hexagonal Hook
 * Provides location services following PROMPTS.md Rule #1: Arrow Flow
 * UI Component → Hook → Service → Domain ← Infrastructure
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

// Import DTOs following Rule #4
import { LocationDTO } from '@/dtos/shared';
import { GeographicUnit, Region, City, MAURITANIA_CITIES } from '@/utils/mauritania';
import { 
  searchRegions, 
  searchCities, 
  getCitiesByWilaya, 
  getWilayaByCode,
  getCityByCode,
  isValidRegionCode,
  isValidCityCode,
  isValidCityRegion,
  isLocationInRegion,
  findRegionByLocation
} from '@/utils/mauritaniaUtils';

// Import services (application layer)
import { LocationService } from '@/application/services/LocationService';
import { GeocodingService } from '@/application/services/GeocodingService';

// Import repository factory for dependency injection
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

// Interface for geocoding search results
interface GeocodingSearchResult {
  code?: string;
  name: string;
  nameAr: string;
  lat?: number;
  lng?: number;
  parentCode?: string;
  economicImportance?: string;
  population?: number;
}

interface UseLocationHexResult {
  // Search functionality
  searchLocations: (query: string, filters?: {
    type?: 'all' | 'regions' | 'cities' | 'localite' | 'wilaya' | 'moughataa' | 'commune' | 'jiha';
    excludeCodes?: string[];
    maxResults?: number;
  }) => Promise<LocationDTO[]>;
  
  // Location validation
  validateLocationCode: (code: string, type?: 'region' | 'city' | 'localite' | 'wilaya' | 'moughataa' | 'commune' | 'jiha') => boolean;
  getLocationByCode: (code: string, type?: 'region' | 'city' | 'localite' | 'wilaya' | 'moughataa' | 'commune' | 'jiha') => Promise<LocationDTO | null>;
  
  // Region/City relationships
  getCitiesInRegion: (regionCode: string) => Promise<LocationDTO[]>;
  getRegionForCity: (cityCode: string) => Promise<LocationDTO | null>;
  
  // City-specific methods
  getMajorCities: () => Promise<LocationDTO[]>;
  getCitiesByPopulation: (minPopulation?: number) => Promise<LocationDTO[]>;
  findNearestCity: (latitude: number, longitude: number, maxDistanceKm?: number) => Promise<LocationDTO | null>;
  findLocationBySearchTerm: (term: string) => Promise<LocationDTO[]>;
  
  // Geocoding methods
  reverseGeocode: (latitude: number, longitude: number) => Promise<LocationDTO | null>;
  geocode: (address: string) => Promise<LocationDTO | null>;
  
  // Location type methods
  getLocationsByType: (type: 'region' | 'city' | 'localite' | 'wilaya' | 'moughataa' | 'commune' | 'jiha') => Promise<LocationDTO[]>;
  getAllLocations: () => Promise<LocationDTO[]>;
  
  // Location data
  allRegions: LocationDTO[] | undefined;
  allCities: LocationDTO[] | undefined;
  allLocations: LocationDTO[] | undefined;
  isLoading: boolean;
  error: string | null;
  
  // Mutations
  createLocation: (location: Omit<LocationDTO, 'id'>) => Promise<LocationDTO>;
  updateLocation: (params: { id: string; location: Partial<LocationDTO> }) => Promise<LocationDTO>;
  deleteLocation: (id: string) => Promise<void>;
}

/**
 * Hexagonal hook for location operations
 * Follows PROMPTS.md Rule #1: Arrow Flow Architecture
 */
export function useLocationHex(): UseLocationHexResult {
  // Memoize services to prevent recreation on every render
  const locationService = useMemo(() => 
    new LocationService(RepositoryFactory.getLocationRepository()), 
    []
  );

  const geocodingService = useMemo(() => getGeocodingService(), []);

  // Query all regions and cities
  const { data: allRegions, isLoading: regionsLoading } = useQuery({
    queryKey: ['locations', 'regions'],
    queryFn: () => locationService.getAllRegions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: allCities, isLoading: citiesLoading } = useQuery({
    queryKey: ['locations', 'cities'],
    queryFn: () => locationService.getAllCities(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: allLocations, isLoading: locationsLoading } = useQuery({
    queryKey: ['locations', 'all'],
    queryFn: () => locationService.findAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Search locations - delegate to service
  const searchLocations = useCallback(async (
    query: string, 
    filters?: {
      type?: 'all' | 'regions' | 'cities' | 'localite' | 'wilaya' | 'moughataa' | 'commune' | 'jiha';
      excludeCodes?: string[];
      maxResults?: number;
    }
  ): Promise<LocationDTO[]> => {
    // Map extended types to basic locationService types
    let serviceFilters: {
      type?: 'all' | 'regions' | 'cities';
      excludeCodes?: string[];
      maxResults?: number;
    } | undefined = undefined;
    
    if (filters) {
      const mapToBasicType = (extendedType: string): 'all' | 'regions' | 'cities' => {
        switch (extendedType) {
          case 'region':
          case 'wilaya':
            return 'regions';
          case 'city':
          case 'localite':
          case 'moughataa':
          case 'commune':
          case 'jiha':
            return 'cities';
          case 'all':
          default:
            return 'all';
        }
      };

      serviceFilters = {
        ...filters,
        type: filters.type ? mapToBasicType(filters.type) : undefined
      };
    }

    return await locationService.searchLocations(query, serviceFilters);
  }, [locationService]);

  // Validate location code
  const validateLocationCode = useCallback((code: string, type?: 'region' | 'city' | 'localite' | 'wilaya' | 'moughataa' | 'commune' | 'jiha'): boolean => {
    if (!type) return isValidRegionCode(code) || isValidCityCode(code);
    switch (type) {
      case 'region':
      case 'wilaya':
        return isValidRegionCode(code);
      case 'city':
      case 'localite':
      case 'moughataa':
      case 'commune':
      case 'jiha':
        return isValidCityCode(code);
      default:
        return false;
    }
  }, []);

  // Get location by code - delegate to service
  const getLocationByCode = useCallback(async (code: string, type?: 'region' | 'city' | 'localite' | 'wilaya' | 'moughataa' | 'commune' | 'jiha'): Promise<LocationDTO | null> => {
    // Map extended types to basic LocationService types
    const mapToBasicType = (extendedType: string): 'region' | 'city' => {
      switch (extendedType) {
        case 'region':
        case 'wilaya':
          return 'region';
        case 'city':
        case 'localite':
        case 'moughataa':
        case 'commune':
        case 'jiha':
        default:
          return 'city';
      }
    };

    if (!type) {
      // Try region first, then city
      const regionResult = await locationService.getLocationByCode(code, 'region');
      if (regionResult) return regionResult;
      return await locationService.getLocationByCode(code, 'city');
    }

    const basicType = mapToBasicType(type);
    return await locationService.getLocationByCode(code, basicType);
  }, [locationService]);

  // Get cities in region - delegate to service
  const getCitiesInRegion = useCallback(async (regionCode: string): Promise<LocationDTO[]> => {
    return await locationService.getCitiesByRegion(regionCode);
  }, [locationService]);

  // Get region for city
  const getRegionForCity = useCallback(async (cityCode: string): Promise<LocationDTO | null> => {
    try {
      const city = getCityByCode(cityCode);
      if (!city || !city.parentCode) return null;

      const region = getWilayaByCode(city.parentCode);
      if (!region) return null;

      return {
        id: region.code,
        code: region.code,
        name: region.name,
        nameAr: region.nameAr,
        type: 'region' as const,
        coordinates: { lat: region.lat, lng: region.lng },
        economicImportance: region.economicImportance,
        population: region.population,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting region for city:', error);
      return null;
    }
  }, []);

  // Get major cities (capitals and large cities)
  const getMajorCities = useCallback(async (): Promise<LocationDTO[]> => {
    try {
      const majorCities = await getMajorCities();
      return majorCities.map(city => ({
        id: city.code,
        code: city.code,
        name: city.name,
        nameAr: city.nameAr,
        type: 'city' as const,
        parentCode: city.parentCode,
        coordinates: city.coordinates, // Use nested coordinates property
        economicImportance: city.economicImportance,
        population: city.population,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error getting major cities:', error);
      return [];
    }
  }, []);

  // Get cities by population threshold
  const getCitiesByPopulation = useCallback(async (minPopulation: number = 10000): Promise<LocationDTO[]> => {
    try {
      const cities = MAURITANIA_CITIES.filter(city => city.population && city.population >= minPopulation);
      return cities.map(city => ({
        id: city.code,
        code: city.code,
        name: city.name,
        nameAr: city.nameAr,
        type: 'city' as const,
        parentCode: city.parentCode,
        coordinates: city.lat && city.lng ? { lat: city.lat, lng: city.lng } : undefined,
        economicImportance: city.economicImportance,
        population: city.population,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error getting cities by population:', error);
      return [];
    }
  }, []);

  // Find nearest city to coordinates
  const findNearestCity = useCallback(async (latitude: number, longitude: number, maxDistanceKm: number = 50): Promise<LocationDTO | null> => {
    try {
      const nearestLocations = await locationService.findNearestLocations(latitude, longitude, maxDistanceKm, 10);
      const cities = nearestLocations.filter(location => location.type === 'city');
      return cities.length > 0 ? cities[0] : null;
    } catch (error) {
      console.error('Error finding nearest city:', error);
      return null;
    }
  }, [locationService]);

  // Find locations by search term using GeocodingService
  const findLocationBySearchTerm = useCallback(async (term: string): Promise<LocationDTO[]> => {
    try {
      const searchResults = await geocodingService.searchMauritaniaLocations(term);
      return searchResults.map((result: GeocodingSearchResult) => {
        // Determine type based on available properties
        const hasParentCode = result.parentCode;
        const locationType: 'region' | 'city' = hasParentCode ? 'city' : 'region';
        
        return {
          id: result.code || result.name.toLowerCase().replace(/\s+/g, '-'),
          code: result.code || result.name.toLowerCase().replace(/\s+/g, '-'),
          name: result.name,
          nameAr: result.nameAr,
          type: locationType,
          coordinates: result.lat && result.lng ? { lat: result.lat, lng: result.lng } : undefined,
          parentCode: hasParentCode ? result.parentCode : undefined, // Only cities have parentCode
          economicImportance: result.economicImportance as 'capital' | 'economic' | 'regional' | 'local' | undefined,
          population: result.population,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });
    } catch (error) {
      console.error('Error finding location by search term:', error);
      return [];
    }
  }, [geocodingService]);

  // Get locations by type
  const getLocationsByType = useCallback(async (type: 'region' | 'city' | 'localite' | 'wilaya' | 'moughataa' | 'commune' | 'jiha'): Promise<LocationDTO[]> => {
    try {
      // Map extended types to basic locationService types
      const mapToBasicType = (extendedType: string): 'all' | 'regions' | 'cities' => {
        switch (extendedType) {
          case 'region':
          case 'wilaya':
            return 'regions';
          case 'city':
          case 'localite':
          case 'moughataa':
          case 'commune':
          case 'jiha':
            return 'cities';
          case 'all':
          default:
            return 'all';
        }
      };

      const basicType = mapToBasicType(type);
      return await locationService.searchLocations('', { type: basicType });
    } catch (error) {
      console.error('Error getting locations by type:', error);
      return [];
    }
  }, [locationService]);

  // Get all locations (combined regions and cities)
  const getAllLocations = useCallback(async (): Promise<LocationDTO[]> => {
    try {
      return await locationService.findAll();
    } catch (error) {
      console.error('Error getting all locations:', error);
      return [];
    }
  }, [locationService]);

  // Reverse geocoding (coordinates to location)
  const reverseGeocode = useCallback(async (latitude: number, longitude: number): Promise<LocationDTO | null> => {
    try {
      // First try the GeocodingService
      const geoResults = await geocodingService.reverseGeocode(latitude, longitude);
      if (geoResults && geoResults.length > 0) {
        // Convert geocoding result to LocationDTO
        // Try to find matching region or city from our data
        const allLocations: LocationDTO[] = [];

        // Add all regions
        if (allRegions) {
          allLocations.push(...allRegions.map(region => ({
            id: region.code,
            code: region.code,
            name: region.name,
            nameAr: region.nameAr,
            type: 'region' as const,
            coordinates: region.coordinates,
            economicImportance: region.economicImportance,
            population: region.population,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })));
        }

        // Add all cities
        if (allCities) {
          allLocations.push(...allCities.map(city => ({
            id: city.code,
            code: city.code,
            name: city.name,
            nameAr: city.nameAr,
            type: 'city' as const,
            parentCode: city.parentCode,
            coordinates: city.coordinates,
            economicImportance: city.economicImportance,
            population: city.population,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })));
        }

        // Find closest location to the geocoding result using service layer
        const bestGeoResult = geoResults[0]; // Get the best geocoding result
        const nearestLocations = await locationService.findNearestLocations(
          bestGeoResult.coordinates.lat,
          bestGeoResult.coordinates.lng,
          30, // 10km radius to find locations
          1    // Get only the closest one
        );

        return nearestLocations.length > 0 ? nearestLocations[0] : null;
      }

      // Fallback: Use distance-based approach if geocoding service fails
      console.warn('Geocoding service failed, using fallback distance-based approach');
      const allLocations: LocationDTO[] = [];

      // Add all regions
      if (allRegions) {
        allLocations.push(...allRegions.map(region => ({
          id: region.code,
          code: region.code,
          name: region.name,
          nameAr: region.nameAr,
          type: 'region' as const,
          coordinates: region.coordinates,
          economicImportance: region.economicImportance,
          population: region.population,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })));
      }

      // Add all cities
      if (allCities) {
        allLocations.push(...allCities.map(city => ({
          id: city.code,
          code: city.code,
          name: city.name,
          nameAr: city.nameAr,
          type: 'city' as const,
          parentCode: city.parentCode,
          coordinates: city.coordinates,
          economicImportance: city.economicImportance,
          population: city.population,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })));
      }

      // Find closest location
      let closestLocation: LocationDTO | null = null;
      let minDistance = Infinity;

      allLocations.forEach(location => {
        if (location.coordinates) {
          const distance = Math.sqrt(
            Math.pow(latitude - location.coordinates.lat, 2) +
            Math.pow(longitude - location.coordinates.lng, 2)
          );

          if (distance < minDistance) {
            minDistance = distance;
            closestLocation = location;
          }
        }
      });

      return closestLocation;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      toast.error('Erreur lors du géocodage inversé');
      return null;
    }
  }, [locationService, geocodingService, allRegions, allCities]);

  // Forward geocoding (address to location)
  const geocode = useCallback(async (address: string): Promise<LocationDTO | null> => {
    try {
      // First try the GeocodingService for forward geocoding

      const geoResults = await geocodingService.geocode(address);
      if (geoResults && geoResults.length > 0) {
        const bestGeoResult = geoResults[0];

        // Convert geocoding result to LocationDTO
        // Try to find matching region or city from our data
        const allLocations: LocationDTO[] = [];

        // Add all regions
        if (allRegions) {
          allLocations.push(...allRegions.map(region => ({
            id: region.code,
            code: region.code,
            name: region.name,
            nameAr: region.nameAr,
            type: 'region' as const,
            coordinates: region.coordinates,
            economicImportance: region.economicImportance,
            population: region.population,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })));
        }

        // Add all cities
        if (allCities) {
          allLocations.push(...allCities.map(city => ({
            id: city.code,
            code: city.code,
            name: city.name,
            nameAr: city.nameAr,
            type: 'city' as const,
            parentCode: city.parentCode,
            coordinates: city.coordinates,
            economicImportance: city.economicImportance,
            population: city.population,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })));
        }

        // Find closest location to the geocoding result
        let closestLocation: LocationDTO | null = null;
        let minDistance = Infinity;

        allLocations.forEach(location => {
          if (location.coordinates && bestGeoResult.coordinates) {
            const distance = Math.sqrt(
              Math.pow(bestGeoResult.coordinates.lat - location.coordinates.lat, 2) +
              Math.pow(bestGeoResult.coordinates.lng - location.coordinates.lng, 2)
            );

            if (distance < minDistance) {
              minDistance = distance;
              closestLocation = location;
            }
          }
        });

        return closestLocation;
      }

      // Fallback: Use local region/city search if geocoding service fails
      console.warn('Geocoding service failed, using fallback local search');

      // Try to find region by address using local data first
      const region = findRegionByLocation(address);
      if (region) {
        return {
          id: region.code,
          code: region.code,
          name: region.name,
          nameAr: region.nameAr,
          type: 'region' as const,
          coordinates: region.lat && region.lng ? { lat: region.lat, lng: region.lng } : undefined,
          economicImportance: region.economicImportance,
          population: region.population,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      // If no region found, try searching cities
      const cityResults = searchCities(address);
      if (cityResults.length > 0) {
        const city = cityResults[0];
        return {
          id: city.code,
          code: city.code,
          name: city.name,
          nameAr: city.nameAr,
          type: 'city' as const,
          parentCode: city.parentCode,
          coordinates: city.lat && city.lng ? { lat: city.lat, lng: city.lng } : undefined,
          economicImportance: city.economicImportance,
          population: city.population,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error('Error geocoding:', error);
      toast.error('Erreur lors du géocodage');
      return null;
    }
  }, [geocodingService, allRegions, allCities]);

  // Mutations
  const createLocationMutation = useMutation({
    mutationFn: async (location: Omit<LocationDTO, 'id'>) => {
      return await locationService.createLocation(location);
    },
    onSuccess: () => {
      toast.success('Localisation créée avec succès');
    },
    onError: (error) => {
      console.error('Error creating location:', error);
      toast.error('Erreur lors de la création de la localisation');
    }
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, location }: { id: string; location: Partial<LocationDTO> }) => {
      return await locationService.updateLocation(id, location);
    },
    onSuccess: () => {
      toast.success('Localisation mise à jour avec succès');
    },
    onError: (error) => {
      console.error('Error updating location:', error);
      toast.error('Erreur lors de la mise à jour de la localisation');
    }
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      await locationService.deleteLocation(id);
    },
    onSuccess: () => {
      toast.success('Localisation supprimée avec succès');
    },
    onError: (error) => {
      console.error('Error deleting location:', error);
      toast.error('Erreur lors de la suppression de la localisation');
    }
  });

  return {
    searchLocations,
    validateLocationCode,
    getLocationByCode,
    getCitiesInRegion,
    getRegionForCity,
    getMajorCities,
    getCitiesByPopulation,
    findNearestCity,
    findLocationBySearchTerm,
    reverseGeocode,
    geocode,
    getLocationsByType,
    getAllLocations,
    allRegions,
    allCities,
    allLocations,
    isLoading: regionsLoading || citiesLoading || locationsLoading,
    error: null, // Could be enhanced with error handling
    createLocation: createLocationMutation.mutateAsync,
    updateLocation: updateLocationMutation.mutateAsync,
    deleteLocation: deleteLocationMutation.mutateAsync
  };
}
