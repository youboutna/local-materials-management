/**
 * Location Repository Interface
 * Following PROMPTS.md Rule #1: Arrow Flow Architecture
 * Defines the contract for location data access
 */

import { Location } from '../entities/Location';

export interface ILocationRepository {
  /**
   * Find a location by its ID
   */
  findById(id: string): Promise<Location | null>;

  /**
   * Find all locations
   */
  findAll(): Promise<Location[]>;

  /**
   * Find all regions
   */
  findAllRegions(): Promise<Location[]>;

  /**
   * Find all cities
   */
  findAllCities(): Promise<Location[]>;

  /**
   * Find a region by code
   */
  findRegionByCode(code: string): Promise<Location | null>;

  /**
   * Find a city by code
   */
  findCityByCode(code: string): Promise<Location | null>;

  /**
   * Find cities by region code
   */
  findCitiesByRegion(regionCode: string): Promise<Location[]>;

  /**
   * Search locations by query
   */
  searchLocations(query: string, filters?: {
    type?: 'all' | 'regions' | 'cities';
    excludeCodes?: string[];
    maxResults?: number;
  }): Promise<Location[]>;

  /**
   * Find locations near coordinates
   */
  findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
    limit?: number
  ): Promise<Location[]>;

  /**
   * Save a location (create or update)
   */
  save(location: Location): Promise<Location>;

  /**
   * Delete a location by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a location code exists
   */
  exists(code: string): Promise<boolean>;

  /**
   * Count locations by type
   */
  countByType(type: 'region' | 'city'): Promise<number>;
}
