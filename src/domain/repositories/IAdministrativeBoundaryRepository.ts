/**
 * Port : accès aux limites administratives (wilayas) sous forme de features GeoJSON.
 * Les implémentations vivent dans src/infrastructure/adapters/gis/.
 */
import type { AdministrativeBoundaryFeature } from '@/dtos/entities/AdministrativeBoundaryDTO';

export interface IAdministrativeBoundaryRepository {
  /** Retourne les features administratives (mise en cache côté adapter). */
  findAll(): Promise<AdministrativeBoundaryFeature[]>;
}
