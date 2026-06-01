/**
 * GeocodingService factory - singleton instance for dependency injection.
 * Use this instead of `new GeocodingService(...)` in hooks/components.
 */
import { GeocodingService } from '@/application/services/GeocodingService';

let instance: GeocodingService | null = null;

export const getGeocodingService = (): GeocodingService => {
  if (!instance) {
    instance = new GeocodingService({
      userAgent: 'MauritaniaMapper/1.0 (workspace-enhancement)',
      prioritizeLocal: true,
    });
  }
  return instance;
};
