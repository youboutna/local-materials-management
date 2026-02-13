/**
 * Geocoding Service
 * Handles forward and reverse geocoding operations
 */

import { AppError, NetworkError } from '@/utils/errors';
import { GeographicUnit } from '@/utils/mauritania';

export interface GeocodingResult {
  address: string;
  coordinates: { lat: number; lng: number };
  confidence: number;
  type: 'address' | 'city' | 'region' | 'landmark';
  components?: { city?: string; region?: string; country?: string; postalCode?: string };
}

export interface ReverseGeocodingResult {
  address: string;
  coordinates: { lat: number; lng: number };
  confidence: number;
  type: 'address' | 'city' | 'region' | 'landmark';
  components?: { city?: string; region?: string; country?: string; postalCode?: string };
}

export class GeocodingService {
  private readonly apiKey?: string;
  private readonly baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEOCODING_API_KEY;
    this.baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
  }

  async geocode(address: string): Promise<GeocodingResult[]> {
    try {
      if (!address?.trim()) throw new AppError('Address is required for geocoding', 'VALIDATION_ERROR');
      const localResults = await this.geocodeLocal(address);
      if (localResults.length > 0) return localResults;
      if (this.apiKey) return await this.geocodeExternal(address);
      return [];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new NetworkError('Failed to geocode address', error);
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodingResult[]> {
    try {
      if (!this.isValidCoordinate(latitude, longitude)) throw new AppError('Invalid coordinates provided', 'VALIDATION_ERROR');
      const localResults = await this.reverseGeocodeLocal(latitude, longitude);
      if (localResults.length > 0) return localResults;
      if (this.apiKey) return await this.reverseGeocodeExternal(latitude, longitude);
      return [];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new NetworkError('Failed to reverse geocode coordinates', error);
    }
  }

  async batchGeocode(addresses: string[]): Promise<GeocodingResult[][]> {
    try {
      const results: GeocodingResult[][] = [];
      const batchSize = 10;
      for (let i = 0; i < addresses.length; i += batchSize) {
        const batch = addresses.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(address => this.geocode(address)));
        results.push(...batchResults);
      }
      return results;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new NetworkError('Failed to batch geocode addresses', error);
    }
  }

  private isValidCoordinate(latitude: number, longitude: number): boolean {
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180 && !isNaN(latitude) && !isNaN(longitude);
  }

  private async geocodeLocal(address: string): Promise<GeocodingResult[]> {
    try {
      const { searchRegions, searchCities } = await import('@/utils/mauritaniaUtils');
      const results: GeocodingResult[] = [];
      
      const regions = searchRegions(address);
      regions.forEach((region: any) => {
        results.push({
          address: region.name,
          coordinates: { lat: region.lat, lng: region.lng },
          confidence: 0.9,
          type: 'region' as const,
          components: { region: region.name, country: 'Mauritania' }
        });
      });

      const cities = searchCities(address);
      cities.forEach((city: any) => {
        results.push({
          address: city.name,
          coordinates: { lat: city.lat, lng: city.lng },
          confidence: 0.95,
          type: 'city' as const,
          components: { city: city.name, region: city.parentCode ? this.getRegionName(city.parentCode) : undefined, country: 'Mauritania' }
        });
      });

      return results.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Local geocoding failed:', error);
      return [];
    }
  }

  private async reverseGeocodeLocal(latitude: number, longitude: number): Promise<ReverseGeocodingResult[]> {
    try {
      const { MAURITANIA_REGIONS, MAURITANIA_CITIES } = await import('@/utils/mauritania');
      const results: ReverseGeocodingResult[] = [];
      
      let nearestRegion: any = null;
      let minRegionDistance = Infinity;
      
      MAURITANIA_REGIONS.forEach((region: any) => {
        const distance = this.calculateDistance(latitude, longitude, region.lat, region.lng);
        if (distance < minRegionDistance && distance < 50) {
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
          components: { region: nearestRegion.name, country: 'Mauritania' }
        });
      }

      let nearestCity: any = null;
      let minCityDistance = Infinity;
      
      MAURITANIA_CITIES.forEach((city: any) => {
        const distance = this.calculateDistance(latitude, longitude, city.lat, city.lng);
        if (distance < minCityDistance && distance < 25) {
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
          components: { city: nearestCity.name, region: nearestCity.parentCode ? this.getRegionName(nearestCity.parentCode) : undefined, country: 'Mauritania' }
        });
      }

      return results.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Local reverse geocoding failed:', error);
      return [];
    }
  }

  private async geocodeExternal(address: string): Promise<GeocodingResult[]> {
    try {
      if (!this.apiKey) throw new AppError('Geocoding API key not configured', 'CONFIGURATION_ERROR');
      const url = `${this.baseUrl}/${encodeURIComponent(address)}.json`;
      const params = new URLSearchParams({ access_token: this.apiKey, country: 'MR', types: 'place,region,address' });
      const response = await fetch(`${url}?${params}`);
      if (!response.ok) throw new NetworkError(`Geocoding API error: ${response.statusText}`);
      const data = await response.json();
      if (!data.features?.length) return [];
      return data.features.map((feature: any) => ({
        address: feature.place_name || feature.text,
        coordinates: { lat: feature.center[1], lng: feature.center[0] },
        confidence: feature.relevance || 0.5,
        type: this.mapMapboxType(feature.place_type?.[0]),
        components: this.parseMapboxComponents(feature.context || [])
      }));
    } catch (error) { console.error('External geocoding failed:', error); return []; }
  }

  private async reverseGeocodeExternal(latitude: number, longitude: number): Promise<ReverseGeocodingResult[]> {
    try {
      if (!this.apiKey) throw new AppError('Geocoding API key not configured', 'CONFIGURATION_ERROR');
      const url = `${this.baseUrl}/${longitude},${latitude}.json`;
      const params = new URLSearchParams({ access_token: this.apiKey, types: 'place,region,address' });
      const response = await fetch(`${url}?${params}`);
      if (!response.ok) throw new NetworkError(`Reverse geocoding API error: ${response.statusText}`);
      const data = await response.json();
      if (!data.features?.length) return [];
      return data.features.map((feature: any) => ({
        address: feature.place_name || feature.text,
        coordinates: { lat: feature.center[1], lng: feature.center[0] },
        confidence: feature.relevance || 0.5,
        type: this.mapMapboxType(feature.place_type?.[0]),
        components: this.parseMapboxComponents(feature.context || [])
      }));
    } catch (error) { console.error('External reverse geocoding failed:', error); return []; }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));@/utils/mauritania
  }

  private toRadians(degrees: number): number { return degrees * (Math.PI / 180); }
  private getRegionName(code: string): string { return code; }

  private mapMapboxType(mapboxType: string): 'address' | 'city' | 'region' | 'landmark' {
    const typeMap: Record<string, 'address' | 'city' | 'region' | 'landmark'> = { address: 'address', poi: 'landmark', place: 'city', region: 'region', country: 'region', postcode: 'address' };
    return typeMap[mapboxType] || 'address';
  }

  private parseMapboxComponents(context: any[]): Record<string, string> {
    const components: Record<string, string> = {};
    (context || []).forEach((item: any) => {
      if (item.id?.startsWith('place.')) components.city = item.text;
      else if (item.id?.startsWith('region.')) components.region = item.text;
      else if (item.id?.startsWith('country.')) components.country = item.text;
      else if (item.id?.startsWith('postcode.')) components.postalCode = item.text;
    });
    return components;
  }
}
