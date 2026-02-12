/**
 * Location Hexagonal Hook
 * Provides location services following PROMPTS.md Rule #1: Arrow Flow
 * UI Component → Hook → Service → Domain ← Infrastructure
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

// Import DTOs following Rule #4
import { LocationDTO } from '@/dtos/shared';
import { GeographicUnit, Region, City } from '@/types/mauritania';

// Import services (application layer)
import { LocationService } from '@/application/services/LocationService';

// Import repository factory for dependency injection
import { RepositoryFactory } from '@/infrastructure/repository/RepositoryFactory';

// Import utilities
import { 
  searchRegions, 
  searchCities, 
  getCitiesByWilaya, 
  getWilayaByCode,
  getCityByCode,
  isValidRegionCode,
  isValidCityCode,
  findRegionByLocation
} from '@/utils/mauritaniaUtils';

interface UseLocationHexResult {
  // Search functionality
  searchLocations: (query: string, filters?: {
    type?: 'all' | 'regions' | 'cities';
    excludeCodes?: string[];
    maxResults?: number;
  }) => Promise<LocationDTO[]>;
  
  // Location validation
  validateLocationCode: (code: string, type: 'region' | 'city') => boolean;
  getLocationByCode: (code: string, type: 'region' | 'city') => LocationDTO | null;
  
  // Region/City relationships
  getCitiesInRegion: (regionCode: string) => Promise<LocationDTO[]>;
  getRegionForCity: (cityCode: string) => Promise<LocationDTO | null>;
  
  // Geocoding
  reverseGeocode: (latitude: number, longitude: number) => Promise<LocationDTO | null>;
  geocode: (address: string) => Promise<LocationDTO | null>;
  
  // Location data
  allRegions: Region[] | undefined;
  allCities: City[] | undefined;
  isLoading: boolean;
  error: string | null;
  
  // Mutations
  createLocation: (location: Omit<LocationDTO, 'id'>) => Promise<LocationDTO>;
  updateLocation: (id: string, location: Partial<LocationDTO>) => Promise<LocationDTO>;
  deleteLocation: (id: string) => Promise<void>;
}

/**
 * Hexagonal hook for location operations
 * Follows PROMPTS.md Rule #1: Arrow Flow Architecture
 */
export function useLocationHex(): UseLocationHexResult {
  const locationService = new LocationService(RepositoryFactory.getLocationRepository());

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

  // Search locations
  const searchLocations = useCallback(async (
    query: string, 
    filters?: {
      type?: 'all' | 'regions' | 'cities';
      excludeCodes?: string[];
      maxResults?: number;
    }
  ): Promise<LocationDTO[]> => {
    try {
      const results: LocationDTO[] = [];
      const maxResultsLimit = filters?.maxResults || 10;

      // Search regions
      if (!filters?.type || filters?.type === 'all' || filters?.type === 'regions') {
        const regions = searchRegions(query)
          .filter(region => !filters?.excludeCodes?.includes(region.code))
          .slice(0, maxResultsLimit)
          .map(region => ({
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
          }));
        results.push(...regions);
      }

      // Search cities
      if (!filters?.type || filters?.type === 'all' || filters?.type === 'cities') {
        const cities = searchCities(query)
          .filter(city => !filters?.excludeCodes?.includes(city.code))
          .slice(0, Math.max(0, maxResultsLimit - results.length))
          .map(city => ({
            id: city.code,
            code: city.code,
            name: city.name,
            nameAr: city.nameAr,
            type: 'city' as const,
            parentCode: city.parentCode,
            coordinates: { lat: city.lat, lng: city.lng },
            economicImportance: city.economicImportance,
            population: city.population,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
        results.push(...cities);
      }

      return results;
    } catch (error) {
      console.error('Error searching locations:', error);
      toast.error('Erreur lors de la recherche de localisations');
      return [];
    }
  }, []);

  // Validate location code
  const validateLocationCode = useCallback((code: string, type: 'region' | 'city'): boolean => {
    return type === 'region' ? isValidRegionCode(code) : isValidCityCode(code);
  }, []);

  // Get location by code
  const getLocationByCode = useCallback((code: string, type: 'region' | 'city'): LocationDTO | null => {
    try {
      let location: GeographicUnit | null = null;
      
      if (type === 'region') {
        location = getWilayaByCode(code);
      } else {
        location = getCityByCode(code);
      }

      if (!location) return null;

      return {
        id: location.code,
        code: location.code,
        name: location.name,
        nameAr: 'nameAr' in location ? location.nameAr : '',
        type: type,
        coordinates: { lat: location.lat, lng: location.lng },
        economicImportance: 'economicImportance' in location ? location.economicImportance : undefined,
        population: 'population' in location ? location.population : undefined,
        parentCode: 'parentCode' in location ? location.parentCode : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting location by code:', error);
      return null;
    }
  }, []);

  // Get cities in region
  const getCitiesInRegion = useCallback(async (regionCode: string): Promise<LocationDTO[]> => {
    try {
      const cities = getCitiesByWilaya(regionCode);
      return cities.map(city => ({
        id: city.code,
        code: city.code,
        name: city.name,
        nameAr: city.nameAr,
        type: 'city' as const,
        parentCode: city.parentCode,
        coordinates: { lat: city.lat, lng: city.lng },
        economicImportance: city.economicImportance,
        population: city.population,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error getting cities in region:', error);
      toast.error('Erreur lors de la récupération des villes de la région');
      return [];
    }
  }, []);

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

  // Reverse geocoding (coordinates to location)
  const reverseGeocode = useCallback(async (latitude: number, longitude: number): Promise<LocationDTO | null> => {
    try {
      // This would typically call a geocoding service
      // For now, we'll use a simple distance-based approach
      const allLocations: LocationDTO[] = [];
      
      // Add all regions
      if (allRegions) {
        allRegions.push(...allRegions.map(region => ({
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
        })));
      }
      
      // Add all cities
      if (allCities) {
        allCities.push(...allCities.map(city => ({
          id: city.code,
          code: city.code,
          name: city.name,
          nameAr: city.nameAr,
          type: 'city' as const,
          parentCode: city.parentCode,
          coordinates: { lat: city.lat, lng: city.lng },
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
  }, [allRegions, allCities]);

  // Forward geocoding (address to location)
  const geocode = useCallback(async (address: string): Promise<LocationDTO | null> => {
    try {
      // Try to find region by address
      const region = findRegionByLocation(address);
      if (region) {
        return {
          id: region.code,
          code: region.code,
          name: region.name,
          nameAr: region.nameAr,
          type: 'region' as const,
          coordinates: { lat: region.lat, lng: region.lng },
          economicImportance: region.economicImportance,
          population: region.population
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
          coordinates: { lat: city.lat, lng: city.lng },
          economicImportance: city.economicImportance,
          population: city.population
        };
      }

      return null;
    } catch (error) {
      console.error('Error geocoding:', error);
      toast.error('Erreur lors du géocodage');
      return null;
    }
  }, []);

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
    reverseGeocode,
    geocode,
    allRegions,
    allCities,
    isLoading: regionsLoading || citiesLoading,
    error: null, // Could be enhanced with error handling
    createLocation: createLocationMutation.mutateAsync,
    updateLocation: updateLocationMutation.mutateAsync,
    deleteLocation: deleteLocationMutation.mutateAsync
  };
}
