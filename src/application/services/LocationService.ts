/**
 * Location Service
 * Application layer service for location operations
 * Following PROMPTS.md Rule #1: Arrow Flow Architecture
 * UI → Service → Domain ← Infrastructure
 */

import { ILocationRepository } from '@/domain/repositories/LocationRepository';
import { LocationDTO } from '@/dtos/shared';
import { LocationTransformer } from '@/dtos/transforms/LocationTransformer';
import { AppError } from '@/utils/errors';

/**
 * Location Service
 * Handles all location-related business logic
 */
export class LocationService {
  constructor(private locationRepository: ILocationRepository) {}

  /**
   * Get all regions
   */
  async getAllRegions(): Promise<LocationDTO[]> {
    try {
      const regions = await this.locationRepository.findAllRegions();
      return regions.map(region => LocationTransformer.toDTO(region));
    } catch (error) {
      throw new AppError('Failed to fetch regions', 'LOCATION_SERVICE_ERROR', error);
    }
  }

  /**
   * Get all cities
   */
  async getAllCities(): Promise<LocationDTO[]> {
    try {
      const cities = await this.locationRepository.findAllCities();
      return cities.map(city => LocationTransformer.toDTO(city));
    } catch (error) {
      throw new AppError('Failed to fetch cities', 'LOCATION_SERVICE_ERROR', error);
    }
  }

  /**
   * Get all locations (regions and cities combined)
   */
  async findAll(): Promise<LocationDTO[]> {
    try {
      const locations = await this.locationRepository.findAll();
      return locations.map(location => LocationTransformer.toDTO(location));
    } catch (error) {
      throw new AppError('Failed to fetch all locations', 'LOCATION_SERVICE_ERROR', error);
    }
  }

  /**
   * Get location by code
   */
  async getLocationByCode(code: string, type: 'region' | 'city'): Promise<LocationDTO | null> {
    try {
      const location = type === 'region' 
        ? await this.locationRepository.findRegionByCode(code)
        : await this.locationRepository.findCityByCode(code);
      
      return location ? LocationTransformer.toDTO(location) : null;
    } catch (error) {
      throw new AppError(`Failed to fetch ${type} by code`, 'LOCATION_SERVICE_ERROR', error);
    }
  }

  /**
   * Get cities in region
   */
  async getCitiesByRegion(regionCode: string): Promise<LocationDTO[]> {
    try {
      const cities = await this.locationRepository.findCitiesByRegion(regionCode);
      return cities.map(city => LocationTransformer.toDTO(city));
    } catch (error) {
      throw new AppError('Failed to fetch cities by region', 'LOCATION_SERVICE_ERROR', error);
    }
  }

  /**
   * Search locations
   */
  async searchLocations(query: string, filters?: {
    type?: 'all' | 'regions' | 'cities';
    excludeCodes?: string[];
    maxResults?: number;
  }): Promise<LocationDTO[]> {
    try {
      const locations = await this.locationRepository.searchLocations(query, filters);
      return locations.map(location => LocationTransformer.toDTO(location));
    } catch (error) {
      throw new AppError('Failed to search locations', 'LOCATION_SERVICE_ERROR', error);
    }
  }

  /**
   * Create a new location
   */
  async createLocation(locationData: Omit<LocationDTO, 'id'>): Promise<LocationDTO> {
    try {
      // Validate location data
      this.validateLocationData(locationData);

      // Convert to domain entity
      const locationEntity = LocationTransformer.fromDTO(locationData as LocationDTO);

      // Save to repository
      const savedLocation = await this.locationRepository.save(locationEntity);

      // Return DTO
      return LocationTransformer.toDTO(savedLocation);
    } catch (error) {
      throw new AppError('Failed to create location', 'LOCATION_SERVICE_ERROR', error);
    }
  }

  /**
   * Update an existing location
   */
  async updateLocation(id: string, updates: Partial<LocationDTO>): Promise<LocationDTO> {
    try {
      // Get existing location
      const existingLocation = await this.locationRepository.findById(id);
      if (!existingLocation) {
        throw new AppError('Location not found', 'LOCATION_NOT_FOUND');
      }

      // Merge updates
      const mergedData = { ...existingLocation, ...updates };
      const updatedEntity = LocationTransformer.fromDTO(mergedData as LocationDTO);

      // Save to repository
      const savedLocation = await this.locationRepository.save(updatedEntity);

      // Return DTO
      return LocationTransformer.toDTO(savedLocation);
    } catch (error) {
      throw new AppError('Failed to update location', 'LOCATION_SERVICE_ERROR', error);
    }
  }

  /**
   * Delete a location
   */
  async deleteLocation(id: string): Promise<void> {
    try {
      // Check if location exists
      const existingLocation = await this.locationRepository.findById(id);
      if (!existingLocation) {
        throw new AppError('Location not found', 'LOCATION_NOT_FOUND');
      }

      // Delete from repository
      await this.locationRepository.delete(id);
    } catch (error) {
      throw new AppError('Failed to delete location', 'LOCATION_SERVICE_ERROR', error);
    }
  }

  /**
   * Validate location coordinates
   */
  validateCoordinates(latitude: number, longitude: number): boolean {
    // Basic coordinate validation
    return (
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180 &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    );
  }

  /**
   * Calculate distance between two locations
   */
  calculateDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
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
   * Find nearest locations to a point
   */
  async findNearestLocations(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 10,
    limit: number = 10
  ): Promise<LocationDTO[]> {
    try {
      const locations = await this.locationRepository.findNearby(
        latitude, 
        longitude, 
        radiusKm, 
        limit
      );
      
      return locations.map(location => ({
        ...LocationTransformer.toDTO(location),
        distance: this.calculateDistance(
          latitude, 
          longitude, 
          location.coordinates?.lat || 0, 
          location.coordinates?.lng || 0
        )
      }));
    } catch (error) {
      throw new AppError('Failed to find nearest locations', 'LOCATION_SERVICE_ERROR', error);
    }
  }

  /**
   * Get location statistics
   */
  async getLocationStatistics(): Promise<{
    totalRegions: number;
    totalCities: number;
    citiesByRegion: Record<string, number>;
    averageCitiesPerRegion: number;
  }> {
    try {
      const [regions, cities] = await Promise.all([
        this.getAllRegions(),
        this.getAllCities()
      ]);

      const citiesByRegion: Record<string, number> = {};
      
      // Count cities by region
      cities.forEach(city => {
        if (city.parentCode) {
          citiesByRegion[city.parentCode] = (citiesByRegion[city.parentCode] || 0) + 1;
        }
      });

      const averageCitiesPerRegion = regions.length > 0 
        ? cities.length / regions.length 
        : 0;

      return {
        totalRegions: regions.length,
        totalCities: cities.length,
        citiesByRegion,
        averageCitiesPerRegion
      };
    } catch (error) {
      throw new AppError('Failed to get location statistics', 'LOCATION_SERVICE_ERROR', error);
    }
  }

  /**
   * Private helper method to validate location data
   */
  private validateLocationData(locationData: Omit<LocationDTO, 'id'>): void {
    // Validate required fields
    if (!locationData.name || locationData.name.trim().length === 0) {
      throw new AppError('Location name is required', 'VALIDATION_ERROR');
    }

    if (!locationData.type || !['region', 'city'].includes(locationData.type)) {
      throw new AppError('Location type must be "region" or "city"', 'VALIDATION_ERROR');
    }

    if (!locationData.code || locationData.code.trim().length === 0) {
      throw new AppError('Location code is required', 'VALIDATION_ERROR');
    }

    // Validate coordinates if provided
    if (locationData.coordinates) {
      const { lat, lng } = locationData.coordinates;
      if (!this.validateCoordinates(lat, lng)) {
        throw new AppError('Invalid coordinates', 'VALIDATION_ERROR');
      }
    }

    // Validate parent code for cities
    if (locationData.type === 'city' && !locationData.parentCode) {
      throw new AppError('City must have a parent region code', 'VALIDATION_ERROR');
    }
  }

  /**
   * Format address data into a readable string
   */
  formatAddress(adresse: string | unknown[] | Record<string, unknown> | null | undefined): string {
    if (typeof adresse === 'string') {
      return adresse;
    }
    if (typeof adresse === 'object' && adresse !== null) {
      const addr = adresse as Record<string, unknown>;
      if (addr.address) return String(addr.address);
      if (addr.street) return String(addr.street);
      if (Array.isArray(adresse) && adresse.length > 0)
        return String(adresse[0]);
      return JSON.stringify(adresse);
    }
    return String(adresse);
  }

  /**
   * Private helper method to convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

let locationServiceInstance: LocationService | null = null;
export function getLocationService(): LocationService {
  if (!locationServiceInstance) {
    locationServiceInstance = new LocationService(RepositoryFactory.getLocationRepository());
  }
  return locationServiceInstance;
}
