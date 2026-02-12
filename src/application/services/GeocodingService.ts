/**
 * Geocoding Service
 * Handles forward and reverse geocoding operations
 * Following PROMPTS.md Rule #1: Arrow Flow Architecture
 */

import { AppError, NetworkError } from '@/utils/errors';
import { LocationDTO } from '@/dtos/shared';

export interface GeocodingResult {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  confidence: number;
  type: 'address' | 'city' | 'region' | 'landmark';
  components?: {
    city?: string;
    region?: string;
    country?: string;
    postalCode?: string;
  };
}

export interface ReverseGeocodingResult {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  confidence: number;
  type: 'address' | 'city' | 'region' | 'landmark';
  components?: {
    city?: string;
    region?: string;
    country?: string;
    postalCode?: string;
  };
}

/**
 * Geocoding Service
 * Provides geocoding functionality using external APIs or local data
 */
export class GeocodingService {
  private readonly apiKey?: string;
  private readonly baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEOCODING_API_KEY;
    this.baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
  }

  /**
   * Forward geocoding: Convert address to coordinates
   */
  async geocode(address: string): Promise<GeocodingResult[]> {
    try {
      if (!address || address.trim().length === 0) {
        throw new AppError('Address is required for geocoding', 'VALIDATION_ERROR');
      }

      // Try local Mauritania data first
      const localResults = await this.geocodeLocal(address);
      if (localResults.length > 0) {
        return localResults;
      }

      // Fallback to external API if available
      if (this.apiKey) {
        return await this.geocodeExternal(address);
      }

      // Return empty results if no API key
      return [];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new NetworkError('Failed to geocode address', error);
    }
  }

  /**
   * Reverse geocoding: Convert coordinates to address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodingResult[]> {
    try {
      if (!this.isValidCoordinate(latitude, longitude)) {
        throw new AppError('Invalid coordinates provided', 'VALIDATION_ERROR');
      }

      // Try local Mauritania data first
      const localResults = await this.reverseGeocodeLocal(latitude, longitude);
      if (localResults.length > 0) {
        return localResults;
      }

      // Fallback to external API if available
      if (this.apiKey) {
        return await this.reverseGeocodeExternal(latitude, longitude);
      }

      // Return empty results if no API key
      return [];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new NetworkError('Failed to reverse geocode coordinates', error);
    }
  }

  /**
   * Batch geocoding for multiple addresses
   */
  async batchGeocode(addresses: string[]): Promise<GeocodingResult[][]> {
    try {
      const results: GeocodingResult[][] = [];
      
      // Process addresses in batches to avoid rate limiting
      const batchSize = 10;
      for (let i = 0; i < addresses.length; i += batchSize) {
        const batch = addresses.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(address => this.geocode(address))
        );
        results.push(batchResults);
      }

      return results;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new NetworkError('Failed to batch geocode addresses', error);
    }
  }

  /**
   * Validate coordinates
   */
  private isValidCoordinate(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180 &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    );
  }

  /**
   * Local geocoding using Mauritania data
   */
  private async geocodeLocal(address: string): Promise<GeocodingResult[]> {
    try {
      // Import Mauritania utilities dynamically to avoid circular dependencies
      const { searchRegions, searchCities } = await import('@/utils/mauritaniaUtils');
      
      const results: GeocodingResult[] = [];
      
      // Search regions
      const regions = searchRegions(address);
      regions.forEach(region => {
        results.push({
          address: region.name,
          coordinates: { lat: region.lat, lng: region.lng },
          confidence: 0.9,
          type: 'region' as const,
          components: {
            city: undefined,
            region: region.name,
            country: 'Mauritania',
            postalCode: undefined
          }
        });
      });

      // Search cities
      const cities = searchCities(address);
      cities.forEach(city => {
        results.push({
          address: city.name,
          coordinates: { lat: city.lat, lng: city.lng },
          confidence: 0.95,
          type: 'city' as const,
          components: {
            city: city.name,
            region: city.parentCode ? this.getRegionName(city.parentCode) : undefined,
            country: 'Mauritania',
            postalCode: undefined
          }
        });
      });

      return results.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Local geocoding failed:', error);
      return [];
    }
  }

  /**
   * Local reverse geocoding using Mauritania data
   */
  private async reverseGeocodeLocal(latitude: number, longitude: number): Promise<ReverseGeocodingResult[]> {
    try {
      // Import Mauritania utilities dynamically
      const { MAURITANIA_REGIONS, MAURITANIA_CITIES } = await import('@/types/mauritania');
      
      const results: ReverseGeocodingResult[] = [];
      
      // Find nearest region
      let nearestRegion = null;
      let minRegionDistance = Infinity;
      
      MAURITANIA_REGIONS.forEach(region => {
        const distance = this.calculateDistance(latitude, longitude, region.lat, region.lng);
        if (distance < minRegionDistance && distance < 50) { // Within 50km
          minRegionDistance = distance;
          nearestRegion = region;
        }
      });

      if (nearestRegion) {
        results.push({
          address: nearestRegion.name,
          coordinates: { lat: nearestRegion.lat, lng: nearestRegion.lng },
          confidence: Math.max(0.5, 1 - (minRegionDistance / 50)),
          type: 'region' as const,
          components: {
            city: undefined,
            region: nearestRegion.name,
            country: 'Mauritania',
            postalCode: undefined
          }
        });
      }

      // Find nearest city
      let nearestCity = null;
      let minCityDistance = Infinity;
      
      MAURITANIA_CITIES.forEach(city => {
        const distance = this.calculateDistance(latitude, longitude, city.lat, city.lng);
        if (distance < minCityDistance && distance < 25) { // Within 25km
          minCityDistance = distance;
          nearestCity = city;
        }
      });

      if (nearestCity) {
        results.push({
          address: nearestCity.name,
          coordinates: { lat: nearestCity.lat, lng: nearestCity.lng },
          confidence: Math.max(0.6, 1 - (minCityDistance / 25)),
          type: 'city' as const,
          components: {
            city: nearestCity.name,
            region: nearestCity.parentCode ? this.getRegionName(nearestCity.parentCode) : undefined,
            country: 'Mauritania',
            postalCode: undefined
          }
        });
      }

      return results.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Local reverse geocoding failed:', error);
      return [];
    }
  }

  /**
   * External geocoding using Mapbox API
   */
  private async geocodeExternal(address: string): Promise<GeocodingResult[]> {
    try {
      if (!this.apiKey) {
        throw new AppError('Geocoding API key not configured', 'CONFIGURATION_ERROR');
      }

      const url = `${this.baseUrl}/${encodeURIComponent(address)}.json`;
      const params = new URLSearchParams({
        access_token: this.apiKey,
        country: 'MR', // Limit to Mauritania
        types: 'place,region,address'
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new NetworkError(`Geocoding API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.features || data.features.length === 0) {
        return [];
      }

      return data.features.map((feature: Record<string, unknown>) => {
        const center = feature.center as number[];
        const placeType = feature.place_type as string[];
        const context = feature.context as Record<string, unknown>[];
        
        return {
          address: (feature.place_name as string) || (feature.text as string),
          coordinates: {
            lat: center[1],
            lng: center[0]
          },
          confidence: (feature.relevance as number) || 0.5,
          type: this.mapMapboxType(placeType[0]),
          components: this.parseMapboxComponents(context)
        };
      });
    } catch (error) {
      console.error('External geocoding failed:', error);
      return [];
    }
  }

  /**
   * External reverse geocoding using Mapbox API
   */
  private async reverseGeocodeExternal(latitude: number, longitude: number): Promise<ReverseGeocodingResult[]> {
    try {
      if (!this.apiKey) {
        throw new AppError('Geocoding API key not configured', 'CONFIGURATION_ERROR');
      }

      const url = `${this.baseUrl}/${longitude},${latitude}.json`;
      const params = new URLSearchParams({
        access_token: this.apiKey,
        types: 'place,region,address'
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new NetworkError(`Reverse geocoding API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.features || data.features.length === 0) {
        return [];
      }

      return data.features.map((feature: Record<string, unknown>) => {
        const center = feature.center as number[];
        const placeType = feature.place_type as string[];
        const context = feature.context as Record<string, unknown>[];
        
        return {
          address: (feature.place_name as string) || (feature.text as string),
          coordinates: {
            lat: center[1],
            lng: center[0]
          },
          confidence: (feature.relevance as number) || 0.5,
          type: this.mapMapboxType(placeType[0]),
          components: this.parseMapboxComponents(context)
        };
      });
    } catch (error) {
      console.error('External reverse geocoding failed:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two points in kilometers
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get region name by code
   */
  private getRegionName(code: string): string {
    // This would typically use the Mauritania utilities
    // For now, return the code as fallback
    return code;
  }

  /**
   * Map Mapbox place types to our types
   */
  private mapMapboxType(mapboxType: string): 'address' | 'city' | 'region' | 'landmark' {
    const typeMap: Record<string, 'address' | 'city' | 'region' | 'landmark'> = {
      'address': 'address',
      'poi': 'landmark',
      'place': 'city',
      'region': 'region',
      'country': 'region',
      'postcode': 'address'
    };
    
    return typeMap[mapboxType] || 'address';
  }

  /**
   * Parse Mapbox context components
   */
  private parseMapboxComponents(context: Record<string, unknown>[]): Record<string, string> {
    const components: Record<string, string> = {};
    
    context.forEach(item => {
      const itemId = item.id as string;
      const itemText = item.text as string;
      
      if (itemId.startsWith('place.')) {
        components.city = itemText;
      } else if (itemId.startsWith('region.')) {
        components.region = itemText;
      } else if (itemId.startsWith('country.')) {
        components.country = itemText;
      } else if (itemId.startsWith('postcode.')) {
        components.postalCode = itemText;
      }
    });
    
    return components;
  }
}
