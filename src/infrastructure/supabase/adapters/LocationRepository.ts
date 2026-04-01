// @ts-nocheck
/**
 * Location Repository Implementation
 * Infrastructure layer for location data access
 * Following PROMPTS.md Rule #1: Arrow Flow Architecture
 */

import { ILocationRepository } from '@/domain/repositories/LocationRepository';
import { Location, MapLocation } from '@/domain/entities/Location';
import { AppError, DatabaseError } from '@/utils/errors';
import { supabase } from '@/integrations/supabase/client';

/**
 * Supabase implementation of LocationRepository
 * Handles all location data persistence operations
 */
export class LocationRepository implements ILocationRepository {
  private readonly tableName = 'locations';

  /**
   * Find a location by its ID
   */
  async findById(id: string): Promise<Location | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new DatabaseError(`Error finding location by ID: ${error.message}`, error);
      }

      if (!data) {
        return null;
      }

      return this.mapRowToLocation(data);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding location by ID', error);
    }
  }

  /**
   * Find all locations
   */
  async findAll(): Promise<Location[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw new DatabaseError(`Error finding all locations: ${error.message}`, error);
      }

      return data.map(row => this.mapRowToLocation(row));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding all locations', error);
    }
  }

  /**
   * Find all regions
   */
  async findAllRegions(): Promise<Location[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .in('type', ['region', 'wilaya'])
        .order('name', { ascending: true });

      if (error) {
        throw new DatabaseError(`Error finding all regions: ${error.message}`, error);
      }

      return data.map(row => this.mapRowToLocation(row));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding all regions', error);
    }
  }

  /**
   * Find all cities
   */
  async findAllCities(): Promise<Location[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('type', 'city')
        .order('name', { ascending: true });

      if (error) {
        throw new DatabaseError(`Error finding all cities: ${error.message}`, error);
      }

      return data.map(row => this.mapRowToLocation(row));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding all cities', error);
    }
  }

  /**
   * Find a region by code
   */
  async findRegionByCode(code: string): Promise<Location | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('code', code)
        .in('type', ['region', 'wilaya'])
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw new DatabaseError(`Error finding region by code: ${error.message}`, error);
      }

      return this.mapRowToLocation(data);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding region by code', error);
    }
  }

  /**
   * Find a city by code
   */
  async findCityByCode(code: string): Promise<Location | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('code', code)
        .eq('type', 'city')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw new DatabaseError(`Error finding city by code: ${error.message}`, error);
      }

      return this.mapRowToLocation(data);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding city by code', error);
    }
  }

  /**
   * Find cities by region code
   */
  async findCitiesByRegion(regionCode: string): Promise<Location[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('type', 'city')
        .eq('parent_code', regionCode)
        .order('name', { ascending: true });

      if (error) {
        throw new DatabaseError(`Error finding cities by region: ${error.message}`, error);
      }

      return data.map(row => this.mapRowToLocation(row));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding cities by region', error);
    }
  }

  /**
   * Search locations by query
   */
  async searchLocations(query: string, filters?: {
    type?: 'all' | 'regions' | 'cities';
    excludeCodes?: string[];
    maxResults?: number;
  }): Promise<Location[]> {
    try {
      let supabaseQuery = supabase
        .from(this.tableName)
        .select('*');

      // Apply type filter
      if (filters?.type && filters.type !== 'all') {
        if (filters.type === 'regions') {
          supabaseQuery = supabaseQuery.in('type', ['region', 'wilaya']);
        } else if (filters.type === 'cities') {
          supabaseQuery = supabaseQuery.eq('type', 'city');
        } else {
          supabaseQuery = supabaseQuery.eq('type', filters.type);
        }
      }

      // Apply search filter
      if (query) {
        supabaseQuery = supabaseQuery.or(
          `name.ilike.%${query}%,name_ar.ilike.%${query}%,code.ilike.%${query}%`
        );
      }

      // Apply exclude filter
      if (filters?.excludeCodes && filters.excludeCodes.length > 0) {
        supabaseQuery = supabaseQuery.not('code', 'in', `(${filters.excludeCodes.join(',')})`);
      }

      // Apply limit
      if (filters?.maxResults) {
        supabaseQuery = supabaseQuery.limit(filters.maxResults);
      }

      const { data, error } = await supabaseQuery.order('name', { ascending: true });

      if (error) {
        throw new DatabaseError(`Error searching locations: ${error.message}`, error);
      }

      return data.map(row => this.mapRowToLocation(row));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error searching locations', error);
    }
  }

  /**
   * Find locations near coordinates
   */
  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
    limit?: number
  ): Promise<Location[]> {
    try {
      // For now, we'll use a simple box query
      // In a real implementation, you'd use PostGIS for proper distance calculations
      const latDelta = radiusKm / 111; // Approximate degrees per km
      const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

      let supabaseQuery = supabase
        .from(this.tableName)
        .select('*')
        .gte('latitude', latitude - latDelta)
        .lte('latitude', latitude + latDelta)
        .gte('longitude', longitude - lngDelta)
        .lte('longitude', longitude + lngDelta);

      if (limit) {
        supabaseQuery = supabaseQuery.limit(limit);
      }

      const { data, error } = await supabaseQuery.order('name', { ascending: true });

      if (error) {
        throw new DatabaseError(`Error finding nearby locations: ${error.message}`, error);
      }

      return data.map(row => this.mapRowToLocation(row));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding nearby locations', error);
    }
  }

  /**
   * Save a location (create or update)
   */
  async save(location: Location): Promise<Location> {
    try {
      const locationData = this.mapLocationToRow(location);
      
      if (location.id) {
        // Update existing location
        const { data, error } = await supabase
          .from(this.tableName)
          .update(locationData)
          .eq('id', location.id)
          .select()
          .single();

        if (error) {
          throw new DatabaseError(`Error updating location: ${error.message}`, error);
        }

        return this.mapRowToLocation(data);
      } else {
        // Create new location
        const { data, error } = await supabase
          .from(this.tableName)
          .insert(locationData)
          .select()
          .single();

        if (error) {
          throw new DatabaseError(`Error creating location: ${error.message}`, error);
        }

        return this.mapRowToLocation(data);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error saving location', error);
    }
  }

  /**
   * Delete a location by ID
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new DatabaseError(`Error deleting location: ${error.message}`, error);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error deleting location', error);
    }
  }

  /**
   * Check if a location code exists
   */
  async exists(code: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('code', code)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new DatabaseError(`Error checking location existence: ${error.message}`, error);
      }

      return !!data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error checking location existence', error);
    }
  }

  /**
   * Count locations by type
   */
  async countByType(type: 'region' | 'city'): Promise<number> {
    try {
      const dbTypes = type === 'region' ? ['region', 'wilaya'] : [type];
      const { data, error } = await supabase
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .in('type', dbTypes);

      if (error) {
        throw new DatabaseError(`Error counting locations by type: ${error.message}`, error);
      }

      return data?.length || 0;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error counting locations by type', error);
    }
  }

  /**
   * Map database row to Location entity
   */
  private mapRowToLocation(row: Record<string, unknown>): Location {
    // Normalize 'wilaya' → 'region' for domain consistency
    const rawType = row.type as string;
    const normalizedType = rawType === 'wilaya' ? 'region' : rawType;
    
    return new Location({
      id: row.id,
      code: row.code,
      name: row.name,
      nameAr: row.name_ar,
      type: normalizedType,
      coordinates: row.latitude && row.longitude ? {
        lat: row.latitude,
        lng: row.longitude
      } : undefined,
      parentCode: row.parent_code,
      economicImportance: row.economic_importance,
      population: row.population ? Number(row.population) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    });
  }

  /**
   * Map Location entity to database row
   */
  private mapLocationToRow(location: Location): Record<string, unknown> {
    return {
      id: location.id,
      code: location.code,
      name: location.name,
      name_ar: location.nameAr,
      type: location.type,
      latitude: location.coordinates?.lat,
      longitude: location.coordinates?.lng,
      parent_code: location.parentCode,
      economic_importance: location.economicImportance,
      population: location.population,
      created_at: location.createdAt?.toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}
