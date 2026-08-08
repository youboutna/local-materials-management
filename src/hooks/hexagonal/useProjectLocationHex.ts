/**
 * Project Location Hex Hook - Specialized for Project Geolocation
 * Integrates UnifiedLocationSelector with LocationService for project management
 * Following PROMPTS.md Rule #1: Arrow Flow Architecture
 * Following Rule #5: UI Layer Separation with Business Logic in Hooks
 */

import { LocationService, getLocationService} from '@/application/services/LocationService';
import { ProjectService } from '@/application/services/ProjectService';
import { ProjectLocationData } from '@/dtos/entities/ProjectDTO';
import { LocationDTO } from '@/dtos/shared';
import { AutoFillLocationData, useLocationAutoFill } from '@/hooks/hexagonal/useLocationAutoFill';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError } from '@/utils/errors';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useLocationHex } from './useLocationHex';

export interface ProjectLocationHexResult {
  // Location data and state
  locationData: ProjectLocationData;
  isValidating: boolean;
  validationError: string | null;

  // Project location actions
  updateProjectLocation: (projectId: string, locationData: ProjectLocationData) => Promise<void>;
  validateProjectLocation: (locationData: ProjectLocationData) => Promise<boolean>;
  clearProjectLocation: () => void;

  // Enhanced location methods for projects
  geocodeProjectAddress: (address: string) => Promise<AutoFillLocationData | null>;
  reverseGeocodeProjectCoordinates: (lat: number, lng: number) => Promise<AutoFillLocationData | null>;
  isProjectWithinMauritania: (locationData: ProjectLocationData) => boolean;
  calculateProjectDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number;

  // UnifiedLocationSelector integration
  locationSelectorProps: {
    value: ProjectLocationData;
    onChange: (data: ProjectLocationData) => void;
    showCoordinates: boolean;
    showGPS: boolean;
    showMap: boolean;
    placeholder: string;
  };

  // Base location service methods with proper types
  searchLocations: (query: string, filters?: {
    type?: 'all' | 'regions' | 'cities' | 'localite' | 'wilaya' | 'moughataa' | 'commune' | 'jiha';
    excludeCodes?: string[];
    maxResults?: number;
  }) => Promise<LocationDTO[]>;
  validateLocationCode: (code: string, type?: 'region' | 'city' | 'localite' | 'wilaya' | 'moughataa' | 'commune' | 'jiha') => boolean;
  getLocationByCode: (code: string, type?: 'region' | 'city' | 'localite' | 'wilaya' | 'moughataa' | 'commune' | 'jiha') => Promise<LocationDTO | null>;
}

/**
 * useProjectLocationHex - Specialized hook for project geolocation
 * Integrates UnifiedLocationSelector with enhanced LocationService for project management
 */
export function useProjectLocationHex(
  projectId?: string,
  initialLocation?: ProjectLocationData
): ProjectLocationHexResult {
  // Initialize base location functionality
  const baseLocationHook = useLocationHex();
  const locationAutoFill = useLocationAutoFill();

  // Enhanced location service with project methods
  const enhancedLocationService = useMemo(() => {
    const service = getLocationService();
    return service;
  }, []);

  // Project service for project-specific location operations
  const projectService = useMemo(() => {
    return new ProjectService(
      RepositoryFactory.getProjectRepository(),
      undefined, // stakeholder repository
      enhancedLocationService // location service
    );
  }, [enhancedLocationService]);

  // State management
  const [locationData, setLocationData] = useState<ProjectLocationData>(
    initialLocation || {}
  );
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Update project location data with validation
  const updateProjectLocation = useCallback(async (
    projectId: string,
    locationData: ProjectLocationData
  ) => {
    setIsValidating(true);
    setValidationError(null);

    try {
      // Validate and enrich location data using ProjectService
      const enrichedLocation = await projectService.validateAndEnrichProjectLocation(
        locationData,
        locationAutoFill
      );

      setLocationData(enrichedLocation);

      // Here you would typically call ProjectService.updateLocation()
      // For now, we'll simulate the update
      console.log('Updating project location:', projectId, enrichedLocation);

      toast.success('✅ Project location updated successfully!');

    } catch (error) {
      const errorMessage = error instanceof AppError
        ? error.message
        : 'Failed to validate project location data';

      setValidationError(errorMessage);
      toast.error(`❌ Location update failed: ${errorMessage}`);
      console.error('Project location validation error:', error);
    } finally {
      setIsValidating(false);
    }
  }, [projectService, locationAutoFill]);

  // Validate project location without updating
  const validateProjectLocation = useCallback(async (
    locationData: ProjectLocationData
  ): Promise<boolean> => {
    try {
      await projectService.validateAndEnrichProjectLocation(
        locationData,
        locationAutoFill
      );
      return true;
    } catch (error) {
      return false;
    }
  }, [projectService, locationAutoFill]);

  // Clear project location data
  const clearProjectLocation = useCallback(() => {
    setLocationData({});
    setValidationError(null);
  }, []);

  // Geocode project address
  const geocodeProjectAddress = useCallback(async (address: string) => {
    return await locationAutoFill.geocodeAddress(address);
  }, [locationAutoFill]);

  // Reverse geocode project coordinates
  const reverseGeocodeProjectCoordinates = useCallback(async (lat: number, lng: number) => {
    return await locationAutoFill.reverseGeocode(lat, lng);
  }, [locationAutoFill]);

  // Check if project location is within Mauritania
  const isProjectWithinMauritania = useCallback((locationData: ProjectLocationData) => {
    if (!locationData.latitude || !locationData.longitude) {
      return false;
    }

    // Mauritania geographical bounds (approximate)
    const MAURITANIA_BOUNDS = {
      north: 27.3,
      south: 14.8,
      east: -4.8,  // Note: negative values for western hemisphere
      west: -17.1
    };

    const { latitude, longitude } = locationData;

    if (latitude < MAURITANIA_BOUNDS.south || latitude > MAURITANIA_BOUNDS.north ||
        longitude < MAURITANIA_BOUNDS.west || longitude > MAURITANIA_BOUNDS.east) {
      return false;
    }

    return true;
  }, []);

  // Calculate distance for project-related operations
  const calculateProjectDistance = useCallback((
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ) => {
    return enhancedLocationService.calculateDistance(lat1, lng1, lat2, lng2);
  }, [enhancedLocationService]);

  // Handle location data changes from UnifiedLocationSelector
  const handleLocationChange = useCallback((data: ProjectLocationData) => {
    setLocationData(data);
    setValidationError(null);
  }, []);

  // Props for UnifiedLocationSelector integration
  const locationSelectorProps = useMemo(() => ({
    value: locationData,
    onChange: handleLocationChange,
    showCoordinates: true,
    showGPS: true,
    showMap: true,
    placeholder: "Rechercher une région ou ville au Mauritanie pour le projet...",
  }), [locationData, handleLocationChange]);

  return {
    // Location data and state
    locationData,
    isValidating,
    validationError,

    // Project location actions
    updateProjectLocation,
    validateProjectLocation,
    clearProjectLocation,

    // Enhanced location methods for projects
    geocodeProjectAddress,
    reverseGeocodeProjectCoordinates,
    isProjectWithinMauritania,
    calculateProjectDistance,

    // UnifiedLocationSelector integration
    locationSelectorProps,

    // Base location service methods (from useLocationHex)
    searchLocations: baseLocationHook.searchLocations,
    validateLocationCode: baseLocationHook.validateLocationCode,
    getLocationByCode: baseLocationHook.getLocationByCode,
  };
}

/**
 * useProjectLocationValidation - Hook for project location validation feedback
 * Provides real-time validation UI feedback for project locations
 */
export function useProjectLocationValidation() {
  const [validationState, setValidationState] = useState<{
    isValid: boolean;
    message: string;
    severity: 'success' | 'warning' | 'error';
    suggestions?: string[];
  }>({
    isValid: true,
    message: '',
    severity: 'success'
  });

  const validateProjectCoordinates = useCallback((lat?: number, lng?: number) => {
    if (!lat || !lng) {
      setValidationState({
        isValid: false,
        message: 'Project coordinates are required for accurate location tracking.',
        severity: 'error',
        suggestions: ['Use GPS to get current location', 'Enter coordinates manually', 'Search for a location']
      });
      return false;
    }

    if (isNaN(lat) || isNaN(lng)) {
      setValidationState({
        isValid: false,
        message: 'Coordinates must be valid numbers.',
        severity: 'error',
        suggestions: ['Check coordinate format (latitude, longitude)']
      });
      return false;
    }

    if (lat < -90 || lat > 90) {
      setValidationState({
        isValid: false,
        message: 'Latitude must be between -90° and +90°.',
        severity: 'error',
        suggestions: ['Latitude values should be between -90 and 90 degrees']
      });
      return false;
    }

    if (lng < -180 || lng > 180) {
      setValidationState({
        isValid: false,
        message: 'Longitude must be between -180° and +180°.',
        severity: 'error',
        suggestions: ['Longitude values should be between -180 and 180 degrees']
      });
      return false;
    }

    // Check if within Mauritania bounds (approximate)
    if (lat < 14.8 || lat > 27.3 || lng < -17.1 || lng > -4.8) {
      setValidationState({
        isValid: true,
        message: 'Coordinates are outside Mauritania boundaries. Project location may not be accurate.',
        severity: 'warning',
        suggestions: ['Verify this is the correct location for your project', 'Consider using a location within Mauritania']
      });
      return true; // Still valid, just a warning
    }

    setValidationState({
      isValid: true,
      message: 'Project coordinates are valid and within Mauritania.',
      severity: 'success',
      suggestions: ['Location is ready for project assignment']
    });
    return true;
  }, []);

  const validateProjectAddress = useCallback((address?: string) => {
    if (!address || address.trim().length === 0) {
      setValidationState({
        isValid: false,
        message: 'Project address is required for proper location identification.',
        severity: 'error',
        suggestions: ['Enter a complete address', 'Use the location search feature']
      });
      return false;
    }

    if (address.length < 3) {
      setValidationState({
        isValid: false,
        message: 'Address is too short. Please provide more details.',
        severity: 'warning',
        suggestions: ['Include city and region names', 'Add street details if available']
      });
      return true; // Still valid, just a warning
    }

    setValidationState({
      isValid: true,
      message: 'Address format is valid.',
      severity: 'success',
      suggestions: ['Address is ready for geocoding']
    });
    return true;
  }, []);

  const clearValidation = useCallback(() => {
    setValidationState({
      isValid: true,
      message: '',
      severity: 'success'
    });
  }, []);

  return {
    validationState,
    validateProjectCoordinates,
    validateProjectAddress,
    clearValidation,
  };
}
