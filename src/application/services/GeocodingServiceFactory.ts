/**
 * GeocodingService factory — singleton instance for dependency injection.
 *
 * Single source of truth for the geocoding configuration (provider, country
 * bias, user-agent). Hooks, components and services MUST consume the factory
 * via `getGeocodingService()` instead of calling `new GeocodingService(...)`
 * directly, so we keep a single Nominatim user-agent and rate-limit budget.
 */
import { GeocodingService } from '@/application/services/GeocodingService';

let instance: GeocodingService | null = null;

export const getGeocodingService = (): GeocodingService => {
  if (!instance) {
    instance = new GeocodingService({
      provider: 'openstreetmap',
      userAgent: 'Hadratech-GPI/1.0 (geocoding-factory)',
      prioritizeLocal: true,
    });
  }
  return instance;
};

// Convenience alias used by some legacy modules.
export const GeocodingServiceFactory = { getInstance: getGeocodingService };
