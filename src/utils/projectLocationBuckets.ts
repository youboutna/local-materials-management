import type { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { findRegionByLocation } from '@/utils/mauritaniaUtils';

const DEFAULT_LOCATION_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

const NATIONAL_LOCATION_PATTERNS = [/\bnational\b/i, /\bmauritanie\b/i, /\bpays\b/i];

type ProjectCoordinatesLike = Pick<ProjectDTO, 'latitude' | 'longitude' | 'coordinates'>;

export const getProjectCoordinates = (project: ProjectCoordinatesLike) => {
  const latitude = project.latitude ?? project.coordinates?.latitude;
  const longitude = project.longitude ?? project.coordinates?.longitude;

  if (
    typeof latitude !== 'number' ||
    !Number.isFinite(latitude) ||
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude)
  ) {
    return undefined;
  }

  return { latitude, longitude };
};

export const normalizeProjectRegionName = (location?: string | null) => {
  if (!location?.trim()) return 'Non spécifié';

  const normalizedLocation = location.trim();
  const matchedRegion = findRegionByLocation(normalizedLocation);

  if (matchedRegion) {
    return matchedRegion.name;
  }

  if (NATIONAL_LOCATION_PATTERNS.some((pattern) => pattern.test(normalizedLocation))) {
    return 'National';
  }

  return normalizedLocation;
};

export const buildLocationDistribution = (
  projects: Array<Pick<ProjectDTO, 'location'>>,
  colors: string[] = DEFAULT_LOCATION_COLORS,
) => {
  const locationCounts = projects.reduce<Record<string, number>>((acc, project) => {
    const regionName = normalizeProjectRegionName(project.location);
    acc[regionName] = (acc[regionName] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(locationCounts)
    .map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }))
    .sort((a, b) => b.value - a.value);
};