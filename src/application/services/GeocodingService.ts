/**
 * Geocoding Service
 * Handles forward and reverse geocoding operations with Mauritania-specific data
 */

import { AppError, NetworkError } from '@/utils/errors';
import { 
  GeographicUnit,
  Region, 
  City, 
  MAURITANIA_REGIONS, 
  MAURITANIA_CITIES,
  CITY_TO_REGION_MAP,
  getWilayaByCode,
  getCityByCode,
  getCitiesByWilaya,
  getWilayaCapital,
  getMajorCities,
  getAllGeographicUnits
} from '@/utils/mauritania';
import {
  searchRegions,
  searchCities,
  findRegionByLocation,
  getCityCoordinates,
  isValidRegionCode,
  isValidCityCode,
  isValidCityRegion,
  isLocationInRegion
} from '@/utils/mauritaniaUtils';

export interface GeocodingResult {
  address: string;
  coordinates: { lat: number; lng: number };
  confidence: number;
  type: 'address' | 'city' | 'region' | 'landmark';
  components?: { 
    city?: string; 
    region?: string; 
    country?: string; 
    postalCode?: string;
    road?: string;
    county?: string;
    state?: string;
    countryCode?: string;
    isoCode?: string;
  };
  metadata?: {
    code?: string;
    isCapital?: boolean;
    economicImportance?: string;
    population?: number;
    hasAirport?: boolean;
    hasPort?: boolean;
    hasUniversity?: boolean;
    marketDays?: string[];
    parentCode?: string;
  };
}

export interface ReverseGeocodingResult {
  address: string;
  coordinates: { lat: number; lng: number };
  confidence: number;
  type: 'address' | 'city' | 'region' | 'landmark';
  components?: { 
    city?: string; 
    region?: string; 
    country?: string; 
    postalCode?: string;
    road?: string;
    county?: string;
    state?: string;
    countryCode?: string;
    isoCode?: string;
  };
  metadata?: {
    code?: string;
    isCapital?: boolean;
    economicImportance?: string;
    population?: number;
    hasAirport?: boolean;
    hasPort?: boolean;
    hasUniversity?: boolean;
    marketDays?: string[];
    parentCode?: string;
  };
}

export interface GeocodingConfig {
  provider?: 'google' | 'mapbox' | 'openstreetmap';
  apiKey?: string;
  userAgent?: string; // Required for OpenStreetMap
  prioritizeLocal?: boolean; // Prioritize local Mauritania data (default: true)
}

// =================== EXTERNAL API RESPONSE INTERFACES ===================

interface OpenStreetMapResponse {
  place_id?: string;
  licence?: string;
  osm_type?: string;
  osm_id?: string;
  boundingbox?: string[];
  lat: string;
  lon: string;
  display_name: string;
  class?: string;
  type?: string;
  importance?: number;
  address?: Record<string, string | undefined>;
}

interface GoogleGeocodingResponse {
  status: string;
  results?: Array<{
    address_components?: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      location_type: string;
    };
    place_id?: string;
    types?: string[];
  }>;
}

interface MapboxGeocodingResponse {
  features?: Array<{
    id?: string;
    type: string;
    place_type?: string[];
    relevance?: number;
    properties?: Record<string, unknown>;
    text?: string;
    place_name?: string;
    bbox?: number[];
    center: [number, number];
    geometry?: {
      type: string;
      coordinates: number[];
    };
    context?: Array<{
      id: string;
      text: string;
      short_code?: string;
    }>;
  }>;
}

export class GeocodingService {
  getCity(cityName: any) {
    return getCityByCode(cityName) || getWilayaByCode(cityName);
  }
  getCityByCode(code: string) {
    return getCityByCode(code);
  }
  getRegionByCode(code: string) {
    return getWilayaByCode(code);
  }
  findRegionByLocation(coordinates: { lat: number; lng: number; }) {
    // Find nearest region to coordinates
    let nearestRegion: Region | null = null;
    let minDistance = Infinity;
    
    MAURITANIA_REGIONS.forEach(region => {
      const distance = this.calculateDistance(coordinates.lat, coordinates.lng, region.lat, region.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestRegion = region;
      }
    });
    
    return nearestRegion;
  }
  getGeographicUnitByCode(code: string) {
    return getCityByCode(code) || getWilayaByCode(code);
  }
  private readonly apiKey?: string;
  private readonly provider: 'google' | 'mapbox' | 'openstreetmap';
  private readonly userAgent?: string;
  private readonly prioritizeLocal: boolean;
  private readonly baseUrls = {
    google: 'https://maps.googleapis.com/maps/api/geocode/json',
    mapbox: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
    openstreetmap: 'https://nominatim.openstreetmap.org'
  };

  // Cache for search terms
  private readonly regionSearchTermsCache: Map<string, string[]> = new Map();
  private readonly citySearchTermsCache: Map<string, string[]> = new Map();

  constructor(config: GeocodingConfig = {}) {
    this.provider = config.provider || 'openstreetmap';
    this.apiKey = config.apiKey || (typeof window !== 'undefined' && import.meta?.env?.GEOCODING_API_KEY) || undefined;
    this.userAgent = config.userAgent || 'MauritaniaMapper/1.0 (contact@mauritania-mapper.mr)';
    this.prioritizeLocal = config.prioritizeLocal !== false; // Default to true
    
    // Initialize search terms cache
    this.initializeSearchTermsCache();
  }

  private initializeSearchTermsCache(): void {
    // Cache region search terms from CITY_TO_REGION_MAP
    Object.entries(CITY_TO_REGION_MAP).forEach(([code, terms]) => {
      this.regionSearchTermsCache.set(code, terms);
    });

    // Cache city search terms from City objects
    MAURITANIA_CITIES.forEach(city => {
      if (city.searchTerms && city.searchTerms.length > 0) {
        this.citySearchTermsCache.set(city.code, city.searchTerms);
      }
    });
  }

  // =================== PUBLIC METHODS ===================

  async geocode(address: string): Promise<GeocodingResult[]> {
    try {
      if (!address?.trim()) {
        throw new AppError('Address is required for geocoding', 'VALIDATION_ERROR');
      }

      // Always try local Mauritania data first (if prioritized)
      if (this.prioritizeLocal) {
        const localResults = await this.geocodeLocal(address);
        if (localResults.length > 0) return localResults;
      }

      // Try external geocoding based on provider
      const externalResults = await this.geocodeExternal(address);
      
      // If external results found and we still want local fallback, merge them
      if (externalResults.length > 0) {
        return externalResults;
      }

      // Final fallback: try local even if not prioritized
      if (!this.prioritizeLocal) {
        const localResults = await this.geocodeLocal(address);
        if (localResults.length > 0) return localResults;
      }

      return [];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new NetworkError('Failed to geocode address', error);
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodingResult[]> {
    try {
      if (!this.isValidCoordinate(latitude, longitude)) {
        throw new AppError('Invalid coordinates provided', 'VALIDATION_ERROR');
      }

      // Always try local Mauritania data first (if prioritized)
      if (this.prioritizeLocal) {
        const localResults = await this.reverseGeocodeLocal(latitude, longitude);
        if (localResults.length > 0) return localResults;
      }

      // Try external geocoding based on provider
      const externalResults = await this.reverseGeocodeExternal(latitude, longitude);
      
      // If external results found and we still want local fallback, merge them
      if (externalResults.length > 0) {
        return externalResults;
      }

      // Final fallback: try local even if not prioritized
      if (!this.prioritizeLocal) {
        const localResults = await this.reverseGeocodeLocal(latitude, longitude);
        if (localResults.length > 0) return localResults;
      }

      return [];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new NetworkError('Failed to reverse geocode coordinates', error);
    }
  }

  async batchGeocode(addresses: string[]): Promise<GeocodingResult[][]> {
    try {
      const results: GeocodingResult[][] = [];
      const batchSize = this.provider === 'openstreetmap' ? 1 : 10; // OpenStreetMap has stricter rate limits
      
      for (let i = 0; i < addresses.length; i += batchSize) {
        const batch = addresses.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(address => this.geocode(address))
        );
        results.push(...batchResults);
        
        // Add delay between batches for OpenStreetMap (rate limiting)
        if (this.provider === 'openstreetmap' && i + batchSize < addresses.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      return results;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new NetworkError('Failed to batch geocode addresses', error);
    }
  }

  async searchMauritaniaLocations(query: string): Promise<(Region | City)[]> {
    try {
      const regions = searchRegions(query);
      const cities = searchCities(query);
      return [...regions, ...cities];
    } catch (error) {
      console.error('Mauritania search failed:', error);
      return [];
    }
  }

  async getLocationByCode(code: string): Promise<Region | City | null> {
    return getWilayaByCode(code) || getCityByCode(code) || null;
  }

  async getCitiesInWilaya(wilayaCode: string): Promise<City[]> {
    if (!isValidRegionCode(wilayaCode)) {
      throw new AppError(`Invalid wilaya code: ${wilayaCode}`, 'VALIDATION_ERROR');
    }
    return getCitiesByWilaya(wilayaCode);
  }

  async getWilayaCapital(wilayaCode: string): Promise<City | undefined> {
    if (!isValidRegionCode(wilayaCode)) {
      throw new AppError(`Invalid wilaya code: ${wilayaCode}`, 'VALIDATION_ERROR');
    }
    return getWilayaCapital(wilayaCode);
  }

  async getSearchTermsForLocation(code: string): Promise<string[]> {
    // Check if it's a region
    const regionTerms = this.regionSearchTermsCache.get(code);
    if (regionTerms) return regionTerms;

    // Check if it's a city
    const cityTerms = this.citySearchTermsCache.get(code);
    if (cityTerms) return cityTerms;

    // Try to find by code in regions
    const region = getWilayaByCode(code);
    if (region) {
      return [region.name.toLowerCase(), region.nameAr.toLowerCase()];
    }

    // Try to find by code in cities
    const city = getCityByCode(code);
    if (city) {
      return city.searchTerms || [city.name.toLowerCase(), city.nameAr.toLowerCase()];
    }

    return [];
  }

  async findLocationBySearchTerm(term: string): Promise<(Region | City)[]> {
    const results: (Region | City)[] = [];
    const lowerTerm = term.toLowerCase();

    // Search in region search terms cache
    this.regionSearchTermsCache.forEach((terms, code) => {
      if (terms.some(t => t.toLowerCase().includes(lowerTerm))) {
        const region = getWilayaByCode(code);
        if (region) results.push(region);
      }
    });

    // Search in city search terms cache
    this.citySearchTermsCache.forEach((terms, code) => {
      if (terms.some(t => t.toLowerCase().includes(lowerTerm))) {
        const city = getCityByCode(code);
        if (city) results.push(city);
      }
    });

    return results;
  }

  // =================== PRIVATE METHODS ===================

  private isValidCoordinate(latitude: number, longitude: number): boolean {
    return latitude >= -90 && latitude <= 90 && 
           longitude >= -180 && longitude <= 180 && 
           !isNaN(latitude) && !isNaN(longitude);
  }

  // =================== LOCAL GEOCODING (Mauritania Data) ===================

  private async geocodeLocal(address: string): Promise<GeocodingResult[]> {
    try {
      const results: GeocodingResult[] = [];
      const lowerAddress = address.toLowerCase();
      
      // Search in regions first using utility function
      const regions = searchRegions(address);
      regions.forEach((region: Region) => {
        results.push(this.formatRegionToGeocodingResult(region));
      });

      // Search in cities using utility function
      const cities = searchCities(address);
      cities.forEach((city: City) => {
        results.push(this.formatCityToGeocodingResult(city));
      });

      // If no exact matches, try fuzzy matching with search terms from CITY_TO_REGION_MAP
      if (results.length === 0) {
        // Search using region search terms from CITY_TO_REGION_MAP
        Object.entries(CITY_TO_REGION_MAP).forEach(([code, terms]) => {
          if (terms.some(term => lowerAddress.includes(term.toLowerCase()))) {
            const region = getWilayaByCode(code);
            if (region) {
              results.push(this.formatRegionToGeocodingResult(region));
            }
          }
        });

        // Search using city search terms
        MAURITANIA_CITIES.forEach((city: City) => {
          if (city.searchTerms?.some(term => lowerAddress.includes(term.toLowerCase()))) {
            results.push(this.formatCityToGeocodingResult(city));
          }
        });
      }

      // Also check using isLocationInRegion utility
      MAURITANIA_REGIONS.forEach((region: Region) => {
        if (isLocationInRegion(address, region) && !results.some(r => r.metadata?.code === region.code)) {
          results.push(this.formatRegionToGeocodingResult(region));
        }
      });

      // Sort by confidence and remove duplicates
      return this.deduplicateResults(results.sort((a, b) => b.confidence - a.confidence));
    } catch (error) {
      console.error('Local geocoding failed:', error);
      return [];
    }
  }

  private async reverseGeocodeLocal(latitude: number, longitude: number): Promise<ReverseGeocodingResult[]> {
    try {
      const results: ReverseGeocodingResult[] = [];
      
      // Find nearest region
      let nearestRegion: Region | null = null;
      let minRegionDistance = Infinity;
      
      for (const region of MAURITANIA_REGIONS) {
        const distance = this.calculateDistance(latitude, longitude, region.lat, region.lng);
        if (distance < minRegionDistance && distance < 100) {
          minRegionDistance = distance;
          nearestRegion = region;
        }
      }

      if (nearestRegion) {
        const r = nearestRegion as Region;
        results.push({
          address: r.name,
          coordinates: { lat: r.lat, lng: r.lng },
          confidence: Math.max(0.5, 1 - (minRegionDistance / 100)),
          type: 'region',
          components: { 
            region: r.name, 
            country: 'Mauritania',
            countryCode: 'mr'
          },
          metadata: {
            code: r.code,
            economicImportance: r.economicImportance,
            population: r.population
          }
        });
      }

      // Find nearest city
      let nearestCity: City | null = null;
      let minCityDistance = Infinity;
      
      for (const city of MAURITANIA_CITIES) {
        const distance = this.calculateDistance(latitude, longitude, city.lat, city.lng);
        if (distance < minCityDistance && distance < 50) {
          minCityDistance = distance;
          nearestCity = city;
        }
      }

      if (nearestCity) {
        const c = nearestCity as City;
        const region = getWilayaByCode(c.parentCode);
        results.push({
          address: c.name,
          coordinates: { lat: c.lat, lng: c.lng },
          confidence: Math.max(0.6, 1 - (minCityDistance / 50)),
          type: 'city',
          components: { 
            city: c.name, 
            region: region?.name || c.parentCode,
            country: 'Mauritania',
            countryCode: 'mr'
          },
          metadata: {
            code: c.code,
            isCapital: c.isCapital,
            economicImportance: c.economicImportance,
            population: c.population,
            hasAirport: c.hasAirport,
            hasPort: c.hasPort,
            hasUniversity: c.hasUniversity,
            marketDays: c.marketDays,
            parentCode: c.parentCode
          }
        });
      }

      return this.deduplicateResults(results.sort((a, b) => b.confidence - a.confidence));
    } catch (error) {
      console.error('Local reverse geocoding failed:', error);
      return [];
    }
  }

  // =================== EXTERNAL GEOCODING ===================

  private async geocodeExternal(address: string): Promise<GeocodingResult[]> {
    try {
      if (this.provider === 'openstreetmap') {
        return await this.geocodeOpenStreetMap(address);
      } else if (this.provider === 'google' && this.apiKey) {
        return await this.geocodeGoogle(address);
      } else if (this.provider === 'mapbox' && this.apiKey) {
        return await this.geocodeMapbox(address);
      }
      return [];
    } catch (error) {
      console.error(`${this.provider} geocoding failed:`, error);
      return [];
    }
  }

  private async reverseGeocodeExternal(lat: number, lng: number): Promise<ReverseGeocodingResult[]> {
    try {
      if (this.provider === 'openstreetmap') {
        return await this.reverseGeocodeOpenStreetMap(lat, lng);
      } else if (this.provider === 'google' && this.apiKey) {
        return await this.reverseGeocodeGoogle(lat, lng);
      } else if (this.provider === 'mapbox' && this.apiKey) {
        return await this.reverseGeocodeMapbox(lat, lng);
      }
      return [];
    } catch (error) {
      console.error(`${this.provider} reverse geocoding failed:`, error);
      return [];
    }
  }

  // OpenStreetMap (Nominatim) methods
  private async geocodeOpenStreetMap(address: string): Promise<GeocodingResult[]> {
    try {
      const url = `${this.baseUrls.openstreetmap}/search`;
      const params = new URLSearchParams({
        q: address,
        format: 'json',
        addressdetails: '1',
        limit: '10',
        countrycodes: 'mr', // Focus on Mauritania
        'accept-language': 'en,fr,ar'
      });

      const response = await fetch(`${url}?${params}`, {
        headers: {
          'User-Agent': this.userAgent || 'MauritaniaMapper/1.0'
        }
      });

      if (!response.ok) {
        throw new NetworkError(`OpenStreetMap geocoding error: ${response.statusText}`);
      }

      const data: OpenStreetMapResponse[] = await response.json();
      if (!data || data.length === 0) return [];

      return data.map((item: OpenStreetMapResponse) => this.formatOpenStreetMapResult(item));
    } catch (error) {
      if (error instanceof NetworkError) throw error;
      console.error('OpenStreetMap geocoding failed:', error);
     // TODO: Fallback localdata
      throw new NetworkError('OpenStreetMap geocoding failed');
      return [];
    }
  }

  private async reverseGeocodeOpenStreetMap(lat: number, lng: number): Promise<ReverseGeocodingResult[]> {
    try {
      const url = `${this.baseUrls.openstreetmap}/reverse`;
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        addressdetails: '1',
        zoom: '18',
        'accept-language': 'en,fr,ar'
      });

      const response = await fetch(`${url}?${params}`, {
        headers: {
          'User-Agent': this.userAgent || 'MauritaniaMapper/1.0'
        }
      });

      if (!response.ok) {
        throw new NetworkError(`OpenStreetMap reverse geocoding error: ${response.statusText}`);
      }

      const data: OpenStreetMapResponse = await response.json();
      if (!data || !data.address) return [];

      return [this.formatOpenStreetMapResult(data)];
    } catch (error) {
      console.error('OpenStreetMap reverse geocoding failed:', error);
      return [];
    }
  }

  // Google Maps methods
  private async geocodeGoogle(address: string): Promise<GeocodingResult[]> {
    try {
      if (!this.apiKey) throw new AppError('Google API key not configured', 'CONFIGURATION_ERROR');
      
      const url = this.baseUrls.google;
      const params = new URLSearchParams({
        address: address,
        key: this.apiKey,
        components: 'country:MR', // Focus on Mauritania
        region: 'mr',
        language: 'en'
      });

      const response = await fetch(`${url}?${params}`);
      if (!response.ok) {
        throw new NetworkError(`Google geocoding error: ${response.statusText}`);
      }

      const data: GoogleGeocodingResponse = await response.json();
      if (data.status !== 'OK' || !data.results?.length) return [];

      return (data.results || []).map((result) => this.formatGoogleResult(result));
    } catch (error) {
      console.error('Google geocoding failed:', error);
      return [];
    }
  }

  private async reverseGeocodeGoogle(lat: number, lng: number): Promise<ReverseGeocodingResult[]> {
    try {
      if (!this.apiKey) throw new AppError('Google API key not configured', 'CONFIGURATION_ERROR');
      
      const url = this.baseUrls.google;
      const params = new URLSearchParams({
        latlng: `${lat},${lng}`,
        key: this.apiKey,
        location_type: 'ROOFTOP',
        language: 'en'
      });

      const response = await fetch(`${url}?${params}`);
      if (!response.ok) {
        throw new NetworkError(`Google reverse geocoding error: ${response.statusText}`);
      }

      const data: GoogleGeocodingResponse = await response.json();
      if (data.status !== 'OK' || !data.results?.length) return [];

      return (data.results || []).map((result) => this.formatGoogleResult(result));
    } catch (error) {
      console.error('Google reverse geocoding failed:', error);
      return [];
    }
  }

  // Mapbox methods
  private async geocodeMapbox(address: string): Promise<GeocodingResult[]> {
    try {
      if (!this.apiKey) throw new AppError('Mapbox API key not configured', 'CONFIGURATION_ERROR');
      
      const url = `${this.baseUrls.mapbox}/${encodeURIComponent(address)}.json`;
      const params = new URLSearchParams({
        access_token: this.apiKey,
        country: 'MR',
        types: 'place,region,address,poi',
        language: 'en,fr,ar'
      });

      const response = await fetch(`${url}?${params}`);
      if (!response.ok) {
        throw new NetworkError(`Mapbox geocoding error: ${response.statusText}`);
      }

      const data: MapboxGeocodingResponse = await response.json();
      if (!data.features?.length) return [];

      return (data.features || []).map((feature) => this.formatMapboxResult(feature));
    } catch (error) {
      console.error('Mapbox geocoding failed:', error);
      return [];
    }
  }

  private async reverseGeocodeMapbox(lat: number, lng: number): Promise<ReverseGeocodingResult[]> {
    try {
      if (!this.apiKey) throw new AppError('Mapbox API key not configured', 'CONFIGURATION_ERROR');
      
      const url = `${this.baseUrls.mapbox}/${lng},${lat}.json`;
      const params = new URLSearchParams({
        access_token: this.apiKey,
        types: 'place,region,address,poi',
        language: 'en,fr,ar'
      });

      const response = await fetch(`${url}?${params}`);
      if (!response.ok) {
        throw new NetworkError(`Mapbox reverse geocoding error: ${response.statusText}`);
      }

      const data: MapboxGeocodingResponse = await response.json();
      if (!data.features?.length) return [];

      return (data.features || []).map((feature) => this.formatMapboxResult(feature));
    } catch (error) {
      console.error('Mapbox reverse geocoding failed:', error);
      return [];
    }
  }

  // =================== FORMATTING METHODS ===================

  private formatRegionToGeocodingResult(region: Region): GeocodingResult {
    return {
      address: region.name,
      coordinates: { lat: region.lat, lng: region.lng },
      confidence: 0.9,
      type: 'region',
      components: { 
        region: region.name, 
        country: 'Mauritania',
        countryCode: 'mr'
      },
      metadata: {
        code: region.code,
        economicImportance: region.economicImportance,
        population: region.population
      }
    };
  }

  private formatCityToGeocodingResult(city: City): GeocodingResult {
    const region = getWilayaByCode(city.parentCode);
    
    return {
      address: city.name,
      coordinates: { lat: city.lat, lng: city.lng },
      confidence: 0.95,
      type: 'city',
      components: { 
        city: city.name, 
        region: region?.name || city.parentCode,
        country: 'Mauritania',
        countryCode: 'mr'
      },
      metadata: {
        code: city.code,
        isCapital: city.isCapital,
        economicImportance: city.economicImportance,
        population: city.population,
        hasAirport: city.hasAirport,
        hasPort: city.hasPort,
        hasUniversity: city.hasUniversity,
        marketDays: city.marketDays,
        parentCode: city.parentCode
      }
    };
  }

  private formatOpenStreetMapResult(item: OpenStreetMapResponse): GeocodingResult | ReverseGeocodingResult {
    const components: Record<string, unknown> = {};
    const metadata: Record<string, unknown> = {};
    
    if (item.address) {
      components.road = item.address.road;
      components.city = item.address.city || item.address.town || item.address.village;
      components.county = item.address.county;
      components.region = item.address.state;
      components.state = item.address.state;
      components.country = item.address.country;
      components.countryCode = item.address.country_code;
      components.isoCode = item.address['ISO3166-2-lvl4'];
      components.postalCode = item.address.postcode;
    }

    // Try to match with Mauritania data using search terms
    if (components.city) {
      const cityStr = String(components.city);
      const matchedCity = MAURITANIA_CITIES.find(city => 
        city.searchTerms?.some(term => 
          term.toLowerCase().includes(cityStr.toLowerCase()) ||
          cityStr.toLowerCase().includes(term.toLowerCase())
        ) ||
        city.name.toLowerCase() === cityStr.toLowerCase() ||
        city.nameAr.includes(cityStr)
      );
      
      if (matchedCity) {
        Object.assign(metadata, {
          code: matchedCity.code,
          isCapital: matchedCity.isCapital,
          economicImportance: matchedCity.economicImportance,
          population: matchedCity.population,
          hasAirport: matchedCity.hasAirport,
          hasPort: matchedCity.hasPort,
          hasUniversity: matchedCity.hasUniversity,
          parentCode: matchedCity.parentCode
        });
      }
    }

    // Check region search terms from CITY_TO_REGION_MAP
    if (components.region) {
      const regionStr = String(components.region);
      Object.entries(CITY_TO_REGION_MAP).forEach(([code, terms]) => {
        if ((terms as string[]).some(term => term.toLowerCase().includes(regionStr.toLowerCase()))) {
          const region = getWilayaByCode(code);
          if (region) {
            Object.assign(metadata, {
              regionCode: region.code,
              regionImportance: region.economicImportance,
              regionPopulation: region.population
            });
          }
        }
      });
    }

    return {
      address: item.display_name,
      coordinates: { 
        lat: parseFloat(item.lat), 
        lng: parseFloat(item.lon)
      },
      confidence: this.calculateOpenStreetMapConfidence(item),
      type: this.mapOpenStreetMapType(item),
      components,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };
  }

  private formatGoogleResult(result: NonNullable<GoogleGeocodingResponse['results']>[0]): GeocodingResult | ReverseGeocodingResult {
    const components: Record<string, unknown> = {};
    const metadata: Record<string, unknown> = {};
    
    result.address_components?.forEach((component) => {
      if (component.types.includes('locality')) {
        components.city = component.long_name;
      } else if (component.types.includes('administrative_area_level_1')) {
        components.region = component.long_name;
      } else if (component.types.includes('country')) {
        components.country = component.long_name;
        components.countryCode = component.short_name?.toLowerCase();
      } else if (component.types.includes('postal_code')) {
        components.postalCode = component.long_name;
      } else if (component.types.includes('route')) {
        components.road = component.long_name;
      }
    });

    // Try to match with Mauritania data using search terms
    if (components.city && typeof components.city === 'string') {
      const cityName = components.city as string;
      const matchedCity = MAURITANIA_CITIES.find(city => 
        city.searchTerms?.some(term => 
          term.toLowerCase().includes(cityName.toLowerCase()) ||
          cityName.toLowerCase().includes(term.toLowerCase())
        ) ||
        city.name.toLowerCase() === cityName.toLowerCase() ||
        city.nameAr.includes(cityName)
      );
      
      if (matchedCity) {
        Object.assign(metadata, {
          code: matchedCity.code,
          isCapital: matchedCity.isCapital,
          economicImportance: matchedCity.economicImportance,
          population: matchedCity.population
        });
      }
    }

    return {
      address: result.formatted_address,
      coordinates: {
        lat: result.geometry?.location?.lat ?? 0,
        lng: result.geometry?.location?.lng ?? 0
      },
      confidence: this.mapGoogleConfidence(result.geometry?.location_type ?? ''),
      type: this.mapGoogleType(result.types && result.types.length > 0 ? result.types[0] : ''),
      components,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };
  }

  private formatMapboxResult(feature: NonNullable<MapboxGeocodingResponse['features']>[0]): GeocodingResult | ReverseGeocodingResult {
    const components: Record<string, unknown> = {};
    const metadata: Record<string, unknown> = {};
    
    feature.context?.forEach((item) => {
      if (item.id?.startsWith('place.')) {
        components.city = item.text;
      } else if (item.id?.startsWith('region.')) {
        components.region = item.text;
      } else if (item.id?.startsWith('country.')) {
        components.country = item.text;
        components.countryCode = item.short_code;
      } else if (item.id?.startsWith('postcode.')) {
        components.postalCode = item.text;
      }
    });

    // Try to match with Mauritania data using search terms
    if (components.city && typeof components.city === 'string') {
      const cityName = components.city as string;
      const matchedCity = MAURITANIA_CITIES.find(city => 
        city.searchTerms?.some(term => 
          term.toLowerCase().includes(cityName.toLowerCase()) ||
          cityName.toLowerCase().includes(term.toLowerCase())
        ) ||
        city.name.toLowerCase() === cityName.toLowerCase() ||
        city.nameAr.includes(cityName)
      );
      
      if (matchedCity) {
        Object.assign(metadata, {
          code: matchedCity.code,
          isCapital: matchedCity.isCapital,
          economicImportance: matchedCity.economicImportance,
          population: matchedCity.population
        });
      }
    }

    return {
      address: feature.place_name || feature.text || '',
      coordinates: { 
        lat: feature.center && feature.center.length > 1 ? feature.center[1] : 0, 
        lng: feature.center && feature.center.length > 0 ? feature.center[0] : 0 
      },
      confidence: feature.relevance || 0.5,
      type: feature.place_type && feature.place_type.length > 0 && feature.place_type[0] ? this.mapMapboxType(feature.place_type[0]) : 'address',
      components,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + 
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateOpenStreetMapConfidence(item: OpenStreetMapResponse): number {
    if (item.importance) {
      return Math.min(1, item.importance * 1.2);
    }
    return 0.7;
  }

  private mapOpenStreetMapType(item: OpenStreetMapResponse): 'address' | 'city' | 'region' | 'landmark' {
    if (item.address?.road) {
      return 'address';
    }
    
    const type = item.type || item.class || '';
    const typeMap: Record<string, 'address' | 'city' | 'region' | 'landmark'> = {
      city: 'city',
      town: 'city',
      village: 'city',
      hamlet: 'city',
      state: 'region',
      province: 'region',
      country: 'region',
      road: 'address',
      street: 'address',
      building: 'address',
      amenity: 'landmark',
      tourism: 'landmark'
    };
    
    return typeMap[type] || 'address';
  }

  private mapGoogleConfidence(locationType: string): number {
    const confidenceMap: Record<string, number> = {
      'ROOFTOP': 0.95,
      'RANGE_INTERPOLATED': 0.8,
      'GEOMETRIC_CENTER': 0.7,
      'APPROXIMATE': 0.5
    };
    return confidenceMap[locationType] || 0.5;
  }

  private mapGoogleType(googleType: string): 'address' | 'city' | 'region' | 'landmark' {
    const typeMap: Record<string, 'address' | 'city' | 'region' | 'landmark'> = {
      street_address: 'address',
      route: 'address',
      intersection: 'address',
      locality: 'city',
      administrative_area_level_1: 'region',
      administrative_area_level_2: 'region',
      country: 'region',
      point_of_interest: 'landmark',
      park: 'landmark',
      airport: 'landmark'
    };
    return typeMap[googleType] || 'address';
  }

  private mapMapboxType(mapboxType: string): 'address' | 'city' | 'region' | 'landmark' {
    const typeMap: Record<string, 'address' | 'city' | 'region' | 'landmark'> = {
      address: 'address',
      poi: 'landmark',
      place: 'city',
      region: 'region',
      country: 'region',
      postcode: 'address'
    };
    return typeMap[mapboxType] || 'address';
  }

  private deduplicateResults<T extends GeocodingResult | ReverseGeocodingResult>(results: T[]): T[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = `${result.coordinates.lat.toFixed(4)},${result.coordinates.lng.toFixed(4)}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Utility method to get all search terms for debugging
  public getAllSearchTerms(): Record<string, Record<string, string[]>> {
    return {
      regions: Object.fromEntries(this.regionSearchTermsCache),
      cities: Object.fromEntries(this.citySearchTermsCache)
    };
  }
}