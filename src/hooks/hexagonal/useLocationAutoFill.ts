/**
 * LocationAutoFill Hook
 * Reusable hook for location auto-fill functionality using GeocodingService
 * Provides forward/reverse geocoding and Mauritania-specific location matching
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

// Import GeocodingService and Mauritania data
import { GeocodingService, GeocodingResult, ReverseGeocodingResult } from '@/application/services/GeocodingService';
import { Region, City, MAURITANIA_CITIES, MAURITANIA_REGIONS } from '@/utils/mauritania';
import { searchRegions, searchCities } from '@/utils/mauritaniaUtils';

export interface AutoFillLocationData {
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  region?: Region;
  city?: City;
  confidence: number;
  type: 'region' | 'city' | 'address' | 'landmark';
  metadata?: {
    code?: string;
    isCapital?: boolean;
    economicImportance?: string;
    population?: number;
    hasAirport?: boolean;
    hasPort?: boolean;
    hasUniversity?: boolean;
  };
}

export interface LocationAutoFillResult {
  // Geocoding methods
  geocodeAddress: (address: string) => Promise<AutoFillLocationData | null>;
  reverseGeocode: (lat: number, lng: number) => Promise<AutoFillLocationData | null>;

  // Mauritania-specific methods
  searchMauritaniaLocations: (query: string) => Promise<AutoFillLocationData[]>;
  findNearestLocation: (lat: number, lng: number) => Promise<AutoFillLocationData | null>;

  // Location data
  allRegions: Region[];
  allCities: City[];
  isLoading: boolean;
  error: string | null;

  // Map click integration
  handleMapClick: (coordinates: { lat: number; lng: number }) => Promise<AutoFillLocationData | null>;
}

export function useLocationAutoFill(): LocationAutoFillResult {
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize GeocodingService with OpenStreetMap configuration
  const geocodingService = useMemo(() =>
    new GeocodingService({
      provider: 'openstreetmap',
      userAgent: 'MauritaniaMapper/1.0 (location-autofill-hook)',
      prioritizeLocal: true // Use Mauritania data first
    }),
    []
  );

  // Query all regions and cities
  const { data: allRegions = [], isLoading: regionsLoading } = useQuery({
    queryKey: ['location-autofill', 'regions'],
    queryFn: async () => MAURITANIA_REGIONS,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  const { data: allCities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ['location-autofill', 'cities'],
    queryFn: async () => MAURITANIA_CITIES,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Forward geocoding - address to coordinates
  const geocodeAddress = useCallback(async (address: string): Promise<AutoFillLocationData | null> => {
    try {
      setIsProcessing(true);

      const results = await geocodingService.geocode(address);
      if (!results || results.length === 0) {
        toast.warning('Aucune localisation trouvée pour cette adresse');
        return null;
      }

      const bestResult = results[0];
      const locationData: AutoFillLocationData = {
        address: bestResult.address,
        coordinates: bestResult.coordinates,
        confidence: bestResult.confidence,
        type: bestResult.type,
        metadata: bestResult.metadata
      };

      // Try to match with local Mauritania data
      if (bestResult.metadata?.code) {
        if (bestResult.type === 'region') {
          locationData.region = allRegions.find(r => r.code === bestResult.metadata?.code);
        } else if (bestResult.type === 'city') {
          locationData.city = allCities.find(c => c.code === bestResult.metadata?.code);
          if (locationData.city?.parentCode) {
            locationData.region = allRegions.find(r => r.code === locationData.city?.parentCode);
          }
        }
      }

      toast.success(`Adresse géolocalisée avec ${Math.round(bestResult.confidence * 100)}% de confiance`);
      return locationData;

    } catch (error) {
      console.error('Geocoding failed:', error);
      toast.error('Erreur lors de la géolocalisation de l\'adresse');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [geocodingService, allRegions, allCities]);

  // Reverse geocoding - coordinates to address
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<AutoFillLocationData | null> => {
    try {
      setIsProcessing(true);

      const results = await geocodingService.reverseGeocode(lat, lng);
      if (!results || results.length === 0) {
        toast.warning('Impossible de trouver une adresse pour ces coordonnées');
        return null;
      }

      const bestResult = results[0];
      const locationData: AutoFillLocationData = {
        address: bestResult.address,
        coordinates: bestResult.coordinates,
        confidence: bestResult.confidence,
        type: bestResult.type,
        metadata: bestResult.metadata
      };

      // Try to match with local Mauritania data
      if (bestResult.metadata?.code) {
        if (bestResult.type === 'region') {
          locationData.region = allRegions.find(r => r.code === bestResult.metadata?.code);
        } else if (bestResult.type === 'city') {
          locationData.city = allCities.find(c => c.code === bestResult.metadata?.code);
          if (locationData.city?.parentCode) {
            locationData.region = allRegions.find(r => r.code === locationData.city?.parentCode);
          }
        }
      }

      return locationData;

    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      toast.error('Erreur lors du géocodage inversé');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [geocodingService, allRegions, allCities]);

  // Search Mauritania locations
  const searchMauritaniaLocations = useCallback(async (query: string): Promise<AutoFillLocationData[]> => {
    try {
      const results = await geocodingService.searchMauritaniaLocations(query);

      return results.map(result => {
        const locationData: AutoFillLocationData = {
          address: result.name,
          coordinates: result.lat && result.lng ? { lat: result.lat, lng: result.lng } : undefined,
          confidence: result.economicImportance === 'capital' ? 1.0 :
                    result.economicImportance === 'economic' ? 0.9 : 0.8,
          type: 'region'
        };

        // Determine if it's a region or city and populate accordingly
        if ('parentCode' in result) {
          // It's a city
          locationData.type = 'city';
          locationData.city = result as City;
          if (result.parentCode) {
            locationData.region = allRegions.find(r => r.code === result.parentCode);
          }
        } else {
          // It's a region
          locationData.region = result as Region;
        }

        locationData.metadata = {
          code: result.code,
          isCapital: 'isCapital' in result ? result.isCapital : false,
          economicImportance: result.economicImportance,
          population: result.population,
          hasAirport: 'hasAirport' in result ? result.hasAirport : false,
          hasPort: 'hasPort' in result ? result.hasPort : false,
          hasUniversity: 'hasUniversity' in result ? result.hasUniversity : false
        };

        return locationData;
      });
    } catch (error) {
      console.error('Mauritania search failed:', error);
      return [];
    }
  }, [geocodingService, allRegions]);

  // Find nearest location to coordinates
  const findNearestLocation = useCallback(async (lat: number, lng: number): Promise<AutoFillLocationData | null> => {
    try {
      // First try reverse geocoding
      const reverseResult = await reverseGeocode(lat, lng);
      if (reverseResult) return reverseResult;

      // Fallback to distance-based search in local data
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      let nearestCity: City | null = null as City | null;
      let nearestRegion: Region | null = null as Region | null;
      let minCityDistance = Infinity;
      let minRegionDistance = Infinity;

      // Find nearest city
      allCities.forEach(city => {
        const distance = calculateDistance(lat, lng, city.lat, city.lng);
        if (distance < minCityDistance && distance < 50) { // Within 50km
          minCityDistance = distance;
          nearestCity = city;
        }
      });

      // Find nearest region
      allRegions.forEach(region => {
        const distance = calculateDistance(lat, lng, region.lat, region.lng);
        if (distance < minRegionDistance && distance < 200) { // Within 200km
          minRegionDistance = distance;
          nearestRegion = region;
        }
      });

      // Return the closer one (city preferred if within reasonable distance)
      if (nearestCity && minCityDistance <= minRegionDistance) {
        return {
          address: nearestCity.name,
          coordinates: { lat: nearestCity.lat, lng: nearestCity.lng },
          city: nearestCity,
          region: nearestRegion || allRegions.find(r => r.code === nearestCity?.parentCode),
          confidence: Math.max(0.6, 1 - (minCityDistance / 50)),
          type: 'city',
          metadata: {
            code: nearestCity.code,
            isCapital: nearestCity.isCapital,
            economicImportance: nearestCity.economicImportance,
            population: nearestCity.population,
            hasAirport: nearestCity.hasAirport,
            hasPort: nearestCity.hasPort,
            hasUniversity: nearestCity.hasUniversity
          }
        };
      } else if (nearestRegion) {
        return {
          address: nearestRegion.name,
          coordinates: { lat: nearestRegion.lat, lng: nearestRegion.lng },
          region: nearestRegion,
          confidence: Math.max(0.4, 1 - (minRegionDistance / 200)),
          type: 'region',
          metadata: {
            code: nearestRegion.code,
            economicImportance: nearestRegion.economicImportance,
            population: nearestRegion.population
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Find nearest location failed:', error);
      return null;
    }
  }, [reverseGeocode, allCities, allRegions]);

  // Map click handler - enhanced version for all forms
  const handleMapClick = useCallback(async (coordinates: { lat: number; lng: number }): Promise<AutoFillLocationData | null> => {
    try {
      setIsProcessing(true);
      toast.info('🔍 Recherche de l\'adresse et analyse de la localisation...', {
        duration: 3000
      });

      // Use reverse geocoding to get address and location data
      const locationData = await reverseGeocode(coordinates.lat, coordinates.lng);

      if (locationData) {
        const locationDetails = locationData.city ? `${locationData.city.name}${locationData.region ? `, ${locationData.region.name}` : ''}` : 'Localisation trouvée';
        toast.success(`✅ Adresse et coordonnées automatiquement remplies!\n📍 ${locationDetails}`, {
          duration: 5000
        });
        return locationData;
      }

      // Fallback if reverse geocoding fails
      const fallbackData: AutoFillLocationData = {
        address: `Lat: ${coordinates.lat.toFixed(6)}, Lng: ${coordinates.lng.toFixed(6)}`,
        coordinates,
        confidence: 0.5,
        type: 'address'
      };

      toast.warning('⚠️ Coordonnées mises à jour, mais impossible de trouver l\'adresse automatiquement', {
        duration: 4000
      });

      return fallbackData;

    } catch (error) {
      console.error('Map click processing failed:', error);

      // Final fallback
      const fallbackData: AutoFillLocationData = {
        address: `Lat: ${coordinates.lat.toFixed(6)}, Lng: ${coordinates.lng.toFixed(6)}`,
        coordinates,
        confidence: 0.5,
        type: 'address'
      };

      toast.warning('⚠️ Erreur lors de l\'analyse de localisation', {
        duration: 4000
      });

      return fallbackData;
    } finally {
      setIsProcessing(false);
    }
  }, [reverseGeocode]);

  return {
    geocodeAddress,
    reverseGeocode,
    searchMauritaniaLocations,
    findNearestLocation,
    handleMapClick,
    allRegions,
    allCities,
    isLoading: regionsLoading || citiesLoading || isProcessing,
    error: null // Could be enhanced with error states
  };
}
