import type { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import type { InterventionZoneDTO } from '@/dtos/entities/InterventionZoneDTO';
import { findRegionByLocation } from '@/utils/mauritaniaUtils';
import { MAURITANIA_CITIES, MAURITANIA_REGIONS } from '@/utils/mauritania';

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

type ProjectCoordinatesLike = Pick<ProjectDTO, 'latitude' | 'longitude' | 'coordinates'> & {
  location?: string | null;
};

const normalizeLocationText = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

export const getProjectCoordinates = (project: ProjectCoordinatesLike) => {
  const latitude = project.latitude ?? project.coordinates?.latitude;
  const longitude = project.longitude ?? project.coordinates?.longitude;

  if (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude)
  ) {
    return { latitude, longitude };
  }

  if (!project.location?.trim()) return undefined;
  const location = normalizeLocationText(project.location);
  const city = MAURITANIA_CITIES.find((candidate) =>
    location.includes(normalizeLocationText(candidate.name)) ||
    location.includes(normalizeLocationText(candidate.nameAr)),
  );
  if (city) return { latitude: city.lat, longitude: city.lng };

  const region = MAURITANIA_REGIONS.find((candidate) =>
    location.includes(normalizeLocationText(candidate.name)) ||
    location.includes(normalizeLocationText(candidate.nameAr)),
  );
  return region ? { latitude: region.lat, longitude: region.lng } : undefined;
};

/**
 * Résout une localisation textuelle/coordonnée vers le point cartographique
 * canonique consommé par le workflow d'édition et le détail projet.
 *
 * Une adresse issue d'un import (ex. "Aleg, Mauritanie") reste une adresse,
 * mais devient aussi un point de référence quand aucune géométrie n'a été
 * dessinée. Le point est ensuite persisté normalement si l'utilisateur sauve
 * l'étape Localisation.
 */
export const getProjectLocationPoint = (
  project: ProjectCoordinatesLike,
): InterventionZoneDTO | undefined => {
  const coordinates = getProjectCoordinates(project);
  if (!coordinates) return undefined;

  const normalizedLocation = project.location
    ? normalizeLocationText(project.location)
    : '';
  const city = normalizedLocation
    ? MAURITANIA_CITIES.find((candidate) =>
        normalizedLocation.includes(normalizeLocationText(candidate.name)) ||
        normalizedLocation.includes(normalizeLocationText(candidate.nameAr)),
      )
    : undefined;
  const region = city
    ? MAURITANIA_REGIONS.find((candidate) => candidate.code === city.parentCode)
    : normalizedLocation
    ? MAURITANIA_REGIONS.find((candidate) =>
        normalizedLocation.includes(normalizeLocationText(candidate.name)) ||
        normalizedLocation.includes(normalizeLocationText(candidate.nameAr)),
      )
    : undefined;

  return {
    type: 'point',
    coordinates: [{ lat: coordinates.latitude, lng: coordinates.longitude }],
    label: city?.name ?? region?.name ?? project.location?.trim() ?? 'Localisation',
    address: project.location?.trim() || undefined,
    cityCode: city?.code,
    regionCode: city?.parentCode ?? region?.code,
    geocodingMeta: {
      provider: city || region ? 'mauritania-referential' : 'project-coordinates',
      confidence: city || region ? 1 : undefined,
      displayName: project.location?.trim() || city?.name || region?.name,
    },
  };
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